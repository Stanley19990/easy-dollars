// app/forgot-password/page.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Mail, CheckCircle, AlertCircle, Key } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { LanguageSwitcher } from "@/components/language-switcher"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      })

      if (error) {
        throw error
      }

      toast.success("Password reset email sent! Check your inbox.")
      setSuccess(true)
      
    } catch (error: any) {
      console.error("Error sending reset email:", error)
      toast.error(error.message || "Failed to send reset email. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6">
      <div className="cr-backdrop cr-grid"></div>
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher compact />
      </div>
      <Card className="w-full max-w-md cr-glass relative z-10 mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Key className="h-5 w-5 text-cyan-200" />
            <span>Reset Password</span>
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {success ? (
            <div className="text-center space-y-4 py-6">
              <div className="bg-emerald-500/10 w-14 h-14 sm:w-16 sm:h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-emerald-300" />
              </div>
              <h3 className="text-xl font-bold text-white">Check Your Email</h3>
              <p className="text-slate-400">
                We've sent a password reset link to <strong className="text-white">{email}</strong>
              </p>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3 mt-4 text-left">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-300 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-200/80">
                    <strong>Important:</strong> Click the link in your email, then you'll be redirected to set a new password.
                  </p>
                </div>
              </div>
              <div className="pt-4">
                <Button
                  onClick={() => router.push("/?login=true")}
                  variant="outline"
                  className="w-full cr-outline-button hover:text-cyan-100"
                >
                  Back to Login
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="bg-slate-900/70 border-slate-700 text-white placeholder:text-slate-500"
                  required
                />
              </div>

              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="h-4 w-4 text-amber-300 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-amber-200/80">
                    You'll receive an email with a link to reset your password. The link can only be used once and expires in 24 hours.
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full cr-button text-slate-950"
                >
                  {loading ? "Sending..." : "Send Reset Link"}
                </Button>
                
                <Button
                  type="button"
                  onClick={() => router.push("/?login=true")}
                  variant="ghost"
                  className="w-full text-slate-400 hover:text-white"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Login
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
