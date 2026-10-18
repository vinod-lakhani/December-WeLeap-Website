"use client"

/**
 * Cookie notice.
 *
 * A NOTICE, NOT A CONSENT PROMPT. It used to offer Accept All and Decline, but
 * nothing downstream read the answer — GA4 loaded on the env var alone, and
 * PostHog and the Meta pixel have their own loaders — so the dialog presented
 * a choice the site did not honour. Rather than wire three vendors to a gate,
 * this states what runs and links the policy that lists it.
 *
 * WHY IT IS THIS SMALL. Measured on production 15 Oct at 390x560 — an in-app
 * browser with its chrome, which is what every paid click arrives in — the old
 * banner ran from 225px to the bottom of the screen: 335px tall, 60% of the
 * viewport. On /get it sat on top of the store button and elementFromPoint at
 * that button's centre returned the banner, so the page's only action was
 * untappable until the dialog was dismissed. One line and one button keeps it
 * out of the way of the thing people came to press.
 *
 * The storage key and value are unchanged, so anyone who already pressed
 * Accept All does not see this again.
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Check if user has already made a choice
    const consent = localStorage.getItem("cookie-consent")
    if (!consent) {
      // Show banner after a short delay for better UX
      setTimeout(() => {
        setShowBanner(true)
        // Trigger animation
        setTimeout(() => setIsVisible(true), 10)
      }, 1000)
    }
  }, [])

  const handleAcknowledge = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div
      role="region"
      aria-label="Cookie notice"
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
      // Clears the iOS home indicator without adding height on anything else.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-4">
        <p className="flex-1 text-[13px] leading-snug text-gray-700 sm:text-sm">
          We use cookies for analytics and to measure our ads.{" "}
          <a
            href="/privacy-policy"
            className="text-primary-600 underline hover:text-primary-700"
          >
            See our privacy policy
          </a>
          .
        </p>
        <div className="flex shrink-0">
          <Button
            onClick={handleAcknowledge}
            className="h-9 w-full bg-primary-600 px-6 text-sm text-white hover:bg-primary-700 sm:w-auto"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}
