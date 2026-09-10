import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

process.env.PAYLOAD_DB_PUSH = 'false'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: 'node',
    fileParallelism: false,
    isolate: false,
    maxWorkers: 1,
    testTimeout: 15_000,
    setupFiles: ['./vitest.setup.ts'],
    include: ['tests/int/**/*.int.spec.{ts,tsx}', 'tests/config/**/*.spec.ts'],
  },
})
