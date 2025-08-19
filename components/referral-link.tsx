"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Share2, Copy, Check, MessageCircle, Mail } from "lucide-react"
import { toast } from "sonner"

export function ReferralLink() {
  const { user } = useAuth()
  const [copied, setCopied] = useState(false)

  if (!user) return null

  const referralLink = `https://easydollars.com/signup?ref=${user.referral_code}`

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink)
      setCopied(true)
      toast.success("Referral link copied to clipboard!")
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      toast.error("Failed to copy link")
    }
  }

  const shareViaWhatsApp = () => {
    const message = `Join me on Easy Dollars and start earning money by watching ads! Use my referral code: ${user.referral_code}\n\n${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
  }

  const shareViaEmail = () => {
    const subject = "Join Easy Dollars and Start Earning!"
    const body = `Hi!\n\nI've been using Easy Dollars to earn money by watching ads and it's amazing! You can earn up to 10x your investment in 30 days.\n\nUse my referral code: ${user.referral_code}\nSign up here: ${referralLink}\n\nLet's start earning together!`
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Share2 className="h-5 w-5 text-cyan-400" />
          <span>Share & Earn</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-sm text-slate-400 mb-2">Your Referral Code</div>
            <div className="text-2xl font-bold text-cyan-400 text-center">{user.referral_code}</div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Your Referral Link</label>
            <div className="flex space-x-2">
              <Input value={referralLink} readOnly className="bg-slate-800 border-slate-700 text-sm" />
              <Button
                onClick={copyToClipboard}
                size="icon"
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium mb-2">Share via:</div>
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={shareViaWhatsApp}
                variant="outline"
                className="bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                WhatsApp
              </Button>
              <Button
                onClick={shareViaEmail}
                variant="outline"
                className="bg-blue-500/10 border-blue-500/20 text-blue-400 hover:bg-blue-500/20"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400 mb-1">$5 Bonus</div>
              <div className="text-sm text-slate-400">For each successful referral</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
