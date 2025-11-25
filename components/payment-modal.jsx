"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2, Phone, CheckCircle, Smartphone } from "lucide-react"
import { toast } from "sonner"

export function PaymentModal({ open, onOpenChange, machine, user, onPaymentSuccess }) {
  const [processing, setProcessing] = useState(false)
  const [phone, setPhone] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("mobile_money")

  const handlePayment = async () => {
    if (!phone.trim()) {
      toast.error("Please enter your phone number")
      return
    }

    // Remove all non-digits
    const phoneWithoutSpaces = phone.replace(/\D/g, '')
    
    // Validate phone format
    if (phoneWithoutSpaces.length !== 9 || !phoneWithoutSpaces.startsWith('6')) {
      toast.error("Please enter exactly 9 digits starting with 6 (like 677123456)")
      return
    }

    // ✅ FIX: Prevent double submission
    if (processing) {
      return
    }

    console.log('🚀 Initiating secure payment...')

    setProcessing(true)

    try {
      // Call our secure server-side API route
      const response = await fetch('/api/payments/direct-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: machine.price,
          machineId: machine.id,
          userId: user.id,
          machineName: machine.name,
          phone: phoneWithoutSpaces,
          medium: selectedMethod === "mobile_money" ? "mobile money" : "orange money",
          userEmail: user.email,
          userName: user.name || user.email?.split('@')[0] || 'Customer'
        })
      })

      const data = await response.json()
      console.log('📨 Secure API response:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Payment creation failed')
      }

      // ✅ FIX: Pass transId and externalId to parent for polling
      if (onPaymentSuccess) {
        onPaymentSuccess(data.transId, data.externalId)
      }

      // Success - payment request sent to Fapshi
      toast.success("✅ " + (data.message || 'Payment request sent to your phone!'))
      toast.info("📱 Check your phone to complete the payment")
      
      // Close modal
      onOpenChange(false)

    } catch (error) {
      console.error('❌ Payment error:', error)
      toast.error("❌ " + error.message)
    } finally {
      setProcessing(false)
    }
  }

  const handlePhoneChange = (value) => {
    // Remove all non-digits
    const cleanValue = value.replace(/\D/g, '')
    
    // Allow only 9 digits
    if (cleanValue.length <= 9) {
      setPhone(cleanValue)
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
          {/* USSD Codes Info */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
            <div className="flex items-start text-blue-300 text-sm">
              <Smartphone className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">COMPLETE PAYMENT WITH USSD</p>
                <p className="text-xs mt-1">
                  Dial <span className="font-bold">#150*50#</span> for Orange Money
                  <br />
                  Dial <span className="font-bold">*126#</span> for MTN Mobile Money
                </p>
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
                  maxLength={9}
                  type="tel"
                  disabled={processing}
                />
              </div>
              <p className="text-xs text-slate-400">
                Enter 9-digit Cameroon number starting with 6
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
                  disabled={processing}
                  className={selectedMethod === "mobile_money" ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-700 hover:bg-slate-600"}
                >
                  MTN
                </Button>
                <Button
                  type="button"
                  variant={selectedMethod === "orange_money" ? "default" : "outline"}
                  onClick={() => setSelectedMethod("orange_money")}
                  disabled={processing}
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
                Sending Payment Request...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Send Payment Request
              </>
            )}
          </Button>

          <div className="text-xs text-slate-400 text-center">
            Payment request sent to your phone • Complete with USSD codes
          </div>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
            className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}