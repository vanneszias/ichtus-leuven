/**
 * Pulls the Cloudflare content of a deployed environment into the local
 * development stack and rewrites the generated starter content, so that
 * `pnpm dev` shows what editors see and `pnpm seed` reproduces it.
 *
 *   pnpm pull:content --env=staging
 *   pnpm pull:content --env=production --skip-media
 *
 * The remote database is only ever read. Everything it replaces locally is
 * written to `.wrangler/backups` first.
 */
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { copyFile, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'

import { deploymentEnvironments } from '@/lib/runtimeConfig'
import { SEED_MEDIA_DIRECTORY } from '@/seed/mediaFiles'

const ROOT = process.cwd()
const WRANGLER = path.join(ROOT, 'node_modules', '.bin', 'wrangler')
const BIOME = path.join(ROOT, 'node_modules', '.bin', 'biome')
const STATE_DIRECTORY = path.join(ROOT, '.wrangler', 'state')
const D1_OBJECT_PATH = path.join('v3', 'd1', 'miniflare-D1DatabaseObject')
const BACKUP_DIRECTORY = path.join(ROOT, '.wrangler', 'backups')

/**
 * D1 exports end with query-planner statistics that reference tables Cloudflare
 * manages itself, which a freshly created local database rejects.
 */
const STATISTICS_STATEMENT = /^(ANALYZE sqlite_schema;|INSERT INTO "sqlite_stat1")/

type Options = {
  environment: string
  keepDump: boolean
  skipDatabase: boolean
  skipMedia: boolean
  skipSeed: boolean
}

function parseOptions(argv: string[]): Options {
  const environment = argv.find((value) => value.startsWith('--env='))?.slice('--env='.length)
  if (!environment || !deploymentEnvironments.includes(environment as 'staging')) {
    throw new Error(
      `Pass the environment to pull from: --env=${deploymentEnvironments.join(' or --env=')}`,
    )
  }
  return {
    environment,
    keepDump: argv.includes('--keep-dump'),
    skipDatabase: argv.includes('--skip-db'),
    skipMedia: argv.includes('--skip-media'),
    skipSeed: argv.includes('--skip-seed'),
  }
}

function log(message: string) {
  console.log(message)
}

async function wrangler(args: string[], options: { capture?: boolean } = {}) {
  return new Promise<string>((resolve, reject) => {
    const child = spawn(WRANGLER, args, {
      cwd: ROOT,
      env: { ...process.env, CLOUDFLARE_ENV: '', CLOUDFLARE_REMOTE: '' },
      stdio: options.capture ? ['ignore', 'pipe', 'inherit'] : 'inherit',
    })
    let output = ''
    child.stdout?.on('data', (chunk) => {
      output += chunk
    })
    child.once('error', reject)
    child.once('exit', (code) =>
      code === 0
        ? resolve(output)
        : reject(new Error(`wrangler ${args.join(' ')} exited with code ${code}`)),
    )
  })
}

/** Runs a read-only query against a local D1 database and returns its rows. */
async function query<T>(sql: string, persistTo?: string): Promise<T[]> {
  const args = ['d1', 'execute', 'D1', '--local', '--command', sql, '--json']
  if (persistTo) args.push('--persist-to', persistTo)
  const output = await wrangler(args, { capture: true })
  const [result] = JSON.parse(output) as { results: T[] }[]
  return result?.results ?? []
}

/** Strips the trailing statistics statements a local database cannot replay. */
async function copyWithoutStatistics(source: string, destination: string) {
  const contents = await readFile(source, 'utf8')
  const statements = contents.split('\n').filter((line) => !STATISTICS_STATEMENT.test(line))
  await writeFile(destination, statements.join('\n'), 'utf8')
}

function bucketName(config: WranglerConfig, environment?: string) {
  const scope = environment ? config.env?.[environment] : config
  const bucket = scope?.r2_buckets?.[0]?.bucket_name
  if (!bucket)
    throw new Error(`No R2 bucket is configured for ${environment ?? 'local development'}`)
  return bucket
}

type WranglerScope = { r2_buckets?: { bucket_name?: string }[] }
type WranglerConfig = WranglerScope & { env?: Record<string, WranglerScope> }

/** Reads wrangler.jsonc, which allows comments and trailing commas. */
async function readWranglerConfig(): Promise<WranglerConfig> {
  const contents = await readFile(path.join(ROOT, 'wrangler.jsonc'), 'utf8')
  const withoutComments = contents
    .replace(/"(?:[^"\\]|\\.)*"|\/\*[\s\S]*?\*\/|\/\/[^\n]*/g, (match) =>
      match.startsWith('"') ? match : '',
    )
    .replace(/,(\s*[}\]])/g, '$1')
  return JSON.parse(withoutComments) as WranglerConfig
}

async function backupLocalDatabase(stamp: string) {
  await mkdir(BACKUP_DIRECTORY, { recursive: true })
  const destination = path.join(BACKUP_DIRECTORY, `${stamp}-local-d1.sql`)
  try {
    await wrangler(['d1', 'export', 'D1', '--local', '--output', destination, '-y'])
    log(`   Local database backed up to ${path.relative(ROOT, destination)}`)
  } catch {
    log('   No local database to back up yet')
  }
}

async function pullDatabase(options: Options, temporary: string, stamp: string) {
  log(`\n1. Exporting the ${options.environment} database`)
  const schema = path.join(temporary, 'schema.sql')
  const data = path.join(temporary, 'data.sql')
  const exportArgs = ['d1', 'export', 'D1', `--env=${options.environment}`, '--remote', '-y']
  await wrangler([...exportArgs, '--no-data', '--output', schema])
  await wrangler([...exportArgs, '--no-schema', '--output', data])

  log('\n2. Rebuilding the local database')
  await backupLocalDatabase(stamp)
  const staged = path.join(temporary, 'state')
  await mkdir(staged, { recursive: true })
  const cleanSchema = path.join(temporary, 'schema.clean.sql')
  const cleanData = path.join(temporary, 'data.clean.sql')
  await copyWithoutStatistics(schema, cleanSchema)
  await copyWithoutStatistics(data, cleanData)
  await wrangler([
    'd1',
    'execute',
    'D1',
    '--local',
    '--persist-to',
    staged,
    '--file',
    cleanSchema,
    '-y',
  ])
  await wrangler([
    'd1',
    'execute',
    'D1',
    '--local',
    '--persist-to',
    staged,
    '--file',
    cleanData,
    '-y',
  ])

  const [counts] = await query<Record<string, number>>(
    `SELECT (SELECT count(*) FROM pages) AS pages,
            (SELECT count(*) FROM media) AS media,
            (SELECT count(*) FROM events) AS events`,
    staged,
  )
  if (!counts?.pages)
    throw new Error('The exported database contains no pages, so it was not installed')
  log(`   Staged ${counts.pages} pages, ${counts.media} media files and ${counts.events} events`)

  await installDatabase(staged, stamp)
  log('   Installed into .wrangler/state')
}

/**
 * Swaps the staged database files into the state directory `pnpm dev` reads.
 * Only the database files are replaced, so other locally persisted bindings
 * keep working.
 */
async function installDatabase(staged: string, stamp: string) {
  const source = path.join(staged, D1_OBJECT_PATH)
  const destination = path.join(STATE_DIRECTORY, D1_OBJECT_PATH)
  const entries = await readdir(source)

  if (!existsSync(destination)) {
    await mkdir(destination, { recursive: true })
    for (const entry of entries) {
      await copyFile(path.join(source, entry), path.join(destination, entry))
    }
    return
  }

  const databases = entries.filter(
    (entry) => entry.endsWith('.sqlite') && entry !== 'metadata.sqlite',
  )
  const backup = path.join(BACKUP_DIRECTORY, `${stamp}-d1-files`)
  await mkdir(backup, { recursive: true })

  for (const database of databases) {
    // The write-ahead log belongs to the database file it was written for, so
    // stale companions are moved aside together with the database itself.
    const companions = entries.filter((entry) => entry.startsWith(database))
    for (const existing of await readdir(destination)) {
      if (!existing.startsWith(database)) continue
      await copyFile(path.join(destination, existing), path.join(backup, existing))
      await rm(path.join(destination, existing))
    }
    for (const companion of companions) {
      await copyFile(path.join(source, companion), path.join(destination, companion))
    }
  }
}

async function pullMedia(options: Options, temporary: string) {
  log('\n3. Copying media out of R2')
  const config = await readWranglerConfig()
  const remoteBucket = bucketName(config, options.environment)
  const localBucket = bucketName(config)
  const files = await query<{ filename: string; mimeType: string | null }>(
    'SELECT filename, mime_type AS mimeType FROM media WHERE filename IS NOT NULL',
  )
  const directory = path.join(temporary, 'media')
  await mkdir(directory, { recursive: true })

  const copied: string[] = []
  for (const file of files) {
    const target = path.join(directory, file.filename)
    try {
      await wrangler([
        'r2',
        'object',
        'get',
        `${remoteBucket}/${file.filename}`,
        '--remote',
        '--file',
        target,
      ])
      const put = [
        'r2',
        'object',
        'put',
        `${localBucket}/${file.filename}`,
        '--local',
        '--persist-to',
        STATE_DIRECTORY,
        '--file',
        target,
      ]
      if (file.mimeType) put.push('--content-type', file.mimeType)
      await wrangler(put)
      copied.push(file.filename)
    } catch {
      log(`   Skipped ${file.filename}, which is missing from ${remoteBucket}`)
    }
  }
  log(`   Copied ${copied.length} of ${files.length} media files into local R2`)
  return directory
}

/** Formats the generated modules the same way the rest of the repository is. */
async function format(files: string[]) {
  if (!files.length || !existsSync(BIOME)) return
  await new Promise<void>((resolve) => {
    const child = spawn(BIOME, ['check', '--write', ...files], { cwd: ROOT, stdio: 'ignore' })
    child.once('error', () => resolve())
    child.once('exit', () => resolve())
  })
}

/**
 * Regenerates `src/seed/starter` from the local database and copies the
 * media the starter content needs into the folder `pnpm seed` uploads from.
 */
async function regenerateSeed(mediaDirectory: string | undefined) {
  log('\n4. Regenerating the starter content')
  process.env.CLOUDFLARE_REMOTE = 'false'
  process.env.PAYLOAD_DB_PUSH = 'false'
  delete process.env.CLOUDFLARE_ENV
  // An explicit persist path wins, so the generator can be pointed at a copy.
  if (!process.env.CLOUDFLARE_PERSIST_PATH) delete process.env.CLOUDFLARE_PERSIST_PATH

  const [{ default: config }, { getPayload }, { writeStarterContent }] = await Promise.all([
    import('../payload.config'),
    import('payload'),
    import('../seed/collectStarterContent'),
  ])

  const payload = await getPayload({ config })
  const report = await writeStarterContent(payload, ROOT)

  const missing: string[] = []
  for (const filename of report.media) {
    const destination = path.join(ROOT, SEED_MEDIA_DIRECTORY, filename)
    const source = mediaDirectory ? path.join(mediaDirectory, filename) : undefined
    if (source && existsSync(source)) {
      await copyFile(source, destination)
    } else if (!existsSync(destination)) {
      missing.push(filename)
    }
  }

  await format(report.files)

  log(`   Wrote ${report.files.length} files for ${report.pages.length} pages`)
  log(`   Starter content uses ${report.media.length} media files`)
  for (const warning of report.warnings) log(`   Warning: ${warning}`)
  for (const filename of missing) {
    log(`   Warning: ${filename} is missing from ${SEED_MEDIA_DIRECTORY}, so seeding it will fail`)
  }
  return report
}

async function dispose() {
  const context = await (
    globalThis as typeof globalThis & {
      __ichtusCloudflareContext?: Promise<{ dispose?: () => Promise<void> }>
    }
  ).__ichtusCloudflareContext
  await context?.dispose?.()
}

async function main() {
  const options = parseOptions(process.argv.slice(2))
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const temporary = await mkdtemp(path.join(os.tmpdir(), 'ichtus-pull-'))

  log(`Pulling ${options.environment} content into local development.`)
  log('Stop `pnpm dev` first: the local database files are replaced.')

  try {
    if (!options.skipDatabase) await pullDatabase(options, temporary, stamp)
    else log('\n1-2. Skipped the database pull')

    const mediaDirectory = options.skipMedia ? undefined : await pullMedia(options, temporary)
    if (options.skipMedia) log('\n3. Skipped the media copy')

    if (!options.skipSeed) await regenerateSeed(mediaDirectory)
    else log('\n4. Skipped the starter content')

    log('\nDone. Review the diff, then run `pnpm generate:types` if the schema changed.')
  } finally {
    await dispose()
    if (options.keepDump) log(`\nKept the export in ${temporary}`)
    else await rm(temporary, { force: true, recursive: true })
  }
}

await main()
process.exit(0)
