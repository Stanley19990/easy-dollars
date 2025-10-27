"use client"

import { useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowRightLeft, Coins, DollarSign, Zap } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { NotificationBell } from '@/components/notification-bell'

export function EarningsConverter() {
  const { user, refreshUser } = useAuth()
  const [edAmount, setEdAmount] = useState("")
  const [converting, setConverting] = useState(false)

  // Conversion rate: 1 ED = $0.10 USD
  const conversionRate = 0.1
  const usdAmount = Number.parseFloat(edAmount) * conversionRate || 0

  const handleConvert = async () => {
    if (!user || !edAmount) return

    const edToConvert = Number.parseFloat(edAmount)
    const userEdBalance = user.ed_balance ?? 0

    // Validation
    if (edToConvert <= 0) {
      toast.error("Please enter a valid amount")
      return
    }

    if (edToConvert > userEdBalance) {
      toast.error("Insufficient ED balance")
      return
    }

    if (edToConvert < 10) {
      toast.error("Minimum conversion amount is 10 ED")
      return
    }

    setConverting(true)

    try {
      console.log('🔄 Starting conversion:', { edToConvert, usdAmount })

      // Get current user data from database
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('ed_balance, wallet_balance, total_earned')
        .eq('id', user.id)
        .single()

      if (fetchError) {
        console.error('❌ Error fetching user data:', fetchError)
        throw new Error('Failed to fetch user data')
      }

      const currentEdBalance = currentUser.ed_balance || 0
      const currentWalletBalance = currentUser.wallet_balance || 0

      // Double-check balance
      if (edToConvert > currentEdBalance) {
        toast.error("Insufficient ED balance")
        return
      }

      // Calculate new balances
      const newEdBalance = currentEdBalance - edToConvert
      const newWalletBalance = currentWalletBalance + usdAmount

      console.log('📊 Balance update:', {
        currentEdBalance,
        currentWalletBalance,
        newEdBalance,
        newWalletBalance
      })

      // Update user balances in database (REMOVED updated_at field)
      const { error: updateError } = await supabase
        .from('users')
        .update({
          ed_balance: newEdBalance,
          wallet_balance: newWalletBalance
          // Removed updated_at since it doesn't exist in your schema
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('❌ Error updating user balance:', updateError)
        throw new Error('Failed to update balance')
      }

      // Record conversion transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'conversion',
          description: `Converted ${edToConvert} ED to $${usdAmount.toFixed(2)} USD`,
          amount: -edToConvert, // Negative for ED deduction
          currency: 'ED',
          status: 'completed',
          external_id: `conv_${user.id}_${Date.now()}`,
          metadata: {
            conversion_rate: conversionRate,
            usd_amount: usdAmount,
            ed_amount: edToConvert
          }
        })

      if (transactionError) {
        console.error('❌ Error recording transaction:', transactionError)
        // Don't fail the conversion if transaction recording fails
        console.log('⚠️ Transaction recording failed, but conversion was successful')
      }

      // Record USD transaction
      const { error: usdTransactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'conversion_credit',
          description: `Received $${usdAmount.toFixed(2)} USD from ED conversion`,
          amount: usdAmount,
          currency: 'USD',
          status: 'completed',
          external_id: `conv_usd_${user.id}_${Date.now()}`,
          metadata: {
            conversion_rate: conversionRate,
            ed_amount: edToConvert,
            source: 'ed_conversion'
          }
        })

      if (usdTransactionError) {
        console.error('❌ Error recording USD transaction:', usdTransactionError)
        // Don't fail the conversion if USD transaction recording fails
      }

      console.log('✅ Conversion successful')

      // Refresh user data
      await refreshUser()

      toast.success(`✅ Successfully converted ${edToConvert} ED to $${usdAmount.toFixed(2)} USD!`)
      setEdAmount("")

    } catch (error) {
      console.error('❌ Conversion error:', error)
      toast.error("Conversion failed. Please try again.")
    } finally {
      setConverting(false)
    }
  }

  // Quick conversion buttons
  const quickConvert = (percentage: number) => {
    const userEdBalance = user?.ed_balance || 0
    if (userEdBalance <= 0) {
      toast.error("No ED balance available")
      return
    }

    const amount = Math.floor(userEdBalance * percentage)
    if (amount < 10) {
      toast.error("Minimum conversion amount is 10 ED")
      return
    }

    setEdAmount(amount.toString())
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
          {/* Current Balances */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <Zap className="h-4 w-4 text-cyan-400" />
                <span className="text-sm text-slate-400">ED Balance</span>
              </div>
              <div className="text-lg font-bold text-cyan-400">
                {(user.ed_balance || 0).toFixed(2)} ED
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center space-x-2 mb-1">
                <DollarSign className="h-4 w-4 text-green-400" />
                <span className="text-sm text-slate-400">USD Balance</span>
              </div>
              <div className="text-lg font-bold text-green-400">
                ${(user.wallet_balance || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Conversion Rate */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="text-center mb-2">
              <div className="text-sm text-slate-400 mb-1">Current Exchange Rate</div>
              <div className="text-lg font-semibold text-purple-400">1 ED = $0.10 USD</div>
            </div>
            <div className="text-xs text-slate-400 text-center">
              Fixed rate • Minimum conversion: 10 ED
            </div>
          </div>

          {/* Quick Conversion Buttons */}
          <div className="space-y-2">
            <Label className="text-sm text-slate-300">Quick Convert</Label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => quickConvert(0.25)}
                className="text-xs py-1 h-auto bg-slate-800 hover:bg-slate-700 border-slate-600"
              >
                25%
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => quickConvert(0.5)}
                className="text-xs py-1 h-auto bg-slate-800 hover:bg-slate-700 border-slate-600"
              >
                50%
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => quickConvert(1)}
                className="text-xs py-1 h-auto bg-slate-800 hover:bg-slate-700 border-slate-600"
              >
                100%
              </Button>
            </div>
          </div>

          {/* Conversion Inputs */}
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
                min="10"
                max={user.ed_balance ?? 0}
                step="1"
                className="bg-slate-800 border-slate-700 focus:border-cyan-500 text-cyan-400"
              />
              <div className="text-xs text-slate-400">
                Available: {(user.ed_balance ?? 0).toFixed(2)} ED
              </div>
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
                className="bg-slate-800 border-slate-700 text-green-400 font-semibold"
              />
              <div className="text-xs text-slate-400">You will receive</div>
            </div>
          </div>

          {/* Convert Button */}
          <Button
            onClick={handleConvert}
            disabled={
              converting ||
              !edAmount ||
              Number.parseFloat(edAmount) < 10 ||
              Number.parseFloat(edAmount) > (user.ed_balance ?? 0)
            }
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-semibold py-3"
          >
            {converting ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Converting...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="h-4 w-4" />
                <span>Convert to USD</span>
              </div>
            )}
          </Button>

          {/* Info */}
          <div className="text-xs text-slate-400 text-center space-y-1">
            <div>✅ Converted USD will be added to your wallet balance</div>
            <div>💳 Use your USD balance for withdrawals or purchases</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}