// components/signup-modal.tsx
"use client"

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Loader2, Gift, LogIn } from "lucide-react"
import { CashRiseLogo } from "@/components/cashrise-logo"
import { useLanguage } from "@/components/language-provider"

interface SignupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialReferralCode?: string
  onSuccess?: () => void
  onSwitchToLogin?: () => void
}

const africanCountries = ["Cameroon"]

export function SignupModal({ 
  open, 
  onOpenChange, 
  initialReferralCode = "", 
  onSuccess,
  onSwitchToLogin
}: SignupModalProps) {
  const { t } = useLanguage()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [referralCode, setReferralCode] = useState(initialReferralCode)
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    country: "Cameroon",
    phone: "",
  })

  useEffect(() => {
    if (initialReferralCode) {
      setReferralCode(initialReferralCode)
    }
  }, [initialReferralCode])

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

  const handleSwitchToLogin = () => {
    onOpenChange(false)
    if (onSwitchToLogin) {
      onSwitchToLogin()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="cr-glass text-slate-100 max-w-md w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto border border-cyan-400/30">
        <DialogHeader>
          <div className="flex justify-center">
            <CashRiseLogo size={40} />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-bold text-center">
            {t("joinCashRise")}
          </DialogTitle>
          <DialogDescription className="text-center text-slate-400 text-sm sm:text-base px-2">
            Create your account and start earning with AI gaming machines
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4 px-2 sm:px-0">
          {error && (
            <div className="p-2 sm:p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs sm:text-sm">
              {error}
            </div>
          )}

          {referralCode && (
            <div className="p-2 sm:p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center space-x-2 text-green-400">
                <Gift className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">Referral Code Applied</span>
              </div>
              <p className="text-green-300 text-xs sm:text-sm mt-1 break-all">
                Using code: <strong>{referralCode}</strong>
              </p>
              <p className="text-green-200 text-xs mt-1">
                You'll get special benefits when you join!
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="fullName" className="text-slate-200 text-sm sm:text-base">
              {t("fullName")}
            </Label>
            <Input
              id="fullName"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="bg-slate-900/70 border-cyan-500/40 text-slate-100 text-sm sm:text-base h-10 sm:h-auto"
              required
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-slate-200 text-sm sm:text-base">
              {t("email")}
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="bg-slate-900/70 border-cyan-500/40 text-slate-100 text-sm sm:text-base h-10 sm:h-auto"
              required
              placeholder="Enter your email"
            />
          </div>

          <div>
            <Label htmlFor="country" className="text-slate-200 text-sm sm:text-base">
              {t("country")}
            </Label>
            <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
              <SelectTrigger className="bg-slate-900/70 border-cyan-500/40 text-slate-100 text-sm sm:text-base h-10 sm:h-auto">
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700 max-h-[200px] sm:max-h-[300px]">
                {africanCountries.map((country) => (
                  <SelectItem key={country} value={country} className="text-sm sm:text-base">
                    {country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="phone" className="text-slate-200 text-sm sm:text-base">
              {t("phoneOptional")}
            </Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              className="bg-slate-900/70 border-cyan-500/40 text-slate-100 text-sm sm:text-base h-10 sm:h-auto"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-slate-200 text-sm sm:text-base">
              {t("password")}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className="bg-slate-900/70 border-cyan-500/40 text-slate-100 text-sm sm:text-base h-10 sm:h-auto"
              required
              placeholder="Create a password"
              minLength={6}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword" className="text-slate-200 text-sm sm:text-base">
              Confirm Password
            </Label>
            <Input
              id="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              className="bg-slate-900/70 border-cyan-500/40 text-slate-100 text-sm sm:text-base h-10 sm:h-auto"
              required
              placeholder="Confirm your password"
            />
          </div>

          <div>
            <Label htmlFor="referralCode" className="text-slate-200 text-sm sm:text-base">
              Referral Code (Optional)
            </Label>
            <Input
              id="referralCode"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className="bg-slate-900/70 border-cyan-500/40 text-slate-100 text-sm sm:text-base h-10 sm:h-auto"
              placeholder="Enter referral code if you have one"
            />
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full cr-button text-slate-950 font-bold h-10 sm:h-auto text-sm sm:text-base"
          >
            {loading && <Loader2 className="mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />}
            {t("createAccount")}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-2 text-slate-400">
                Already have an account?
              </span>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSwitchToLogin}
            variant="outline"
            className="w-full cr-outline-button hover:text-cyan-100 h-10 sm:h-auto text-sm sm:text-base"
          >
            <LogIn className="mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            {t("login")}
          </Button>

          <p className="text-xs text-slate-400 text-center px-2">
            By creating an account, you agree to our Terms of Service and Privacy Policy
          </p>
        </form>
      </DialogContent>
    </Dialog>
  )
}
