"use client"

import type React from "react"

import { useState } from "react"
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

export function EarlyAccessDialog({ children }: { children: React.ReactNode }) {
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real application, you would send this email to your backend
    console.log("Email submitted for early access:", email)
    setIsSubmitted(true)
    // Optionally, reset the form after a short delay or close the dialog
    // setTimeout(() => { setEmail(''); setIsSubmitted(false); }, 3000);
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
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
            <Button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium"
            >
              Join Waitlist
            </Button>
          </form>
        ) : (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-primary-600 mb-2">Thank You!</h3>
            <p className="text-gray-600">We'll notify you when the app launches.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
