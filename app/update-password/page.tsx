// app/update-password/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lock, CheckCircle, AlertCircle, Loader2, Home, LogIn } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"

export default function UpdatePasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const checkAuth = async () => {
      setCheckingAuth(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error("Invalid or expired reset link. Please request a new password reset.")
        router.push("/forgot-password")
        return
      }
      
      // Get user email from session for auto-login
      if (session.user.email) {
        setUserEmail(session.user.email)
      }
      
      setCheckingAuth(false)
    }
    
    checkAuth()
  }, [router])

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password) {
      toast.error("Please enter a new password")
      return
    }
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    setLoading(true)
    
    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        throw error
      }

      // Try auto-login with the new password
      if (userEmail) {
        try {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: userEmail,
            password: password
          })
          
          if (signInError) {
            throw signInError
          }
          
          // Auto-login successful, go to dashboard
          toast.success("Password updated successfully! Redirecting to dashboard...")
          router.push("/dashboard")
          return
        } catch (autoLoginError: any) {
          console.log("Auto-login failed, user will login manually:", autoLoginError.message)
          // Continue with manual login flow
        }
      }
      
      // If auto-login fails or no email, sign out and show success
      await supabase.auth.signOut()
      
      toast.success("Password updated successfully! You can now login with your new password.")
      setSuccess(true)
      
    } catch (error: any) {
      console.error("Error updating password:", error)
      toast.error(error.message || "Failed to update password. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-400">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-500/20 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="bg-green-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="h-8 w-8 text-green-400" />
              </div>
              <h3 className="text-xl font-bold text-white">Password Updated!</h3>
              <p className="text-slate-400">
                Your password has been successfully reset. You can now login with your new password.
              </p>
              
              <div className="space-y-3 pt-2">
                <Button
                  onClick={async () => {
                    if (userEmail) {
                      try {
                        // Try auto-login one more time
                        const { error } = await supabase.auth.signInWithPassword({
                          email: userEmail,
                          password: password
                        })
                        
                        if (!error) {
                          router.push("/dashboard")
                          return
                        }
                      } catch (error) {
                        console.log("Auto-login failed, redirecting to homepage")
                      }
                    }
                    
                    // If auto-login fails, go to homepage
                    router.push("/")
                  }}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  Login & Go to Dashboard
                </Button>
                
                <Button
                  onClick={() => {
                    router.push("/")
                  }}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Go to Homepage
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-slate-700 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-white">
            <Lock className="h-5 w-5 text-cyan-400" />
            <span>Set New Password</span>
          </CardTitle>
          <CardDescription className="text-slate-400">
            You're logged in via reset link. Set your new password below.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3 mb-4">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-cyan-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-cyan-200/80">
                We'll try to automatically log you in with the new password. If that fails, you'll be redirected to the homepage to login manually.
              </p>
            </div>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                required
                minLength={6}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirm New Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                required
                minLength={6}
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-xs text-yellow-200/80">
                Password must be at least 6 characters long. You can only use this reset link once.
              </p>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating Password...
                </>
              ) : (
                "Update Password & Login"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}