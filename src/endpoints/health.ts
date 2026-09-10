import type { Endpoint } from 'payload'

export const health: Endpoint = {
  path: '/health',
  method: 'get',
  handler: async (req) => {
    try {
      await req.payload.count({ collection: 'pages', overrideAccess: true })
      return Response.json({ status: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
    } catch (error) {
      req.payload.logger.error({ err: error }, 'Health check failed')
      return Response.json(
        { status: 'unavailable' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } },
      )
    }
  },
}
