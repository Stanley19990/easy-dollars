// components/dashboard-header.tsx
"use client"

import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Settings, Bell, Wallet, Users, Shield, Menu, X } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { authService } from "@/lib/auth"
import { useState } from "react"
import { ProfileModal } from "@/components/profile-modal"

export function DashboardHeader() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [profileModalOpen, setProfileModalOpen] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    router.push("/")
  }

  const isAdmin = user?.email ? authService.isAdmin(user.email) : false

  // Get user's display name - fallback to username, then email, then "User"
  const getDisplayName = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.split(" ")[0]
    if (user?.user_metadata?.username) return user.user_metadata.username
    if (user?.email) return user.email.split("@")[0]
    return "User"
  }

  // Get user's first initial for avatar
  const getUserInitial = () => {
    if (user?.user_metadata?.full_name) return user.user_metadata.full_name.charAt(0).toUpperCase()
    if (user?.user_metadata?.username) return user.user_metadata.username.charAt(0).toUpperCase()
    if (user?.email) return user.email.charAt(0).toUpperCase()
    return "U"
  }

  return (
    <>
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center justify-between">
            {/* Logo and Welcome */}
            <div className="flex items-center space-x-2 md:space-x-4">
              <Link href="/dashboard">
                <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent cursor-pointer">
                  Easy Dollars
                </h1>
              </Link>
              <div className="hidden lg:block text-slate-400 text-sm">
                Welcome, {getDisplayName()}
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
              <Link href="/social-links">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-cyan-400">
                  <Users className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Social Links</span>
                </Button>
              </Link>

              <Link href="/referrals">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-purple-400">
                  <Users className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Referrals</span>
                </Button>
              </Link>

              <Link href="/wallet">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-green-400">
                  <Wallet className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Wallet</span>
                </Button>
              </Link>

              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-slate-400 hover:text-orange-400">
                    <Shield className="h-4 w-4 lg:mr-2" />
                    <span className="hidden lg:inline">Admin</span>
                  </Button>
                </Link>
              )}

              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-cyan-400">
                <Bell className="h-4 w-4" />
              </Button>

              <div className="flex items-center space-x-2">
                <Avatar
                  className="h-7 w-7 lg:h-8 lg:w-8 border-2 border-cyan-500/20 cursor-pointer hover:border-cyan-500/40 transition-colors"
                  onClick={() => setProfileModalOpen(true)}
                >
                  <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs lg:text-sm">
                    {getUserInitial()}
                  </AvatarFallback>
                </Avatar>

                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-slate-400 hover:text-red-400">
                  <LogOut className="h-4 w-4 lg:mr-2" />
                  <span className="hidden lg:inline">Sign Out</span>
                </Button>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-2">
              <Avatar
                className="h-7 w-7 border-2 border-cyan-500/20 cursor-pointer hover:border-cyan-500/40 transition-colors"
                onClick={() => setProfileModalOpen(true)}
              >
                <AvatarFallback className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs">
                  {getUserInitial()}
                </AvatarFallback>
              </Avatar>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-slate-400"
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-slate-800">
              <div className="flex flex-col space-y-2 pt-4">
                <div className="text-slate-400 text-sm mb-2 px-2">Welcome, {getDisplayName()}</div>

                <Link href="/social-links" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-cyan-400">
                    <Users className="h-4 w-4 mr-3" />
                    Social Links
                  </Button>
                </Link>

                <Link href="/referrals" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-purple-400">
                    <Users className="h-4 w-4 mr-3" />
                    Referrals
                  </Button>
                </Link>

                <Link href="/wallet" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-green-400">
                    <Wallet className="h-4 w-4 mr-3" />
                    Wallet
                  </Button>
                </Link>

                {isAdmin && (
                  <Link href="/admin" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-orange-400">
                      <Shield className="h-4 w-4 mr-3" />
                      Admin Panel
                    </Button>
                  </Link>
                )}

                <Button variant="ghost" className="w-full justify-start text-slate-400 hover:text-cyan-400">
                  <Bell className="h-4 w-4 mr-3" />
                  Notifications
                </Button>

                <Button
                  variant="ghost"
                  className="w-full justify-start text-slate-400 hover:text-cyan-400"
                  onClick={() => {
                    setProfileModalOpen(true)
                    setMobileMenuOpen(false)
                  }}
                >
                  <Settings className="h-4 w-4 mr-3" />
                  Profile Settings
                </Button>

                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="w-full justify-start text-slate-400 hover:text-red-400 mt-4 border-t border-slate-800 pt-4"
                >
                  <LogOut className="h-4 w-4 mr-3" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      <ProfileModal open={profileModalOpen} onOpenChange={setProfileModalOpen} />
    </>
  )
}