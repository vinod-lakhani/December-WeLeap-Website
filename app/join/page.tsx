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
          <h1 className={cn(TYPOGRAPHY.h1, "text-white mb-4")}>Join the Waitlist</h1>
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
    <Suspense fallback={
      <PageShell>
        <Section variant="brand" className="min-h-[40vh] flex items-center justify-center">
          <p className="text-white/80">Loading...</p>
        </Section>
      </PageShell>
    }>
      <JoinContent />
    </Suspense>
  )
}
