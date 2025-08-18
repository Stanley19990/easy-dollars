"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRightLeft, Coins, DollarSign } from "lucide-react"
import { toast } from "sonner"

export function EarningsConverter() {
  const { user, refreshUser } = useAuth()
  const [edAmount, setEdAmount] = useState("")
  const [converting, setConverting] = useState(false)

  // Conversion rate: 1 ED = $0.10 (can be made dynamic)
  const conversionRate = 0.1
  const usdAmount = Number.parseFloat(edAmount) * conversionRate || 0

  const handleConvert = async () => {
    if (!user || !edAmount) return

    const edToConvert = Number.parseFloat(edAmount)
    const userEdBalance = user.edBalance ?? 0
    if (edToConvert <= 0 || edToConvert > userEdBalance) {
      toast.error("Invalid amount or insufficient ED balance")
      return
    }

    setConverting(true)

    try {
      // Mock conversion - in real app, this would call an API
      const updatedUser = { ...user }
      updatedUser.edBalance = (updatedUser.edBalance ?? 0) - edToConvert
      updatedUser.walletBalance = (updatedUser.walletBalance ?? 0) + usdAmount

      localStorage.setItem("easy_dollars_user", JSON.stringify(updatedUser))
      refreshUser()

      toast.success(`Converted ${edToConvert} ED to $${usdAmount.toFixed(2)}`)
      setEdAmount("")
    } catch (error) {
      toast.error("Conversion failed. Please try again.")
    } finally {
      setConverting(false)
    }
  }

  if (!user) return null

  return (
    <Card className="bg-slate-900/50 border-slate-800 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <ArrowRightLeft className="h-5 w-5 text-purple-400" />
          <span>Convert ED to USD</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-center mb-4">
              <div className="text-sm text-slate-400 mb-1">Current Rate</div>
              <div className="text-lg font-semibold">1 ED = $0.10 USD</div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edAmount" className="flex items-center space-x-2">
                <Coins className="h-4 w-4 text-cyan-400" />
                <span>ED Amount</span>
              </Label>
              <Input
                id="edAmount"
                type="number"
                value={edAmount}
                onChange={(e) => setEdAmount(e.target.value)}
                placeholder="0.00"
                max={user.edBalance ?? 0}
                className="bg-slate-800 border-slate-700 focus:border-cyan-500"
              />
              <div className="text-xs text-slate-400">Available: {(user.edBalance ?? 0).toFixed(2)} ED</div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span>USD Amount</span>
              </Label>
              <Input
                type="number"
                value={usdAmount.toFixed(2)}
                readOnly
                className="bg-slate-800 border-slate-700 text-green-400"
              />
              <div className="text-xs text-slate-400">You will receive</div>
            </div>
          </div>

          <Button
            onClick={handleConvert}
            disabled={
              converting ||
              !edAmount ||
              Number.parseFloat(edAmount) <= 0 ||
              Number.parseFloat(edAmount) > (user.edBalance ?? 0)
            }
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
          >
            {converting ? "Converting..." : "Convert to USD"}
          </Button>

          <div className="text-xs text-slate-400 text-center">
            Converted funds will be added to your USD wallet balance
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
