"use client"

import { useState } from "react"

import type React from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  mode: "signin" | "signup"
  onModeChange: (mode: "signin" | "signup") => void
}

const africanCountries = [
  "Nigeria",
  "Kenya",
  "South Africa",
  "Ghana",
  "Uganda",
  "Tanzania",
  "Ethiopia",
  "Morocco",
  "Algeria",
  "Egypt",
  "Cameroon",
  "Ivory Coast",
  "Madagascar",
  "Burkina Faso",
]

export function AuthModal({ isOpen, onClose, mode, onModeChange }: AuthModalProps) {
  const { signIn, signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    country: "",
    phone: "",
    referralCode: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log("Form submitted with mode:", mode)
    console.log("Form data:", {
      email: formData.email,
      fullName: formData.fullName,
      country: formData.country,
      phone: formData.phone,
      referralCode: formData.referralCode,
    })

    if (mode === "signup") {
      if (!formData.fullName.trim()) {
        setError("Full name is required")
        setLoading(false)
        return
      }
      if (!formData.country) {
        setError("Please select your country")
        setLoading(false)
        return
      }
    }

    try {
      if (mode === "signin") {
        console.log("Attempting sign in...")
        const result = await signIn(formData.email, formData.password)
        console.log("Sign in result:", result?.error ? "Error occurred" : "Success")
        if (result.error) {
          setError(result.error)
        } else {
          onClose()
        }
      } else {
        console.log("Attempting sign up...")
        const result = await signUp(
          formData.email,
          formData.password,
          formData.fullName,
          formData.country,
          formData.phone,
          formData.referralCode,
        )
        console.log("Sign up result:", result?.error ? "Error occurred" : "Success")
        if (result.error) {
          setError(result.error)
        } else {
          setError("")
          alert("Account created successfully! Please check your email to verify your account.")
          onClose()
        }
      }
    } catch (err) {
      console.error("Auth error occurred")
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-slate-900 border-cyan-500/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            {mode === "signin" ? "Welcome Back" : "Join Easy Dollars"}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            {mode === "signin"
              ? "Sign in to your Easy Dollars account to start earning"
              : "Create your account and start earning money by watching ads"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="bg-slate-800 border-slate-700 focus:border-cyan-500"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="bg-slate-800 border-slate-700 focus:border-cyan-500"
              required
            />
          </div>

          {mode === "signup" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="bg-slate-800 border-slate-700 focus:border-cyan-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select
                  value={formData.country}
                  onValueChange={(value) => setFormData({ ...formData, country: value })}
                >
                  <SelectTrigger className="bg-slate-800 border-slate-700 focus:border-cyan-500">
                    <SelectValue placeholder="Select your country" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {africanCountries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="bg-slate-800 border-slate-700 focus:border-cyan-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="referralCode">Referral Code (Optional)</Label>
                <Input
                  id="referralCode"
                  value={formData.referralCode}
                  onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
                  className="bg-slate-800 border-slate-700 focus:border-cyan-500"
                  placeholder="Enter referral code"
                />
              </div>
            </>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>

          <div className="text-center text-sm text-slate-400">
            {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => onModeChange(mode === "signin" ? "signup" : "signin")}
              className="text-cyan-400 hover:text-cyan-300"
            >
              {mode === "signin" ? "Sign up" : "Sign in"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
