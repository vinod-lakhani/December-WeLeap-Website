'use client';

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'leap_impact_ab_variant';
export type LeapVariant = 'A' | 'B';

/**
 * Returns the A/B variant for the Leap Impact page.
 * 50/50 split, persisted in sessionStorage for consistency during the session.
 * Uses useEffect to avoid hydration mismatch (variant assigned client-side only).
 *
 * For local testing: add ?ab=B or ?ab=A to the URL to force a variant.
 */
export function useLeapVariant(): LeapVariant | null {
  const [variant, setVariant] = useState<LeapVariant | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const forceAb = params.get('ab')?.toUpperCase();
    if (forceAb === 'A' || forceAb === 'B') {
      setVariant(forceAb);
      return;
    }

    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored === 'A' || stored === 'B') {
      setVariant(stored);
      return;
    }
    const v: LeapVariant = Math.random() < 0.5 ? 'A' : 'B';
    sessionStorage.setItem(STORAGE_KEY, v);
    setVariant(v);
  }, []);

  return variant;
}
