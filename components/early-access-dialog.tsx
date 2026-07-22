"use client"

import type React from "react"

import { useCallback } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { appLink } from "@/lib/app-link"
import { track } from "@/lib/analytics"

/**
 * EarlyAccessDialog — now an attribution-aware "Create free account" CTA.
 *
 * Self-serve signup is open on the app, so this no longer collects an email
 * into a waitlist. Instead, every instance links to the app signup route and
 * carries attribution forward (stored UTMs + PostHog distinct_id) via appLink().
 *
 * The component name and props are preserved so the ~40 existing call sites
 * keep working; they now navigate to signup instead of opening an email modal.
 */
interface EarlyAccessDialogProps {
  children?: React.ReactNode
  /** Tracking label for the CTA type (e.g. "hero", "navigation", "pricing"). */
  signupType?: string
  /** Optional label for the CTA placement (e.g. "header", "footer"). */
  placement?: string
  /** Referral source for tracking (e.g. from ?ref=linkedin). */
  referralSource?: string
  /** When set, the parent controls visibility (legacy survey flow). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** When "page", renders an inline CTA card. Use for the dedicated /join page. */
  variant?: "dialog" | "page"
}

export function EarlyAccessDialog({
  children,
  signupType = "button",
  placement,
  referralSource,
  open: controlledOpen,
  onOpenChange,
  variant = "dialog",
}: EarlyAccessDialogProps) {
  const pathname = usePathname()

  const goToSignup = useCallback(() => {
    track("cta_click_signup", {
      signup_type: signupType,
      placement: placement ?? null,
      path: pathname || "/",
      ...(referralSource && { ref: referralSource }),
    })
    // Close any legacy controlled dialog before navigating away.
    onOpenChange?.(false)
    window.location.href = appLink()
  }, [signupType, placement, referralSource, pathname, onOpenChange])

  // Inline CTA card (dedicated /join page).
  if (variant === "page") {
    return (
      <div className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl border border-gray-200">
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Create your free account</h2>
          <p className="text-gray-600 mt-2">
            Get your AI financial sidekick in about 2 minutes. No waitlist — start today.
          </p>
        </div>
        <div className="mt-4">
          <div className="text-left text-gray-700 mb-4">
            <p className="font-semibold mb-2">What you get:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Your full financial picture in one place</li>
              <li>One clear next step — a smart Leap</li>
              <li>AI-powered guidance built around you</li>
              <li>Free to start</li>
            </ul>
          </div>
          <Button
            onClick={goToSignup}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium"
          >
            Create free account
          </Button>
        </div>
      </div>
    )
  }

  // Legacy controlled usage (e.g. opened from a survey): render a CTA panel
  // instead of the old email modal. When opened, it simply routes to signup.
  if (controlledOpen !== undefined && onOpenChange !== undefined) {
    if (!controlledOpen) return null
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => onOpenChange(false)}>
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-[425px] w-full" onClick={(e) => e.stopPropagation()}>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create your free account</h2>
          <p className="text-gray-600 mb-4">
            Start with your AI financial sidekick in about 2 minutes. No waitlist.
          </p>
          <Button
            onClick={goToSignup}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium"
          >
            Create free account
          </Button>
        </div>
      </div>
    )
  }

  // Trigger mode: wrap the provided children so a click routes to signup.
  // `display: contents` keeps the child's own styling/layout intact.
  return (
    <span onClick={goToSignup} className="contents cursor-pointer">
      {children}
    </span>
  )
}
