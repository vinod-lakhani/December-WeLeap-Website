/**
 * The chat's services in the browser: the same routes the tool pages call (/api/tax, /api/zori), and Ribbit for
 * typed questions (/api/ribbit-ask). Every failure comes back null, which the engine answers honestly ("I don't
 * have rental prices for…", "My answers are down for a moment") rather than with a guess.
 */
import type { AskResult, ChatServices } from './engine'
import { offerPlanData, rentPlanData } from './payload'

async function json<T>(res: Response): Promise<T | null> {
  return res.ok ? ((await res.json().catch(() => null)) as T | null) : null
}

export const browserServices: ChatServices = {
  async tax(salaryAnnual, state) {
    try {
      const res = await fetch('/api/tax', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ salaryAnnual, state }) })
      return await json(res)
    } catch {
      return null
    }
  },
  async metros(state) {
    try {
      const d = await json<{ options?: { label: string; value: string }[] }>(await fetch(`/api/zori?state=${encodeURIComponent(state)}`))
      return Array.isArray(d?.options) ? d!.options! : []
    } catch {
      return []
    }
  },
  async medianRent(stateName, regionName) {
    try {
      const d = await json<{ medianRent?: number }>(await fetch(`/api/zori?state=${encodeURIComponent(stateName)}&region=${encodeURIComponent(regionName)}`))
      return typeof d?.medianRent === 'number' && d.medianRent > 0 ? d.medianRent : null
    } catch {
      return null
    }
  },
  async ask({ flow, facts, message, step, history, thread }) {
    try {
      const planData = flow === 'offer' ? offerPlanData(facts) : rentPlanData(facts)
      const res = await fetch('/api/ribbit-ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow, planData, message, step, thread,
          history: history.map((h) => ({ role: h.from === 'in' ? 'user' : 'assistant', text: h.text })),
        }),
      })
      // A rate-limited caller still gets the route's own reply text.
      return (await res.json().catch(() => null)) as AskResult | null
    } catch {
      return null
    }
  },
}
