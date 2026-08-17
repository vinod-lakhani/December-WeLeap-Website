import Image from "next/image"
import Link from "next/link"
import { Container } from "./container"
import { FREE_TOOLS } from "@/lib/tools"

/**
 * Shared site footer.
 *
 * Every page previously carried its own inline copy of a footer (27 of them),
 * which is why the legal disclaimer and nav links drifted. One component now,
 * so a change lands everywhere.
 *
 * The "Free tools" column is derived from FREE_TOOLS, the same registry the
 * sitemap and structured data read. Hardcoding it had already gone wrong twice
 * over: it listed four of seven tools, and the one it did list for the Money
 * Plan was /leap-impact-simulator — a route that 308s to /allocator, so the
 * site's only sitewide internal link block was spending link equity on a
 * redirect. All seven are listed; this is the main internal-linking surface for
 * the acquisition pages, so a tall column beats a truncated one.
 */
export function SiteFooter() {
  const columns = [
    {
      h: "Product",
      links: [
        { t: "How it works", u: "/#how-it-works" },
        { t: "Free tools", u: "/tools" },
        { t: "Pricing", u: "/pricing" },
      ],
    },
    {
      h: "Free tools",
      links: FREE_TOOLS.map((t) => ({ t: t.name, u: t.href })),
    },
    {
      h: "Company",
      links: [
        { t: "About", u: "/about" },
        { t: "Resources", u: "/resources" },
        { t: "Privacy Policy", u: "/privacy-policy" },
        { t: "Terms of Service", u: "/terms-of-service" },
      ],
    },
  ]

  return (
    <footer className="border-t border-hairline bg-white py-14">
      <Container maxWidth="wide">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Image
              src="/images/weleap-logo.png"
              alt="WeLeap"
              width={2972}
              height={845}
              sizes="99px"
              className="mb-3.5 h-7 w-auto"
            />
            <p className="max-w-[260px] text-[14.5px] leading-relaxed text-subtle">
              One clear money move at a time — so you always know what to do next.
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.h}>
              <div className="mb-3.5 text-xs font-extrabold uppercase tracking-[0.1em] text-faint">{col.h}</div>
              <ul className="grid gap-2.5">
                {col.links.map((l) => (
                  <li key={l.t}>
                    <Link href={l.u} className="text-[14.5px] text-ink-soft hover:text-brand-700">
                      {l.t}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-hairline pt-6 md:flex-row">
          <span className="text-[13.5px] text-faint">© 2026 WeLeap. All rights reserved.</span>
          <span className="max-w-[620px] text-[12.5px] leading-relaxed text-faint md:text-right">
            WeLeap is not a registered investment adviser and does not provide personalised investment advice.
          </span>
        </div>
      </Container>
    </footer>
  )
}
