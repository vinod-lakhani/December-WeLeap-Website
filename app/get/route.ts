import { NextResponse } from 'next/server'

/**
 * /get — device-aware download redirect (the target of the QR code and any
 * "download the app" link).
 *
 * iOS → App Store, Android → Play, everything else (desktop, bots) → the
 * homepage, which shows both store badges. Kept as a single hop so the QR can
 * encode one stable URL and still route each phone to the right store.
 */
const APP_STORE = 'https://apps.apple.com/app/id6801673529'
const PLAY_STORE = 'https://play.google.com/store/apps/details?id=ai.weleap.app'

export function GET(request: Request) {
  const ua = request.headers.get('user-agent') || ''
  if (/iPhone|iPad|iPod/i.test(ua)) return NextResponse.redirect(APP_STORE)
  if (/Android/i.test(ua)) return NextResponse.redirect(PLAY_STORE)
  return NextResponse.redirect(new URL('/', request.url))
}
