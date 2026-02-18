"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CreditCard, Loader2, Phone, Smartphone, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export function PaymentModal({ open, onOpenChange, machine, user, onPaymentSuccess }) {
  const [processing, setProcessing] = useState(false)
  const [phone, setPhone] = useState("")
  const [selectedMethod, setSelectedMethod] = useState("mobile_money")
  const [errorMessage, setErrorMessage] = useState("")

  // Helper function to get discounted price
  const getDiscountedPrice = (price) => {
    const discountMachines = [50000, 100000, 150000]
    if (discountMachines.includes(price)) {
      return Math.round(price * 0.95) // 5% discount
    }
    return price
  }

  // Helper function to check if machine is discounted
  const isDiscounted = (price) => {
    return [50000, 100000, 150000].includes(price)
  }

  const finalPrice = getDiscountedPrice(machine?.price || 0)
  const hasDiscount = isDiscounted(machine?.price || 0)
  const discountAmount = (machine?.price || 0) - finalPrice

  const validatePhone = (phoneNumber) => {
    const clean = phoneNumber.replace(/\D/g, '')
    // Cameroon numbers: 9 digits starting with 6, or 11 digits starting with 2376
    return (clean.length === 9 && clean.startsWith('6')) || 
           (clean.length === 11 && clean.startsWith('2376'))
  }

  const formatPhoneForAPI = (phoneNumber) => {
    const clean = phoneNumber.replace(/\D/g, '')
    // Return last 9 digits for Fapshi
    return clean.slice(-9)
  }

  const handlePayment = async () => {
    setErrorMessage("")
    
    if (!phone.trim()) {
      setErrorMessage("Please enter your phone number")
      toast.error("Please enter your phone number")
      return
    }

    if (!validatePhone(phone)) {
      setErrorMessage("Please enter a valid Cameroon number (e.g., 677123456 or 237677123456)")
      toast.error("Invalid phone number format")
      return
    }

    if (processing) {
      return
    }

    setProcessing(true)

    try {
      const formattedPhone = formatPhoneForAPI(phone)
      
      const response = await fetch('/api/payments/direct-pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: finalPrice,
          machineId: machine.id,
          userId: user.id,
          machineName: machine.name,
          phone: formattedPhone,
          medium: selectedMethod === "mobile_money" ? "mobile money" : "orange money",
          userEmail: user.email,
          userName: user.name || user.email?.split('@')[0] || 'Customer'
        })
      })

      const data = await response.json()

      if (!response.ok) {
        // Handle specific error messages
        if (data.error?.toLowerCase().includes('insufficient') || 
            data.error?.toLowerCase().includes('balance')) {
          throw new Error('Insufficient balance in your mobile money account. Please recharge and try again.')
        } else if (data.error?.toLowerCase().includes('phone') || 
                   data.error?.toLowerCase().includes('number')) {
          throw new Error('This phone number is not registered with mobile money. Please check and try again.')
        } else {
          throw new Error(data.error || 'Payment failed. Please try again.')
        }
      }

      if (onPaymentSuccess) {
        onPaymentSuccess(data.transId, data.externalId)
      }

      toast.success("✅ Payment request sent to your phone!")
      toast.info("📱 Please check your phone and enter your PIN to complete the payment")
      
      onOpenChange(false)

    } catch (error) {
      console.error('❌ Payment error:', error)
      const errorMsg = error.message || 'Payment failed. Please try again.'
      setErrorMessage(errorMsg)
      toast.error("❌ " + errorMsg)
    } finally {
      setProcessing(false)
    }
  }

  const handlePhoneChange = (e) => {
    const value = e.target.value
    // Allow digits, spaces, and +
    const cleanValue = value.replace(/[^\d+]/g, '')
    setPhone(cleanValue)
    setErrorMessage("") // Clear error when user types
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl text-white text-center">
            Purchase {machine?.name || 'Machine'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasDiscount && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-3 animate-pulse">
              <div className="flex items-center justify-between">
                <span className="text-green-400 font-bold">🔥 5% DISCOUNT!</span>
                <span className="text-white font-bold">Save {discountAmount?.toLocaleString() || 0} XAF</span>
              </div>
            </div>
          )}

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

          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <Input
                  id="phone"
                  value={phone}
                  onChange={handlePhoneChange}
                  className={`pl-10 bg-slate-800 border-slate-700 text-white ${errorMessage ? 'border-red-500' : ''}`}
                  placeholder="677123456 or 237677123456"
                  type="tel"
                  disabled={processing}
                />
              </div>
              {errorMessage && (
                <div className="flex items-center gap-1 text-red-400 text-xs mt-1">
                  <AlertCircle className="h-3 w-3" />
                  <span>{errorMessage}</span>
                </div>
              )}
              <p className="text-xs text-slate-400">
                Enter Cameroon number (9 digits starting with 6, or 11 digits with 237)
              </p>
            </div>

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

          <div className="bg-slate-800/50 rounded-lg p-4">
            {hasDiscount ? (
              <>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-slate-400">Original Price:</span>
                  <span className="text-sm text-red-400 line-through">
                    {machine?.price?.toLocaleString() || 0} XAF
                  </span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">Discounted Price:</span>
                  <span className="text-2xl font-bold text-green-400">
                    {finalPrice?.toLocaleString() || 0} XAF
                  </span>
                </div>
                <div className="text-xs text-amber-400 font-bold text-center mt-1">
                  🔥 You save {discountAmount?.toLocaleString() || 0} XAF (5% OFF)
                </div>
              </>
            ) : (
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-400">Amount:</span>
                <span className="text-2xl font-bold text-green-400">
                  {machine?.price?.toLocaleString() || 0} XAF
                </span>
              </div>
            )}
            {machine?.description && (
              <div className="text-sm text-slate-400 mt-2">
                {machine.description}
              </div>
            )}
          </div>

          <Button
            onClick={handlePayment}
            disabled={processing || !phone.trim()}
            className="w-full font-semibold py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed"
          >
            {processing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending Payment Request...
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4 mr-2" />
                Pay {finalPrice?.toLocaleString() || 0} XAF
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