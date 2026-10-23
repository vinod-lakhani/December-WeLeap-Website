import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ADS_CONVERSIONS, GOOGLE_ADS_ID, UNWIRED_WEB_SIGNUP_LABEL, fireAdsConversion } from './google-ads'

/**
 * Four conversion actions were created in AW-18514097818 on 19 Oct 2025 and
 * their `send_to` labels handed over. Three of them have a weleap.ai event
 * that honestly fires them; the fourth does not, and these tests exist mostly
 * to keep that distinction from quietly collapsing.
 *
 * The expensive failure here is not an exception — it is a conversion that
 * fires when it should not. A conversion from localhost, or a sign-up reported
 * from a click that only started one, is a number a bidding algorithm then
 * spends real money acting on, and it looks identical to a correct one.
 */

const gtag = vi.fn()

function stubWindow(hostname: string, withGtag = true) {
  vi.stubGlobal('window', {
    location: { hostname },
    ...(withGtag ? { gtag } : {}),
  })
}

beforeEach(() => gtag.mockClear())
afterEach(() => vi.unstubAllGlobals())

describe('the label table', () => {
  it('wires exactly the four events this site can honestly fire', () => {
    expect(Object.keys(ADS_CONVERSIONS).sort()).toEqual([
      'store_link_clicked',
      'text_optin_submitted',
      'tool_completed',
      'tool_cta_clicked',
    ])
  })

  it('never wires web_signup, which happens on another domain', () => {
    /**
     * A completed sign-up fires `user_signed_up` on weleap.app. The two
     * candidates here are both clicks: `tool_cta_clicked` is already its own
     * conversion, and `cta_click_signup` means the sign-up was STARTED.
     * Pointing either at the Sign-up action would report sign-ups that never
     * happened — and it is a one-line change that no other test would catch.
     */
    expect(Object.values(ADS_CONVERSIONS)).not.toContain(UNWIRED_WEB_SIGNUP_LABEL)
    expect(ADS_CONVERSIONS.cta_click_signup).toBeUndefined()
    expect(ADS_CONVERSIONS.web_signup).toBeUndefined()
  })

  it('gives every event its own label in the account', () => {
    const labels = Object.values(ADS_CONVERSIONS)
    expect(new Set(labels).size).toBe(labels.length)
    for (const label of labels) {
      expect(label).toMatch(new RegExp(`^${GOOGLE_ADS_ID}/[A-Za-z0-9_-]{15,}$`))
    }
    // Sharing a label with the unused action would silently double-count it.
    expect(labels).not.toContain(UNWIRED_WEB_SIGNUP_LABEL)
  })
})

describe('fireAdsConversion', () => {
  it('sends the label for a wired event', () => {
    stubWindow('www.weleap.ai')
    fireAdsConversion('tool_completed')
    expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: ADS_CONVERSIONS.tool_completed,
    })
  })

  it('reports the /get store tap, whose event name predates the action name', () => {
    stubWindow('weleap.ai')
    fireAdsConversion('store_link_clicked')
    expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: ADS_CONVERSIONS.store_link_clicked,
    })
  })

  it('reports the text opt-in under the Ads action text_optin', () => {
    stubWindow('weleap.ai')
    fireAdsConversion('text_optin_submitted')
    expect(gtag).toHaveBeenCalledWith('event', 'conversion', {
      send_to: 'AW-18514097818/du0vCJv0r6YdEJrtmvxE',
    })
  })

  it('ignores events that are not conversions', () => {
    stubWindow('www.weleap.ai')
    for (const e of ['tool_viewed', 'tool_engaged', 'cta_click_signup', 'rent_form_submit']) {
      fireAdsConversion(e)
    }
    expect(gtag).not.toHaveBeenCalled()
  })

  it('stays silent off the production host', () => {
    // A preview deployment and a dev session both reach real tool code. A
    // conversion from either teaches the bidder something untrue.
    for (const host of ['localhost', '127.0.0.1', 'weleap-website-git-main.vercel.app', 'weleap.app']) {
      stubWindow(host)
      fireAdsConversion('tool_completed')
      vi.unstubAllGlobals()
    }
    expect(gtag).not.toHaveBeenCalled()
  })

  it('does not throw when the tag never loaded', () => {
    stubWindow('www.weleap.ai', false)
    expect(() => fireAdsConversion('tool_completed')).not.toThrow()
  })

  it('does not throw when the tag does', () => {
    gtag.mockImplementation(() => {
      throw new Error('blocked by an extension')
    })
    stubWindow('www.weleap.ai')
    expect(() => fireAdsConversion('tool_completed')).not.toThrow()
    gtag.mockReset()
  })

  it('is a no-op on the server', () => {
    vi.stubGlobal('window', undefined)
    expect(() => fireAdsConversion('tool_completed')).not.toThrow()
    expect(gtag).not.toHaveBeenCalled()
  })
})
