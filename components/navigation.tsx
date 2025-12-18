"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignInDialog } from "./sign-in-dialog"
import { EarlyAccessDialog } from "./early-access-dialog"
import { useState } from "react"

export function Navigation() {
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <header className="fixed top-4 left-4 right-4 z-50">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-lg shadow-black/10">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <img src="/images/weleap-logo.png" alt="WeLeap" className="h-10 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap min-w-fit ${
                pathname === "/" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap min-w-fit ${
                pathname === "/about" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              About Us
            </Link>
            <Link
              href="/product-features"
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap min-w-fit ${
                pathname === "/product-features"
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Product Features
            </Link>
            <Link
              href="/pricing"
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap min-w-fit ${
                pathname === "/pricing" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pricing
            </Link>
            <Link
              href="/resources"
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 whitespace-nowrap min-w-fit ${
                pathname === "/resources" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900"
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
              <SignInDialog>
                <Button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-2 rounded-xl font-medium shadow-sm transition-all duration-200 hover:shadow-md">
                  Sign In
                </Button>
              </SignInDialog>
              <EarlyAccessDialog>
                <Button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-medium shadow-sm transition-all duration-200 hover:shadow-md">
                  Join Waitlist
                </Button>
              </EarlyAccessDialog>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-4 px-6 animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col gap-2">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-medium transition-colors duration-200 px-4 py-3 rounded-lg ${
                  pathname === "/" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Home
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-medium transition-colors duration-200 px-4 py-3 rounded-lg ${
                  pathname === "/about" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                About Us
              </Link>
              <Link
                href="/product-features"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-medium transition-colors duration-200 px-4 py-3 rounded-lg ${
                  pathname === "/product-features" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Product Features
              </Link>
              <Link
                href="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-medium transition-colors duration-200 px-4 py-3 rounded-lg ${
                  pathname === "/pricing" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Pricing
              </Link>
              <Link
                href="/resources"
                onClick={() => setIsMobileMenuOpen(false)}
                className={`font-medium transition-colors duration-200 px-4 py-3 rounded-lg ${
                  pathname === "/resources" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                Resources
              </Link>

              <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-gray-200">
                <SignInDialog>
                  <Button className="w-full bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium shadow-sm transition-all duration-200">
                    Sign In
                  </Button>
                </SignInDialog>
                <EarlyAccessDialog>
                  <Button className="w-full bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium shadow-sm transition-all duration-200">
                    Join Waitlist
                  </Button>
                </EarlyAccessDialog>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
