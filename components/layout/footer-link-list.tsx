"use client"

/**
 * The footer's link columns.
 *
 * A client island rather than part of the server-rendered footer, for one
 * reason: it needs the current path. The "Free tools" column is built from
 * FREE_TOOLS, so on a tool page one of its entries points at the page you are
 * already on. Tapping it either does nothing visible or silently reloads
 * without the query string — and on a campaign landing that means losing
 * `campaign=1`. PostHog recorded rage clicks on exactly that link.
 *
 * Tap targets are 44px, Apple's minimum. They were 18px: an 14.5px line with
 * no padding, stacked 10px apart at the bottom of a 19-screen page. Of the
 * seven rage clicks on 15 Oct, two were people missing a footer link and
 * trying again. The height comes from `min-h-11` on the link itself with the
 * gap reduced to match, so the targets do not overlap each other — a 44px box
 * every 28px would mean tapping one link and hitting its neighbour.
 */

import Link from "next/link"
import { usePathname } from "next/navigation"

export interface FooterLink {
  t: string
  u: string
}

export function FooterLinkList({ links }: { links: FooterLink[] }) {
  const pathname = usePathname()

  return (
    <ul className="grid gap-1">
      {links.map((l) => {
        const isCurrent = l.u === pathname
        return (
          <li key={l.t}>
            {isCurrent ? (
              <span
                aria-current="page"
                className="inline-flex min-h-11 items-center text-[14.5px] text-faint"
              >
                {l.t}
              </span>
            ) : (
              <Link
                href={l.u}
                className="inline-flex min-h-11 items-center text-[14.5px] text-ink-soft hover:text-brand-700"
              >
                {l.t}
              </Link>
            )}
          </li>
        )
      })}
    </ul>
  )
}
