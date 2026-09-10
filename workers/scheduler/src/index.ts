interface Env {
  CALENDAR_SYNC_SECRET: string
  PAYLOAD_JOBS_SECRET: string
  REGISTRATION_CLEANUP_SECRET: string
  REGISTRATION_DELIVERY_SECRET: string
  TARGET_URL: string
}

type ScheduledJob = {
  method?: 'GET' | 'POST'
  path: string
  secret: string
}

async function invoke(targetURL: string, job: ScheduledJob) {
  const response = await fetch(new URL(job.path, targetURL), {
    method: job.method ?? 'POST',
    headers: { authorization: `Bearer ${job.secret}` },
  })
  if (!response.ok) throw new Error(`${job.path} returned ${response.status}`)
}

export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext) {
    const minute = new Date(controller.scheduledTime).getUTCMinutes()
    const jobs: ScheduledJob[] = [
      {
        method: 'GET',
        path: '/api/payload-jobs/run?allQueues=true&limit=10',
        secret: env.PAYLOAD_JOBS_SECRET,
      },
    ]

    if (minute % 5 === 0) {
      jobs.push(
        { path: '/api/registration-delivery-process', secret: env.REGISTRATION_DELIVERY_SECRET },
        { path: '/api/registration-cleanup', secret: env.REGISTRATION_CLEANUP_SECRET },
      )
    }
    if (minute === 0) jobs.push({ path: '/api/calendar/sync', secret: env.CALENDAR_SYNC_SECRET })

    ctx.waitUntil(Promise.all(jobs.map((job) => invoke(env.TARGET_URL, job))))
  },
} satisfies ExportedHandler<Env>
