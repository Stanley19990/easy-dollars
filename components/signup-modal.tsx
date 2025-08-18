"use client"

import type React from "react"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Loader2 } from "lucide-react"

interface SignupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

export function SignupModal({ open, onOpenChange }: SignupModalProps) {
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    country: "",
    phone: "",
    referralCode: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

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

    try {
      console.log("Creating account for:", formData.email)
      const result = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.country,
        formData.phone,
        formData.referralCode,
      )

      if (result.error) {
        setError(result.error)
      } else {
        alert("Account created successfully! Please check your email to verify your account.")
        onOpenChange(false)
      }
    } catch (err) {
      console.error("Signup error occurred")
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 neon-border text-cyan-300 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold neon-text text-center">Join Easy Dollars</DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Create your account and start earning money by watching ads
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
          )}

          <div>
            <Label htmlFor="fullName" className="text-cyan-300">
              Full Name
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
              required
            />
          </div>

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
            <Label htmlFor="country" className="text-cyan-300">
              Country
            </Label>
            <Select value={formData.country} onValueChange={(value) => setFormData({ ...formData, country: value })}>
              <SelectTrigger className="bg-slate-700 border-cyan-500 text-cyan-300">
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

          <div>
            <Label htmlFor="phone" className="text-cyan-300">
              Phone (Optional)
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
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

          <div>
            <Label htmlFor="confirmPassword" className="text-cyan-300">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
              required
            />
          </div>

          <div>
            <Label htmlFor="referralCode" className="text-cyan-300">
              Referral Code (Optional)
            </Label>
            <Input
              id="referralCode"
              value={formData.referralCode}
              onChange={(e) => setFormData({ ...formData, referralCode: e.target.value })}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
              placeholder="Enter referral code"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold pulse-neon"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
