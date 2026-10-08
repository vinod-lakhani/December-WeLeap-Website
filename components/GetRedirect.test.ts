import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const src = readFileSync(join(process.cwd(), 'components/GetRedirect.tsx'), 'utf8')
const page = readFileSync(join(process.cwd(), 'app/get/page.tsx'), 'utf8')

/**
 * /get stopped redirecting, and the reasons are specific enough to pin.
 *
 * Campaign 2 sent 45 US visitors here on 6-7 Oct. The page redirected to the
 * store on load and Apple counted 2 product page views from 13 redirects — the
 * other 11 never arrived. A script-driven navigation out of Meta's in-app
 * browser lands on Apple's web PREVIEW rather than the App Store app, so the
 * campaign token is lost and most people swipe back.
 *
 * Every assertion here is one of the things that fixed it. They read as
 * pedantic until somebody re-adds a redirect "just for iOS" and the campaign
 * silently stops converting again.
 */
describe('no automatic redirect, on any device', () => {
  it('never navigates by script on load', () => {
    expect(src).not.toMatch(/window\.location\.replace/)
    expect(src).not.toMatch(/setTimeout\([^)]*location/)
  })

  it('fires nothing on load — not the pixel, not PostHog', () => {
    /**
     * `Lead` used to fire on page load, so Meta was optimising for "tapped the
     * ad" rather than "intended to install". Those are very different
     * populations and only one is worth paying for.
     */
    const effects = [...src.matchAll(/useEffect\(\(\) => \{([\s\S]*?)\}, \[/g)].map((m) => m[1]).join(' ')
    expect(effects).not.toContain('fbq(')
    expect(effects).not.toContain('store_link_clicked')
  })
})

describe('the button', () => {
  it('is a real anchor with the store URL already in its href', () => {
    /**
     * The whole fix. An in-app browser hands off to the App Store app on a
     * genuine link activation and does not when script navigates — so the href
     * has to be present, not assigned later.
     */
    expect(src).toMatch(/<a\s+href=\{storeHref\}/)
    expect(src).toMatch(/onClick=\{\(\) => onStoreTap\(storeName, storeHref\)\}/)
  })

  it('is resolved from the request, not after hydration', () => {
    // The device comes from the User-Agent header on the server, so the right
    // button ships in the HTML. A href that appears only after hydration is a
    // script navigation for anyone who taps immediately.
    expect(page).toMatch(/headers\(\)\.get\('user-agent'\)/)
    expect(page).toMatch(/function deviceFromUserAgent/)
    expect(src).toMatch(/const device = initialDevice/)
  })

  it('says the right thing per store', () => {
    expect(src).toMatch(/device === 'ios' \? 'Get the app' : 'Get it on Google Play'/)
    expect(src).toMatch(/Free to start\./)
  })
})

describe('the tap', () => {
  it('sends both events with one shared id', () => {
    // So a Conversions API copy can dedupe against the pixel later.
    const handler = src.slice(src.indexOf('const onStoreTap'), src.indexOf('/* ── Phones'))
    expect(handler).toMatch(/const eventId = newEventId\(\)/)
    expect(handler).toMatch(/fbq\('track', 'Lead', \{ content_name: appStoreCampaignToken\(utm\) \}, \{ eventID: eventId \}\)/)
    expect(handler).toMatch(/event_id: eventId/)
    expect(handler).toMatch(/trigger: 'tap'/)
    expect(handler).toMatch(/platform: device/)
    // One id per tap, used by both calls.
    expect((handler.match(/newEventId\(\)/g) ?? []).length).toBe(1)
  })

  it('never blocks the navigation on an analytics call', () => {
    /**
     * The anchor's default action is what opens the store. Awaiting a beacon
     * before letting it go would be paying for our own friction — the same
     * mistake the old redirect made from the other direction.
     */
    const handler = src.slice(src.indexOf('const onStoreTap'), src.indexOf('/* ── Phones'))
    expect(handler).not.toMatch(/await/)
    expect(handler).not.toMatch(/preventDefault/)
    expect(handler).toMatch(/\.catch\(\(\) => \{\}\)/)
  })

  it('keeps the property names saved insights already read', () => {
    // store/source/campaign/device/medium/content/term/store_url/event_id were
    // there before. platform and trigger are added, not swapped in.
    for (const key of ['store,', 'source:', 'campaign:', 'device,', 'medium:', 'content:', 'term:', 'store_url:', 'event_id:']) {
      expect(src, key).toContain(key)
    }
  })
})

describe('desktop', () => {
  it('keeps the QR and routes badge taps through the same handler', () => {
    // Otherwise the two surfaces report the same action under different
    // events, and a desktop install goes missing from the phone's funnel.
    expect(src).toMatch(/qr-get-app\.png/)
    expect(src).toMatch(/onStoreClick=\{onStoreTap\}/)
  })
})
