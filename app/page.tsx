import type { Metadata } from "next"
import Component from "../weleap-landing"
import { JsonLd } from "@/components/JsonLd"
import { faqSchema } from "@/lib/structured-data"
import { HOME_FAQS } from "@/lib/home-faqs"

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
  return (
    <>
      {/* FAQPage built from the same array the landing page renders. The
          answers are now in the served HTML whether or not a question is open,
          which is the condition that makes this markup honest — previously
          only the first of six was. */}
      <JsonLd data={faqSchema(HOME_FAQS, "/")} />
      <Component />
    </>
  )
}
