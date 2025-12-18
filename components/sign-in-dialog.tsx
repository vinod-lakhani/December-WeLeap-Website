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

export function SignInDialog({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real application, you would authenticate with your backend
    console.log("Sign in attempt:", { username, password })
    setIsSubmitted(true)
    // Reset form after a delay
    setTimeout(() => {
      setUsername("")
      setPassword("")
      setIsSubmitted(false)
    }, 2000)
  }

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-white p-6 rounded-lg shadow-xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-900">Sign In</DialogTitle>
          <DialogDescription className="text-gray-600 mt-2">
            Enter your credentials to access your WeLeap account.
          </DialogDescription>
        </DialogHeader>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="username" className="text-gray-700">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password" className="text-gray-700">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border border-gray-300 rounded-md px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
            <Button
              type="submit"
              className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-medium mt-2"
            >
              Sign In
            </Button>
            <div className="text-center text-sm text-gray-600 mt-2">
              Don't have an account?{" "}
              <button type="button" className="text-primary-600 hover:text-primary-700 font-medium">
                Join our waitlist
              </button>
            </div>
          </form>
        ) : (
          <div className="text-center py-8">
            <h3 className="text-xl font-semibold text-primary-600 mb-2">Welcome Back!</h3>
            <p className="text-gray-600">You have been signed in successfully.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
