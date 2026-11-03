import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A failed ask shows the chat's fallback line and leaves one log line saying why. The log never carries what the
 * person typed.
 */

const typed = '19.50 is my hourly'
const ask = () => new Request('http://localhost/api/ribbit-ask', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ flow: 'offer', message: typed, step: 'waiting for the base pay in the offer, yearly or hourly', thread: 't-1' }),
})

let logged: string[]
beforeEach(() => {
  logged = []
  vi.spyOn(console, 'error').mockImplementation((line: unknown) => { logged.push(String(line)) })
  vi.stubEnv('RENTPILOT_URL', 'http://backend.test/any')
  vi.stubEnv('RENTPILOT_KEY', 'k')
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

async function post() {
  vi.resetModules()
  const { POST } = await import('./route')
  return POST(ask())
}

describe('ribbit-ask failures are logged with the reason', () => {
  it('a backend error status', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('nope', { status: 500 })))
    const res = await post()
    expect(res.status).toBe(502)
    expect(logged).toHaveLength(1)
    expect(JSON.parse(logged[0])).toMatchObject({ at: 'ribbit-ask', reason: 'status', status: 500, flow: 'offer', thread: 't-1' })
    expect(logged[0]).not.toContain('19.50')
  })

  it('a timeout', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new DOMException('The operation was aborted due to timeout', 'TimeoutError') }))
    const res = await post()
    expect(res.status).toBe(502)
    expect(JSON.parse(logged[0])).toMatchObject({ reason: 'timeout', flow: 'offer' })
  })

  it('an unreachable backend', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('fetch failed') }))
    await post()
    expect(JSON.parse(logged[0])).toMatchObject({ reason: 'fetch_error', error: 'TypeError: fetch failed' })
  })

  it('missing env', async () => {
    vi.stubEnv('RENTPILOT_KEY', '')
    const res = await post()
    expect(res.status).toBe(503)
    expect(JSON.parse(logged[0])).toMatchObject({ reason: 'no_env', error: 'RENTPILOT_KEY unset' })
  })

  it('logs nothing when the backend answers', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ kind: 'question', reply: 'ok' }), { status: 200 })))
    const res = await post()
    expect(res.status).toBe(200)
    expect(logged).toEqual([])
  })
})
