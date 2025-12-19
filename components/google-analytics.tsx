"use client"

import { useEffect, useState } from "react"
import { GoogleAnalytics } from "@next/third-parties/google"

export function ConditionalGoogleAnalytics() {
  const [hasConsent, setHasConsent] = useState(false)
  const gaId = process.env.NEXT_PUBLIC_GA_ID

  useEffect(() => {
    // Check consent status on mount
    const checkConsent = () => {
      const consent = localStorage.getItem("cookie-consent")
      if (consent === "accepted") {
        setHasConsent(true)
      }
    }

    checkConsent()

    // Listen for custom consent update event
    const handleConsentUpdate = () => {
      checkConsent()
    }

    window.addEventListener("cookie-consent-updated", handleConsentUpdate)
    
    // Also listen for storage events (from other tabs/windows)
    window.addEventListener("storage", checkConsent)

    return () => {
      window.removeEventListener("cookie-consent-updated", handleConsentUpdate)
      window.removeEventListener("storage", checkConsent)
    }
  }, [])

  if (!gaId || !hasConsent) {
    return null
  }

  return <GoogleAnalytics gaId={gaId} />
}
