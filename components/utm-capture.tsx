"use client"

import { useEffect } from "react"
import { captureUtmIfPresent } from "@/lib/utm-storage"

/**
 * Runs on every page load to store UTM params (first touch).
 * Add to layout so UTM is captured when user lands via campaign link.
 */
export function UtmCapture() {
  useEffect(() => {
    captureUtmIfPresent()
  }, [])
  return null
}
