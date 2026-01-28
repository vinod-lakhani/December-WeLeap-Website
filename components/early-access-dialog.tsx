"use client"

import type React from "react"

import { useState } from "react"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface EarlyAccessDialogProps {
  children?: React.ReactNode
  signupType?: string // Optional: e.g., "button", "cta", "navigation", "net_worth_tool_feedback", etc.
  /** When set, dialog is controlled by parent (e.g. open from survey). Omit for trigger-based use. */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EarlyAccessDialog({ children, signupType = "button", open: controlledOpen, onOpenChange }: EarlyAccessDialogProps) {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pathname = usePathname()
  const isControlled = controlledOpen !== undefined && onOpenChange !== undefined

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          signupType,
          page: pathname || "/",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to join waitlist")
      }

      setIsSubmitted(true)
      setEmail("")
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Something went wrong. Please try again."
      setError(errorMessage)
      console.error("Error joining waitlist:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const dialogContent = (
    <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Join Waitlist</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Be the first to know when our self-service app launches with AI-powered financial guidance.
          </DialogDescription>
        </DialogHeader>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-gray-700">
                Email address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            {/* What to expect section moved here */}
            <div className="text-left text-gray-700 mt-2">
              <p className="font-semibold mb-2">What to expect:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Early access when app launches</li>
                <li>AI-powered financial insights</li>
                <li>Self-service financial guidance</li>
                <li>No spam, just updates</li>
              </ul>
            </div>
            {error && (
              <div className="text-red-600 text-sm mt-2">{error}</div>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Joining..." : "Join Waitlist"}
            </Button>
          </form>
        ) : (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-primary-600 mb-2">Thank You!</h3>
            <p className="text-gray-600">We'll notify you when the app launches.</p>
          </div>
        )}
      </DialogContent>
  )

  if (isControlled) {
    return (
      <Dialog open={controlledOpen} onOpenChange={onOpenChange}>
        {dialogContent}
      </Dialog>
    )
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      {dialogContent}
    </Dialog>
  )
}
