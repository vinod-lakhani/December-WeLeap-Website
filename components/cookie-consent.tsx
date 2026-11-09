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
 * ONE ROW AT EVERY WIDTH (Nov 9 2026). It still stacked on phones, the text
 * over a full-width button: about 110px at 390x664, over the chat's reply box
 * and its chips, and only 3 of 47 paid offer-chat visitors tapped Got it. The
 * text and a small button now share one row, about 60px. It also slides away
 * while a text field has focus, so it never sits over the box being typed in
 * (or above a phone's keyboard); that isn't an acknowledgement, and it comes
 * back on blur.
 *
 * The storage key and value are unchanged, so anyone who already pressed
 * Accept All does not see this again.
 */

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const [typing, setTyping] = useState(false)

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

  useEffect(() => {
    if (!showBanner) return
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement && (t.matches("input, textarea, select") || t.isContentEditable)
    const onIn = (e: FocusEvent) => setTyping(isField(e.target))
    const onOut = () => setTyping(false)
    document.addEventListener("focusin", onIn)
    document.addEventListener("focusout", onOut)
    // A field focused before the banner appeared (a chip tap does that in the chat).
    setTyping(isField(document.activeElement))
    return () => {
      document.removeEventListener("focusin", onIn)
      document.removeEventListener("focusout", onOut)
    }
  }, [showBanner])

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
        isVisible && !typing ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={typing || undefined}
      // Clears the iOS home indicator without adding height on anything else.
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-2 sm:gap-6 sm:px-6 sm:py-3">
        <p className="min-w-0 flex-1 text-[12.5px] leading-snug text-gray-700 sm:text-sm">
          We use cookies for analytics and ads.{" "}
          <a
            href="/privacy-policy"
            className="text-primary-600 underline hover:text-primary-700"
          >
            Privacy policy
          </a>
        </p>
        <div className="flex shrink-0">
          <Button
            onClick={handleAcknowledge}
            className="h-8 bg-primary-600 px-4 text-[13px] text-white hover:bg-primary-700 sm:h-9 sm:px-6 sm:text-sm"
          >
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}
