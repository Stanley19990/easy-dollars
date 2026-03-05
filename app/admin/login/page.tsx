"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { CashRiseLogo } from "@/components/cashrise-logo"

export default function AdminLoginPage() {
  const [credentials, setCredentials] = useState({ username: "", password: "" })
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Mock admin login - in real app, this would verify against secure backend
    if (credentials.username === "admin" && credentials.password === "admin123") {
      localStorage.setItem("easy_dollars_admin", "true")
      toast.success("Admin login successful!")
      router.push("/admin")
    } else {
      toast.error("Invalid admin credentials")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center p-4">
      <Card className="w-full max-w-md cr-glass">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-3">
            <CashRiseLogo size={40} />
          </div>
          <CardTitle className="text-2xl text-white">
            Admin Access
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={credentials.username}
                onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
                className="bg-slate-900/70 border-slate-700 focus:border-cyan-500 text-slate-100"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={credentials.password}
                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                className="bg-slate-900/70 border-slate-700 focus:border-cyan-500 text-slate-100"
                required
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full cr-button text-slate-950"
            >
              {loading ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-xs text-slate-400 text-center mt-4">Demo credentials: admin / admin123</div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
