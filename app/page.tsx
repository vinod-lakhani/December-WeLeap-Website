import type { Metadata } from "next"
import Component from "../weleap-landing"

/**
 * The homepage rendered as a passthrough with no metadata of its own, which
 * left "/" as the only indexable route on the site without a canonical — the
 * one page most likely to be reached with a tracking query string attached.
 *
 * Title and description still come from the root layout defaults, which are
 * already written for the homepage; only what is genuinely homepage-specific
 * is set here.
 */
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: {
    title: "WeLeap — Your AI Financial Sidekick",
    description:
      "One clear money move at a time — so you always know what to do next. WeLeap looks at your full financial picture and gives you the single next step.",
    url: "/",
  },
}

export default function Page() {
  return <Component />
}
