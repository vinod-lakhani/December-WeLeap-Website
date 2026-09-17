import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { Navigation } from "@/components/navigation"

interface PageShellProps {
  children: ReactNode
  className?: string
  /**
   * Campaign mode: no site navigation.
   *
   * A visitor arriving from a paid ad came from an app, not from this site.
   * Every link in the header is an exit, and the one at the top right says
   * "Open app" — which sends somebody who has not seen a number yet to a
   * signup. On a phone the nav also costs the first 80px of a screen the
   * result has to fit inside.
   *
   * Only ever set from an explicit campaign flag on the URL, so organic and
   * search traffic keeps the whole site around it.
   */
  bare?: boolean
}

// Navigation is fixed with top-4, and nav height is approximately 64px (py-3 sm:py-4 + content)
// So we need: top-4 (16px) + nav height (~64px) = ~80px, but using pt-24 (96px) for safety
// The first section (usually hero) will handle its own top padding to account for this offset
export function PageShell({ children, className, bare = false }: PageShellProps) {
  return (
    <div className={cn("min-h-screen flex flex-col bg-white overflow-x-hidden", className)}>
      {!bare && <Navigation />}
      <main className="flex-1 flex flex-col">{children}</main>
    </div>
  )
}
