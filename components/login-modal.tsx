"use client"

import type React from "react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

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

      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        router.push("/dashboard")
      }
    } catch (err) {
      console.error("Login error occurred")
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
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
              onClick={() => {
                onOpenChange(false)
                // You can trigger signup modal here if needed
              }}
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
