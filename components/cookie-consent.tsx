"use client"

/**
 * Cookie consent.
 *
 * WHY IT IS THIS SMALL. Measured on production 15 Oct at 390x560 — an in-app
 * browser with its chrome, which is what every paid click arrives in — the
 * banner ran from 225px to the bottom of the screen: 335px tall, 60% of the
 * viewport. On /get it sat directly on top of the store button, and
 * `elementFromPoint` at the button's centre returned the banner rather than
 * the anchor, so the page's only action was physically untappable until the
 * dialog was dismissed. On a campaign tool landing it covered the result the
 * ad had promised, which is the whole reason campaign mode renders one.
 *
 * Nothing about the consent posture changes here: same storage key, same two
 * choices, same event, same policy link. What changed is the prose. The old
 * copy spent two of its three sentences restating what the buttons already
 * say — "By clicking Accept All, you consent..." sits directly above a button
 * marked Accept All — so cutting them removes repetition, not disclosure.
 *
 * Layout is stacked on phones (text, then buttons in one row) and a single
 * row from `sm` up. The buttons share a row rather than stacking because two
 * full-width stacked buttons cost ~90px on their own.
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

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted")
    setShowBanner(false)
    // Trigger a custom event to notify Google Analytics component
    window.dispatchEvent(new Event("cookie-consent-updated"))
    // Small delay before reload to ensure state is saved
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined")
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className={`fixed bottom-0 left-0 right-0 z-50 border-t border-gray-200 bg-white shadow-2xl transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
      // Clears the iOS home indicator without adding height on anything else.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-2.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-6 sm:px-6 sm:py-4">
        <div className="flex-1">
          <h2 className="text-[13px] font-semibold text-gray-900 sm:text-base">Cookies</h2>
          <p className="mt-0.5 text-[13px] leading-snug text-gray-600 sm:text-sm">
            We use cookies to analyse site traffic and personalise content.{" "}
            <a
              href="/privacy-policy"
              className="text-primary-600 underline hover:text-primary-700"
            >
              Privacy Policy
            </a>
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            onClick={handleDecline}
            variant="outline"
            className="h-9 flex-1 border-gray-300 px-4 text-sm text-gray-700 hover:bg-gray-50 sm:flex-none sm:px-6"
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            className="h-9 flex-1 bg-primary-600 px-4 text-sm text-white hover:bg-primary-700 sm:flex-none sm:px-6"
          >
            Accept All
          </Button>
        </div>
      </div>
    </div>
  )
}
