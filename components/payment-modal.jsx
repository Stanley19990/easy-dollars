"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2, Phone, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export function PaymentModal({ open, onOpenChange, machine, user, onPaymentSuccess }) {
  const [processing, setProcessing] = useState(false)
  const [phone, setPhone] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("mobile_money")

  const validatePhone = (phoneNumber) => {
    if (!phoneNumber) return null
    
    // Remove any spaces or special characters
    const cleanPhone = phoneNumber.replace(/\s+/g, '').replace(/[^\d]/g, '')
    
    // Check if it's 9 digits (6XXXXXXXX) - convert to 237 format
    if (cleanPhone.length === 9 && cleanPhone.startsWith('6')) {
      return `237${cleanPhone}`
    } 
    // Check if it's 11 digits (2376XXXXXXXX) - use as is
    else if (cleanPhone.length === 11 && cleanPhone.startsWith('2376')) {
      return cleanPhone
    }
    // Check if it's 12 digits (2376XXXXXXXX) - sometimes happens
    else if (cleanPhone.length === 12 && cleanPhone.startsWith('2376')) {
      return cleanPhone
    }
    
    return null
  }

  const handlePayment = async () => {
    if (!phone.trim()) {
      toast.error("Please enter your phone number")
      return
    }

    // Validate phone
    const validatedPhone = validatePhone(phone)
    if (!validatedPhone) {
      toast.error("Please enter a valid Cameroon MTN or Orange number (6XXXXXXXX or 2376XXXXXXXX)")
      return
    }

    setProcessing(true)

    try {
      console.log('🚀 Initiating direct payment...', { phone: validatedPhone, method: selectedMethod })

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
          phone: validatedPhone,
          medium: selectedMethod === "mobile_money" ? "mobile money" : "orange money",
          userEmail: user.email,
          userName: user.name || user.email?.split('@')[0] || 'Customer'
        })
      })

      const data = await response.json()
      console.log('📨 Payment response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Payment failed')
      }

      toast.success("✅ Payment request sent to your phone!")
      toast.info("📱 Check your phone and complete the payment to activate your machine")
      
      onOpenChange(false)

    } catch (error) {
      console.error('❌ Payment error:', error)
      toast.error("❌ " + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handlePhoneChange = (value) => {
    // Auto-format as user types
    const cleanValue = value.replace(/\s+/g, '').replace(/[^\d]/g, '')
    
    if (cleanValue.startsWith('237')) {
      // Format as 237 6XX XXX XXX
      if (cleanValue.length <= 3) {
        setPhone(cleanValue)
      } else if (cleanValue.length <= 6) {
        setPhone(`${cleanValue.slice(0, 3)} ${cleanValue.slice(3)}`)
      } else if (cleanValue.length <= 9) {
        setPhone(`${cleanValue.slice(0, 3)} ${cleanValue.slice(3, 6)} ${cleanValue.slice(6)}`)
      } else {
        setPhone(`${cleanValue.slice(0, 3)} ${cleanValue.slice(3, 6)} ${cleanValue.slice(6, 9)} ${cleanValue.slice(9, 12)}`)
      }
    } else if (cleanValue.startsWith('6')) {
      // Format as 6XX XXX XXX
      if (cleanValue.length <= 3) {
        setPhone(cleanValue)
      } else if (cleanValue.length <= 6) {
        setPhone(`${cleanValue.slice(0, 3)} ${cleanValue.slice(3)}`)
      } else {
        setPhone(`${cleanValue.slice(0, 3)} ${cleanValue.slice(3, 6)} ${cleanValue.slice(6, 9)}`)
      }
    } else {
      setPhone(value)
    }
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
                <p className="text-xs mt-1">Payment request will be sent directly to your phone</p>
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
                  placeholder="6XX XXX XXX or 237 6XX XXX XXX"
                  maxLength={14}
                />
              </div>
              <p className="text-xs text-slate-400">
                Enter your Cameroon MTN or Orange number
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
                  MTN Mobile Money
                </Button>
                <Button
                  type="button"
                  variant={selectedMethod === "orange_money" ? "default" : "outline"}
                  onClick={() => setSelectedMethod("orange_money")}
                  className={selectedMethod === "orange_money" ? "bg-orange-600 hover:bg-orange-700" : "bg-slate-700 hover:bg-slate-600"}
                >
                  Orange Money
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
            disabled={processing || !phone.trim()}
            className="w-full font-semibold py-3 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending Payment...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Send Payment Request
              </>
            )}
          </Button>

          <div className="text-xs text-slate-400 text-center">
            Payment request sent to your phone • Complete payment to activate machine
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