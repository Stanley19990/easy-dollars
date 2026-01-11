"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Key } from "lucide-react"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function LoginModal({ open, onOpenChange }: LoginModalProps) {
  const { signIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      console.log("Logging in user:", formData.email)
      const result = await signIn(formData.email, formData.password)

      if (!result.user) {
        // If the user object is null, check for error message
        setError(result.error || "Login failed. Please try again.")
      } else {
        onOpenChange(false)
        router.push("/dashboard")
      }
    } catch (err: any) {
      console.error("Login error occurred:", err)
      setError(err?.message || "An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = () => {
    onOpenChange(false)
    router.push("/forgot-password")
  }

  const handleSignup = () => {
    onOpenChange(false)
    router.push("/signup")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 neon-border text-cyan-300 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold neon-text text-center">Welcome Back</DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Login to your Easy Dollars account and continue earning
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div>
            <Label htmlFor="email" className="text-cyan-300">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-cyan-300">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
              required
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center justify-end gap-1"
            >
              <Key className="h-3 w-3" />
              Forgot Password?
            </button>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold pulse-neon"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login to Dashboard
          </Button>

          <div className="text-center text-sm text-slate-400">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={handleSignup}
              className="text-cyan-400 hover:text-cyan-300 underline"
            >
              Sign up here
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}