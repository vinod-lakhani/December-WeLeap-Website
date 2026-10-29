import { describe, expect, it } from 'vitest'

import { FREE_TOOLS } from './tools'
import { SITE_URL, toolsBreadcrumbSchema, toolsItemListSchema } from './structured-data'

/**
 * The /tools hub's schema, which is the one place on the site where a list of
 * tools is asserted to a crawler rather than rendered as cards.
 *
 * The thing worth testing is not the shape of the JSON — it is that the list
 * is DERIVED. The hub previously emitted no list at all, and the obvious way
 * to add one is to type the ten entries out, which works until the eleventh
 * tool ships and the markup quietly describes a set the page does not render.
 * These assertions fail the moment the two can disagree.
 */
describe('toolsItemListSchema', () => {
  it('lists every registered tool, in registry order', () => {
    const items = toolsItemListSchema().itemListElement

    expect(items).toHaveLength(FREE_TOOLS.length)
    expect(items.map((i) => i.position)).toEqual(FREE_TOOLS.map((_, i) => i + 1))
    expect(items.map((i) => i.url)).toEqual(FREE_TOOLS.map((t) => `${SITE_URL}${t.href}`))
  })

  it('uses the name and blurb the card itself renders', () => {
    const items = toolsItemListSchema().itemListElement

    expect(items.map((i) => i.name)).toEqual(FREE_TOOLS.map((t) => t.name))
    expect(items.map((i) => i.description)).toEqual(FREE_TOOLS.map((t) => t.blurb))
  })

  it('agrees with its own numberOfItems', () => {
    const list = toolsItemListSchema()
    expect(list.numberOfItems).toBe(list.itemListElement.length)
  })

  /**
   * Not a style preference. `scripts/checkMetadata.js` identifies a calculator
   * by the presence of WebApplication and then requires at least seven FAQ
   * entries on the page. /tools asks no questions, so typing WebApplication
   * here would leave somebody choosing between a red build and seven invented
   * ones. A hub is an ItemList.
   */
  it('does not claim to be a calculator', () => {
    const json = JSON.stringify(toolsItemListSchema())
    expect(json).not.toContain('WebApplication')
    expect(toolsItemListSchema()['@type']).toBe('ItemList')
  })
})

describe('toolsBreadcrumbSchema', () => {
  it('ends at /tools, because /tools is the page', () => {
    const crumbs = toolsBreadcrumbSchema().itemListElement

    expect(crumbs.map((c) => c.name)).toEqual(['Home', 'Free money tools'])
    expect(crumbs.map((c) => c.item)).toEqual([SITE_URL, `${SITE_URL}/tools`])
  })

  /**
   * The leaf trails rendered by ToolBreadcrumb name the hub as their second
   * item. If the label here ever drifts from the one there, the same node is
   * described two different ways across eleven pages.
   */
  it('names the hub the same way the leaf breadcrumbs do', () => {
    const hub = toolsBreadcrumbSchema().itemListElement[1]
    expect(hub.name).toBe('Free money tools')
    expect(hub.item).toBe(`${SITE_URL}/tools`)
  })
})
