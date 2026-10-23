import { afterEach, describe, expect, it, vi } from 'vitest'
import { forwardTextPilot, phonePlatform, smsBody, smsHref } from './text-pilot'

describe('phone path helpers', () => {
  it('tells iPhone, iPad and Android from desktop', () => {
    expect(phonePlatform('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)')).toBe('ios')
    expect(phonePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 5)).toBe('ios')
    expect(phonePlatform('Mozilla/5.0 (Linux; Android 14; Pixel 8)')).toBe('android')
    expect(phonePlatform('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', 0)).toBeNull()
    expect(phonePlatform('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBeNull()
  })

  it('writes the text with the code and the platform separator', () => {
    const body = smsBody('rent', 'R7K2QX')
    expect(body).toBe('Text me my rent breakdown (ref R7K2QX)')
    expect(smsHref('+14155954182', body, 'ios')).toBe('sms:+14155954182&body=Text%20me%20my%20rent%20breakdown%20(ref%20R7K2QX)')
    expect(smsHref('+14155954182', body, 'android').startsWith('sms:+14155954182?body=')).toBe(true)
    expect(smsBody('offer', 'ABC123')).toBe('Text me my offer breakdown (ref ABC123)')
  })
})

describe('forwardTextPilot phone path', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })
  const opts = {
    tool: 'rent' as const,
    urlEnv: 'RENTPILOT_URL' as const,
    buildPayload: (p: Record<string, unknown>) => (p.ok ? { id: 'run-1', result: { id: 'run-1' } } : null),
  }
  const req = (body: unknown) => new Request('http://x/api/rent-text', { method: 'POST', body: JSON.stringify(body) })

  it('ref forwards the result without a phone or consent and returns the code, the number and the id', async () => {
    vi.stubEnv('RENTPILOT_URL', 'http://backend/start')
    vi.stubEnv('RENTPILOT_KEY', 'k')
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ref: 'R7K2QX', to: '+14155954182' }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await forwardTextPilot(req({ method: 'ref', planData: { ok: true } }), opts)
    expect(await res.json()).toEqual({ ref: 'R7K2QX', to: '+14155954182', id: 'run-1' })
    const sent = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(sent).toMatchObject({ id: 'run-1', method: 'ref' })
    expect(sent.phone).toBeUndefined()
  })

  it('ref without a calculator result is refused before the backend', async () => {
    vi.stubEnv('RENTPILOT_URL', 'http://backend/start')
    vi.stubEnv('RENTPILOT_KEY', 'k')
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const res = await forwardTextPilot(req({ method: 'ref', planData: {} }), opts)
    expect(res.status).toBe(400)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('tap forwards only the id', async () => {
    vi.stubEnv('RENTPILOT_URL', 'http://backend/start')
    vi.stubEnv('RENTPILOT_KEY', 'k')
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetchMock)
    const res = await forwardTextPilot(req({ method: 'tap', id: 'run-1' }), opts)
    expect(res.status).toBe(204)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ id: 'run-1', method: 'tap' })
  })
})
