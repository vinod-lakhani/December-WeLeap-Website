import { cn } from "@/lib/utils"
import { ReactNode } from "react"

interface ContainerProps {
  children: ReactNode
  className?: string
  maxWidth?: "default" | "narrow" | "wide"
}

const maxWidthClasses = {
  default: "max-w-6xl",
  narrow: "max-w-4xl",
  wide: "max-w-7xl",
}

export function Container({ children, className, maxWidth = "default" }: ContainerProps) {
  return (
    <div className={cn("container mx-auto px-6", maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  )
}
