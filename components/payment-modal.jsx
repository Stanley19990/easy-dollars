"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2, Phone, CheckCircle, WifiOff } from "lucide-react"
import { toast } from "sonner"

export function PaymentModal({ open, onOpenChange, machine, user, onPaymentSuccess }) {
  const [processing, setProcessing] = useState(false)
  const [phone, setPhone] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("mobile_money")

  const validatePhone = (phoneNumber) => {
    if (!phoneNumber) return null
    
    // Remove ALL spaces and special characters - ONLY digits
    const cleanPhone = phoneNumber.replace(/\D/g, '') // Remove all non-digits
    
    console.log('🔧 Validating phone:', cleanPhone, 'Length:', cleanPhone.length)
    
    // Fapshi expects EXACTLY: 2376XXXXXXXX (12 digits total)
    // 237 (country code) + 6 (MTN/Orange) + 8 digits = 12 digits
    
    // Check if it's exactly 12 digits starting with 2376
    if (cleanPhone.length === 12 && cleanPhone.startsWith('2376')) {
      return cleanPhone
    }
    // Check if it's 9 digits starting with 6 - convert to 237 format
    else if (cleanPhone.length === 9 && cleanPhone.startsWith('6')) {
      return `237${cleanPhone}`
    }
    // Check if it's 11 digits starting with 2376 - might be missing one digit
    else if (cleanPhone.length === 11 && cleanPhone.startsWith('2376')) {
      return `${cleanPhone}0` // Add missing digit
    }
    
    console.log('❌ Invalid phone format:', cleanPhone)
    return null
  }

  const handlePayment = async () => {
    if (!phone.trim()) {
      toast.error("Please enter your phone number")
      return
    }

    // Remove ALL spaces from the input before validation
    const phoneWithoutSpaces = phone.replace(/\s/g, '')
    
    // Validate phone
    const validatedPhone = validatePhone(phoneWithoutSpaces)
    if (!validatedPhone) {
      toast.error("Please enter a valid 9-digit Cameroon number starting with 6")
      return
    }

    console.log('🚀 Sending phone to API:', validatedPhone)

    setProcessing(true)

    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: machine.price,
          machineId: machine.id,
          userId: user.id,
          machineName: machine.name,
          phone: validatedPhone, // Send the validated phone (NO SPACES)
          medium: selectedMethod === "mobile_money" ? "mobile money" : "orange money",
          userEmail: user.email,
          userName: user.name || user.email?.split('@')[0] || 'Customer'
        })
      })

      const data = await response.json()
      console.log('📨 Payment API response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Payment creation failed')
      }

      toast.success("✅ Payment request sent to your phone!")
      toast.info("📱 Check your phone and complete the payment to activate your machine")
      
      onOpenChange(false)

    } catch (error) {
      console.error('❌ Payment error:', error)
      
      // Handle specific error types
      if (error.message.includes('fetch failed') || 
          error.message.includes('network') || 
          error.message.includes('connect') ||
          error.message.includes('timeout')) {
        toast.error(
          <div className="flex items-center">
            <WifiOff className="h-4 w-4 mr-2" />
            Network error. Please check your connection and try again.
          </div>
        )
      } else {
        toast.error("❌ " + error.message)
      }
    } finally {
      setProcessing(false)
    }
  }

  const handlePhoneChange = (value) => {
    // Remove all non-digits first
    const cleanValue = value.replace(/\D/g, '')
    
    // Set the phone state with ONLY digits (no spaces)
    setPhone(cleanValue)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-white text-center">
            Purchase {machine.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payment Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
            <div className="flex items-start text-blue-300 text-sm">
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Mobile Money Payment</p>
                <p className="text-xs mt-1">Enter your 9-digit Cameroon number (no spaces)</p>
              </div>
            </div>
          </div>

          {/* Phone Input */}
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-700 text-white"
                  placeholder="677123456"
                  maxLength={9} // Only 9 digits allowed
                  type="tel" // Better for phone numbers
                />
              </div>
              <p className="text-xs text-slate-400">
                Enter 9-digit number starting with 6 (no spaces)
              </p>
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label className="text-slate-300">Payment Method</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={selectedMethod === "mobile_money" ? "default" : "outline"}
                  onClick={() => setSelectedMethod("mobile_money")}
                  className={selectedMethod === "mobile_money" ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 hover:bg-slate-600"}
                >
                  MTN
                </Button>
                <Button
                  type="button"
                  variant={selectedMethod === "orange_money" ? "default" : "outline"}
                  onClick={() => setSelectedMethod("orange_money")}
                  className={selectedMethod === "orange_money" ? "bg-orange-600 hover:bg-orange-700" : "bg-slate-700 hover:bg-slate-600"}
                >
                  Orange
                </Button>
              </div>
            </div>
          </div>

          {/* Machine Info */}
          <div className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-slate-400">Amount:</span>
              <span className="text-2xl font-bold text-green-400">
                {machine.price.toLocaleString()} XAF
              </span>
            </div>
            <div className="text-sm text-slate-400">
              {machine.description}
            </div>
          </div>

          {/* Payment Button */}
          <Button
            onClick={handlePayment}
            disabled={processing || phone.length !== 9}
            className="w-full font-semibold py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Payment...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Send Payment Request
              </>
            )}
          </Button>

          <div className="text-xs text-slate-400 text-center">
            Enter 9-digit number • No spaces needed • Machine activates after payment
          </div>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}