"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"

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
      className={`fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl transition-transform duration-300 ease-in-out ${
        isVisible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-6xl mx-auto">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Cookie Consent</h3>
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
              We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. By clicking
              "Accept All", you consent to our use of cookies. You can also choose to decline non-essential cookies.
            </p>
            <div className="mt-3">
              <a
                href="/privacy-policy"
                className="text-sm text-primary-600 hover:text-primary-700 underline"
              >
                Learn more in our Privacy Policy
              </a>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <Button
              onClick={handleDecline}
              variant="outline"
              className="w-full sm:w-auto px-6 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white px-6 py-2"
            >
              Accept All
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
