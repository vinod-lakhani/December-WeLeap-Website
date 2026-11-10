import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { PAYCHECK_LOOP_POSTER, PAYCHECK_LOOP_SRC, PRODUCT_TOUR_POSTER, PRODUCT_TOUR_SRC } from './ProductTourVideo'

/**
 * The tour sits on /get, where most visitors arrive in an Instagram or Facebook
 * browser on mobile data and tap the store button above it. The rules pinned
 * here are the ones that would cost them something without anyone noticing:
 * a megabyte downloaded before it is wanted, a video that will not autoplay on
 * iOS, a broken path.
 */

const src = readFileSync(join(process.cwd(), 'components/ProductTourVideo.tsx'), 'utf8')
const code = src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')

describe('ProductTourVideo', () => {
  it('points at files that exist, and keeps the clip small', () => {
    for (const path of [PRODUCT_TOUR_SRC, PRODUCT_TOUR_POSTER, PAYCHECK_LOOP_SRC, PAYCHECK_LOOP_POSTER]) {
      expect(existsSync(join(process.cwd(), 'public', path)), `missing ${path}`).toBe(true)
    }
    // ~1 MB at 720x1280. A re-export at full resolution would be 2.5 MB+.
    expect(statSync(join(process.cwd(), 'public', PRODUCT_TOUR_SRC)).size).toBeLessThan(1_500_000)
    // The /get phone loop rides an in-app browser on cellular; keep it tiny.
    expect(statSync(join(process.cwd(), 'public', PAYCHECK_LOOP_SRC)).size).toBeLessThan(400_000)
  })

  it('loads nothing but the poster until it is on screen', () => {
    expect(code).toMatch(/preload="none"/)
    expect(code).toMatch(/poster=\{media\.poster\}/)
    expect(code).not.toMatch(/\bautoPlay\b/)
    expect(code).toMatch(/new IntersectionObserver/)
  })

  it('is muted in the DOM and inline, or iOS will not autoplay it', () => {
    expect(code).toMatch(/video\.muted = true/)
    expect(code).toMatch(/\bplaysInline\b/)
  })

  it('does not autoplay for visitors who asked for reduced motion', () => {
    expect(code).toMatch(/prefers-reduced-motion: reduce/)
    expect(code).toMatch(/if \(!reduce\)/)
    expect(code).toMatch(/controls=\{reducedMotion \|\| blocked\}/)
  })

  it('shows controls when the browser refuses autoplay, and counts the refusal once', () => {
    expect(code).toMatch(/name\?: unknown \} \| null\)\?\.name !== 'NotAllowedError'/)
    expect(code).toMatch(/setBlocked\(/)
    expect(code).toMatch(/track\('product_video_blocked'/)
    expect(code).toMatch(/autoplay: !reducedMotion && !blocked/)
  })
})
