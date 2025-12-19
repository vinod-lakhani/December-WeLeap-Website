import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { Navigation } from "@/components/navigation"

interface PageShellProps {
  children: ReactNode
  className?: string
}

// Navigation is fixed with top-4, and nav height is approximately 64px (py-3 sm:py-4 + content)
// So we need: top-4 (16px) + nav height (~64px) = ~80px, but using pt-24 (96px) for safety
// The first section (usually hero) will handle its own top padding to account for this offset
export function PageShell({ children, className }: PageShellProps) {
  return (
    <div className={cn("min-h-screen bg-white overflow-x-hidden", className)}>
      <Navigation />
      <main>{children}</main>
    </div>
  )
}
