"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { EarlyAccessDialog } from "@/components/early-access-dialog"
import { PageShell, Section, Container } from "@/components/layout"
import { TYPOGRAPHY } from "@/lib/layout-constants"
import { cn } from "@/lib/utils"
import Link from "next/link"

function JoinContent() {
  const searchParams = useSearchParams()
  const ref = searchParams.get("ref") ?? undefined

  return (
    <PageShell>
      <Section variant="brand" className="text-center min-h-[40vh] flex flex-col justify-center">
        <Container maxWidth="narrow">
          <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-4")}>Create free account</h1>
          <p className={cn(TYPOGRAPHY.body, "text-white/85 max-w-xl mx-auto mb-8")}>
            Be the first to know when our self-service app launches with AI-powered financial guidance.
          </p>
          <div className="flex justify-center">
            <EarlyAccessDialog
              signupType="join_page"
              placement="join_page"
              referralSource={ref}
              variant="page"
            />
          </div>
          <p className={cn(TYPOGRAPHY.subtext, "text-white/70 mt-6")}>
            <Link href="/" className="underline hover:text-white">
              ← Back to home
            </Link>
          </p>
        </Container>
      </Section>
    </PageShell>
  )
}

export default function JoinPage() {
  return (
    /**
     * The fallback carries the hero, not a spinner.
     *
     * Only `ref` needs useSearchParams, but the whole page sat behind this
     * boundary — so the served HTML was the word "Loading" and the <h1> existed
     * for nobody. Same defect that made /allocator ship no heading at all.
     * Repeating the hero here means the served markup always has exactly one
     * h1, and a visitor on a slow connection sees the page rather than a
     * placeholder. The interactive dialog is the only thing that waits.
     */
    <Suspense fallback={
      <PageShell>
        <Section variant="brand" className="text-center min-h-[40vh] flex flex-col justify-center">
          <Container maxWidth="narrow">
            <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-4")}>Create free account</h1>
            <p className={cn(TYPOGRAPHY.body, "text-white/85 max-w-xl mx-auto")}>
              Be the first to know when our self-service app launches with AI-powered financial guidance.
            </p>
          </Container>
        </Section>
      </PageShell>
    }>
      <JoinContent />
    </Suspense>
  )
}
