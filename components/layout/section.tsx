import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface SectionProps {
  children: ReactNode
  variant?: "white" | "muted" | "brand"
  className?: string
  id?: string
  isHero?: boolean
}

const variantClasses = {
  white: "bg-white",
  muted: "bg-gray-50",
  brand: "bg-[#386641]",
}

// Hero sections need top padding to account for fixed nav and add extra spacing
// Regular sections use standard vertical padding
export function Section({ children, variant = "white", className, id, isHero = false }: SectionProps) {
  const paddingClass = isHero ? "pt-32 md:pt-40 pb-16 md:pb-20" : "py-16 md:py-20"
  
  return (
    <section id={id} className={cn(paddingClass, variantClasses[variant], className)}>
      {children}
    </section>
  )
}
