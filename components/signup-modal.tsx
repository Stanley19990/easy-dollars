// components/signup-modal.tsx
"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Gift } from "lucide-react"

interface SignupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialReferralCode?: string
  onSuccess?: () => void
}

const africanCountries = [
  "Nigeria", "Kenya", "South Africa", "Ghana", "Uganda", "Tanzania", 
  "Ethiopia", "Morocco", "Algeria", "Egypt", "Cameroon", "Ivory Coast", 
  "Madagascar", "Burkina Faso"
]

export function SignupModal({ open, onOpenChange, initialReferralCode = "", onSuccess }: SignupModalProps) {
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [referralCode, setReferralCode] = useState(initialReferralCode)
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    country: "",
    phone: "",
  })

  // Update referral code when prop changes
  useEffect(() => {
    if (initialReferralCode) {
      setReferralCode(initialReferralCode)
    }
  }, [initialReferralCode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation checks
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
      console.log("Creating account with referral code:", referralCode)

      const result = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.country,
        formData.phone,
        referralCode,
      )

      if (result?.error) {
        if (result.error.includes("duplicate key")) {
          setError("This email or phone is already registered. Please log in instead.")
        } else {
          setError(result.error)
        }
      } else {
        console.log("✅ Account created successfully!")
        if (onSuccess) onSuccess()
      }
    } catch (err) {
      console.error("Signup error occurred", err)
      setError("An unexpected error occurred. Please try again later.")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (error) setError("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 neon-border text-cyan-300 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold neon-text text-center">
            Join Easy Dollars
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400">
            Create your account and start earning with AI gaming machines
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Referral Code Display */}
          {referralCode && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center space-x-2 text-green-400">
                <Gift className="h-4 w-4" />
                <span className="text-sm font-medium">Referral Code Applied</span>
              </div>
              <p className="text-green-300 text-sm mt-1">
                Using code: <strong>{referralCode}</strong>
              </p>
              <p className="text-green-200 text-xs mt-1">
                You'll get special benefits when you join!
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="fullName" className="text-cyan-300">
              Full Name
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
              required
              placeholder="Enter your full name"
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
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
              required
              placeholder="Enter your email"
            />
          </div>

          <div>
            <Label htmlFor="country" className="text-cyan-300">
              Country
            </Label>
            <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
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
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
              placeholder="Enter your phone number"
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
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
              required
              placeholder="Create a password"
              minLength={6}
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
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
              required
              placeholder="Confirm your password"
            />
          </div>

          {/* Manual Referral Code Input (optional) */}
          <div>
            <Label htmlFor="referralCode" className="text-cyan-300">
              Referral Code (Optional)
            </Label>
            <Input
              id="referralCode"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="bg-slate-700 border-cyan-500 text-cyan-300"
              placeholder="Enter referral code if you have one"
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

          <p className="text-xs text-slate-400 text-center">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}