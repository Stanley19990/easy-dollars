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

    const validatedPhone = phoneWithoutSpaces;

    console.log('🚀 LIVE: Creating payment with:', validatedPhone)

    setProcessing(true)

    try {
      // LIVE API CALL - Using /direct-pay endpoint (confirmed working in sandbox)
      const response = await fetch('https://live.fapshi.com/direct-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apiuser': process.env.NEXT_PUBLIC_FAPSHI_API_USER || '18ccc447-be5f-46a5-b3fc-79394dbf75d7',
          'apikey': process.env.NEXT_PUBLIC_FAPSHI_API_KEY || 'FAK_82dd05f91bd37790c120ab6bb5dc8f56'
        },
        body: JSON.stringify({
          amount: Math.round(machine.price),
          phone: validatedPhone,
          medium: selectedMethod === "mobile_money" ? "mobile money" : "orange money",
          name: user.name || user.email?.split('@')[0] || 'Customer',
          email: user.email || "customer@easydollars.com",
          userId: user.id,
          externalId: `MACHINE_${machine.id}_${user.id}_${Date.now()}`,
          message: `Purchase ${machine.name} - EasyDollars`
        })
      })

      console.log('📨 Response status:', response.status)

      // Handle response
      const contentType = response.headers.get('content-type')
      let data;

      if (contentType && contentType.includes('application/json')) {
        data = await response.json()
      } else {
        const textResponse = await response.text()
        console.log('📨 Non-JSON response:', textResponse)
        
        if (textResponse.includes('Cannot POST')) {
          throw new Error('Payment endpoint not found. Please contact Fapshi support.')
        } else if (!response.ok) {
          throw new Error(`Payment failed: ${response.status} - ${textResponse.substring(0, 100)}`)
        } else {
          throw new Error('Unexpected response from payment service')
        }
      }

      console.log('📨 Fapshi LIVE /direct-pay response:', data)

      if (!response.ok) {
        throw new Error(data.message || `Payment failed: ${response.status}`)
      }

      // Check if we got the expected response
      if (!data.transId) {
        throw new Error('Invalid response from payment service - missing transaction ID')
      }

      // Record transaction
      try {
        await fetch('/api/payments/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: machine.price,
            machineId: machine.id,
            userId: user.id,
            machineName: machine.name,
            phone: validatedPhone,
            medium: selectedMethod,
            transId: data.transId,
            status: 'pending',
            isSandbox: false
          })
        })
      } catch (saveError) {
        console.log('⚠️ Could not save transaction record, but payment was sent')
      }

      toast.success("✅ Payment request sent to your phone!")
      toast.info("📱 Check your phone and complete the payment")
      
      onOpenChange(false)

    } catch (error) {
      console.error('❌ LIVE Payment error:', error)
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
          {/* Live Mode Info */}
          <div className="bg-green-500/10 border border-green-500/20 rounded p-3">
            <div className="flex items-start text-green-300 text-sm">
              <CheckCircle className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold">LIVE PAYMENT MODE</p>
                <p className="text-xs mt-1">Using /direct-pay endpoint</p>
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
                Sending Payment...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Send Payment Request
              </>
            )}
          </Button>

          <div className="text-xs text-slate-400 text-center">
            Using /direct-pay endpoint • Real SMS will be sent
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