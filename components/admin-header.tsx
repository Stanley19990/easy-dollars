"use client"

import { Button } from "@/components/ui/button"
import { Shield, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"

export function AdminHeader() {
  const router = useRouter()

  const handleSignOut = () => {
    localStorage.removeItem("easy_dollars_admin")
    router.push("/admin/login")
  }

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-cyan-400" />
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Easy Dollars Admin
              </h1>
            </div>
          </div>

          <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-400 hover:text-red-400">
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  )
}
