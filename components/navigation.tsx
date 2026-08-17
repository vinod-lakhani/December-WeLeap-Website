"use client"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { appLink, APP_HREF } from "@/lib/app-link"
import { track } from "@/lib/analytics"

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-4 left-0 right-0 z-50 px-4 sm:px-6">
      {/* Pill + glass, matching the product app's floating nav */}
      <div className="rounded-[28px] border border-hairline bg-white/85 shadow-[0_4px_22px_rgba(17,63,36,.07)] backdrop-blur-md md:rounded-full">
        <div className="container mx-auto max-w-6xl py-3 sm:py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <Image
              src="/images/weleap-logo.png"
              alt="WeLeap"
              width={2972}
              height={845}
              sizes="141px"
              className="h-10 w-auto"
            />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {/* About Us intentionally lives in the footer, not the header —
                the header stays on the product and the offering. */}
            {/* Anchors into the homepage section, which shows real product UI.
                The old /product-features page was badly out of date, but it was
                the 5th most-visited page (~260 visitors) — so it is 301'd to
                this anchor in next.config.mjs rather than deleted. */}
            <Link
              href="/#how-it-works"
              className="font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap min-w-fit text-gray-600 hover:text-gray-900"
            >
              How it works
            </Link>
            <Link
              href="/pricing"
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap min-w-fit ${
                pathname === "/pricing" ? "text-brand-700 bg-brand-50" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pricing
            </Link>
            <Link
              href="/tools"
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap min-w-fit ${
                pathname === "/tools" ? "text-brand-700 bg-brand-50" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Free Tools
            </Link>
            <Link
              href="/resources"
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap min-w-fit ${
                pathname === "/resources" ? "text-brand-700 bg-brand-50" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Resources
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
            <div className="hidden md:flex items-center gap-4">
              <a
                href={APP_HREF}
                onClick={(e) => { e.preventDefault(); track('open_app_clicked', { placement: 'header' }); window.location.href = appLink() }}
                className="bg-brand-700 hover:bg-brand-800 text-white px-6 py-2.5 rounded-full font-bold shadow-pill transition-all duration-200 hover:-translate-y-px"
              >
                Open app
              </a>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 px-4 sm:px-6 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-2">
              <Link
                href="/#how-it-works"
                onClick={() => setIsMobileMenuOpen(false)}
                className="font-medium transition-colors duration-200 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                How it works
              </Link>
              <Link
                href="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-medium transition-colors duration-200 px-4 py-3 rounded-lg ${
                  pathname === "/pricing" ? "text-brand-700 bg-brand-50" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Pricing
              </Link>
              <Link
                href="/tools"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-medium transition-colors duration-200 px-4 py-3 rounded-lg ${
                  pathname === "/tools" ? "text-brand-700 bg-brand-50" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Free Tools
              </Link>
              <Link
                href="/resources"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-medium transition-colors duration-200 px-4 py-3 rounded-lg ${
                  pathname === "/resources" ? "text-brand-700 bg-brand-50" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Resources
              </Link>

              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-200">
                <a
                  href={APP_HREF}
                  onClick={(e) => { e.preventDefault(); track('open_app_clicked', { placement: 'mobile_nav' }); window.location.href = appLink() }}
                  className="w-full bg-brand-700 hover:bg-brand-800 text-white px-6 py-3 rounded-full font-bold shadow-pill transition-all duration-200 text-center block"
                >
                  Open app
                </a>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
