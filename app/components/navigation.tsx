"use client"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navigation() {
  const pathname = usePathname()

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
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 ${
                pathname === "/" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 ${
                pathname === "/about" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              About Us
            </Link>
            <Link
              href="/product-features"
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 ${
                pathname === "/product-features"
                  ? "text-primary-600 bg-primary-50"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Product Features
            </Link>
            <Link
              href="/resources"
              className={`font-medium transition-colors duration-200 px-3 py-2 rounded-lg hover:bg-gray-50 ${
                pathname === "/resources" ? "text-primary-600 bg-primary-50" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Resources
            </Link>
          </nav>

          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <Button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl font-medium shadow-sm transition-all duration-200 hover:shadow-md">
              Join Waitlist
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
