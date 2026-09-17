/**
 * Campaign mode.
 *
 * A visitor from a paid ad is not a visitor to this site. They came from inside
 * another app, they were promised one specific number, and they will leave in
 * seconds if they do not see it. So a campaign landing is the same tool with
 * the site taken off it: no navigation, no breadcrumb, no footer, and the
 * result already on screen rather than a form that would produce one.
 *
 * Explicit rather than inferred from a UTM. Organic traffic carries UTMs too —
 * from a newsletter, a shared link, a partner — and stripping the site off a
 * page for somebody who arrived from an email would be a worse experience than
 * the one it fixes. A campaign is a deliberate build, so it gets a deliberate
 * flag.
 *
 * Add `&campaign=1` to the destination URL in the ad.
 */

/** The query parameter an ad destination sets. */
export const CAMPAIGN_PARAM = 'campaign'

type SearchParams = Record<string, string | string[] | undefined>

export function isCampaign(searchParams: SearchParams | undefined): boolean {
  const raw = searchParams?.[CAMPAIGN_PARAM]
  const value = Array.isArray(raw) ? raw[0] : raw
  return value === '1' || value === 'true'
}

/**
 * Metadata for a campaign landing.
 *
 * noindex because it is the same content as the page that ranks, minus the
 * parts that make it a page. Left crawlable it competes with its own canonical
 * for the query it was built from. `follow` stays on so the links it does keep
 * are still worth something.
 */
export const CAMPAIGN_ROBOTS = { index: false, follow: true } as const
