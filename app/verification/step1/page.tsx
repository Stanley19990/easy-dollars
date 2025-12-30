// app/verification/step1/page.tsx - UPDATED WITH MACHINE PURCHASE CHECK
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, ArrowRight, CheckCircle, Home, Briefcase, Phone, User, Shield, AlertCircle, Cpu, Clock } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { VerificationProgress } from "@/components/verification-progress"

export default function VerificationStep1() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [machinePurchaseDays, setMachinePurchaseDays] = useState<number>(0)
  const [hasPurchasedMachine, setHasPurchasedMachine] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    residence: "",
    job: "",
    withdrawalMethods: [
      { name: "", number: "", registeredName: "" },
      { name: "", number: "", registeredName: "" }
    ]
  })

  // Check machine purchase eligibility on load
  useEffect(() => {
    if (user) {
      checkMachinePurchaseEligibility()
      loadExistingData()
    }
  }, [user])

  const checkMachinePurchaseEligibility = async () => {
    if (!user) return
    
    try {
      // Check if user has any machines
      const { data: userMachines, error } = await supabase
        .from('user_machines')
        .select('purchased_at')
        .eq('user_id', user.id)
        .limit(1)

      if (error) throw error

      const hasMachine = userMachines && userMachines.length > 0
      setHasPurchasedMachine(hasMachine)

      if (hasMachine) {
        // Get first machine purchase date
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('first_machine_purchase_date')
          .eq('id', user.id)
          .single()

        if (userError) throw userError

        // Calculate days since first machine purchase
        const purchaseDate = userData?.first_machine_purchase_date || userMachines[0].purchased_at
        if (purchaseDate) {
          const firstPurchase = new Date(purchaseDate)
          const now = new Date()
          const diffTime = Math.abs(now.getTime() - firstPurchase.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          setMachinePurchaseDays(diffDays)
        }
      }
    } catch (error) {
      console.error("Error checking machine purchase eligibility:", error)
    }
  }

  const loadExistingData = async () => {
    if (!user) return
    
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('full_name, verification_data')
        .eq('id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (userData) {
        // Set full name from user profile
        if (userData.full_name) {
          setFormData(prev => ({ ...prev, fullName: userData.full_name }))
        }

        // Load verification data if exists
        if (userData.verification_data?.personal_info) {
          const personalInfo = userData.verification_data.personal_info
          setFormData(prev => ({
            ...prev,
            residence: personalInfo.residence || "",
            job: personalInfo.job || "",
            withdrawalMethods: personalInfo.withdrawalMethods || [
              { name: "", number: "", registeredName: "" },
              { name: "", number: "", registeredName: "" }
            ]
          }))
        }
      }
    } catch (error) {
      console.error("Error loading existing data:", error)
    }
  }

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleWithdrawalMethodChange = (index: number, field: keyof typeof formData.withdrawalMethods[0], value: string) => {
    setFormData(prev => ({
      ...prev,
      withdrawalMethods: prev.withdrawalMethods.map((method, i) => 
        i === index ? { ...method, [field]: value } : method
      )
    }))
  }

  const addWithdrawalMethod = () => {
    if (formData.withdrawalMethods.length >= 2) {
      toast.error("Maximum 2 withdrawal methods allowed")
      return
    }
    setFormData(prev => ({
      ...prev,
      withdrawalMethods: [...prev.withdrawalMethods, { name: "", number: "", registeredName: "" }]
    }))
  }

  const removeWithdrawalMethod = (index: number) => {
    if (formData.withdrawalMethods.length <= 1) {
      toast.error("At least 1 withdrawal method is required")
      return
    }
    setFormData(prev => ({
      ...prev,
      withdrawalMethods: prev.withdrawalMethods.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      toast.error("Full name is required")
      return false
    }
    if (!formData.residence.trim()) {
      toast.error("Residence is required")
      return false
    }
    if (!formData.job.trim()) {
      toast.error("Job/Profession is required")
      return false
    }

    // Validate withdrawal methods
    const validMethods = formData.withdrawalMethods.filter(method => 
      method.name && method.number && method.registeredName
    )
    
    if (validMethods.length === 0) {
      toast.error("At least 1 complete withdrawal method is required")
      return false
    }

    // Validate phone numbers (Cameroon format)
    for (const method of validMethods) {
      const phoneRegex = /^(6[5-9]|2[2-9]|33|77|78|79)\d{7}$/
      if (!phoneRegex.test(method.number.replace(/\s/g, ''))) {
        toast.error(`Invalid phone number format for ${method.name}. Use Cameroon format (e.g., 6XXXXXXXX)`)
        return false
      }
    }

    return true
  }

  const handleSaveAndContinue = async () => {
    if (!user) {
      toast.error("You must be logged in")
      router.push("/login")
      return
    }

    if (!validateForm()) return

    setSaving(true)
    try {
      // Filter out empty withdrawal methods
      const validMethods = formData.withdrawalMethods.filter(method => 
        method.name && method.number && method.registeredName
      )

      // Update verification data
      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          verification_data: {
            personal_info: {
              fullName: formData.fullName,
              residence: formData.residence,
              job: formData.job,
              withdrawalMethods: validMethods,
              submitted_at: new Date().toISOString()
            },
            personal_info_completed: true
          },
          verification_status: 'in_progress',
          verification_started_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success("Personal information saved successfully!")
      router.push("/verification/step2")
      
    } catch (error) {
      console.error("Error saving personal information:", error)
      toast.error("Failed to save information. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleSaveForLater = async () => {
    if (!user) return

    setSaving(true)
    try {
      // Save as draft without marking as completed
      const validMethods = formData.withdrawalMethods.filter(method => 
        method.name && method.number && method.registeredName
      )

      const { error } = await supabase
        .from('users')
        .update({
          full_name: formData.fullName,
          verification_data: {
            personal_info: {
              fullName: formData.fullName,
              residence: formData.residence,
              job: formData.job,
              withdrawalMethods: validMethods,
              submitted_at: new Date().toISOString()
            }
          }
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success("Progress saved! You can continue later.")
      router.push("/dashboard")
      
    } catch (error) {
      console.error("Error saving draft:", error)
      toast.error("Failed to save draft")
    } finally {
      setSaving(false)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Card className="w-full max-w-md border-slate-700 bg-slate-800">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Authentication Required</h3>
              <p className="text-slate-400 mb-4">Please log in to access verification</p>
              <Button onClick={() => router.push("/login")} className="w-full">
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // NEW CHECK: Verify machine purchase eligibility
  if (!hasPurchasedMachine) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-500/20 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Cpu className="h-10 w-10 text-red-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Machine Required</h2>
              <p className="text-slate-300 mb-6">
                You need to purchase at least one AI gaming machine before you can verify your account.
                The 7-day waiting period starts from your first machine purchase.
              </p>
              <div className="space-y-4">
                <Button
                  onClick={() => router.push("/dashboard")}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                >
                  <Cpu className="h-5 w-5 mr-2" />
                  Browse Machines
                </Button>
                <Button
                  onClick={() => router.push("/")}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Go Home
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // NEW CHECK: Verify 7-day waiting period
  if (machinePurchaseDays < 7) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-yellow-500/20 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="bg-yellow-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="h-10 w-10 text-yellow-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Verification Unlocks Soon</h2>
              <p className="text-slate-300 mb-4">
                You need to wait <span className="text-yellow-400 font-bold">{7 - machinePurchaseDays}</span> more day(s) after purchasing your first machine to verify your account.
              </p>
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center space-x-2">
                  <div className="text-yellow-400 font-bold text-xl">{machinePurchaseDays}/7</div>
                  <div className="text-slate-300">Days Completed</div>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2 mt-2">
                  <div 
                    className="bg-gradient-to-r from-yellow-500 to-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(machinePurchaseDays / 7) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  Started: {machinePurchaseDays} day(s) ago from first machine purchase
                </p>
              </div>
              <Button
                onClick={() => router.push("/dashboard")}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-cyan-400" />
              <h1 className="text-xl font-bold text-white">Account Verification</h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push("/dashboard")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <VerificationProgress currentStep={1} />

        <div className="max-w-2xl mx-auto">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <User className="h-5 w-5 text-cyan-400" />
                <span>Step 1: Personal Information</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Provide accurate information to verify your identity and set up withdrawal methods
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">
                  Full Legal Name
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange("fullName", e.target.value)}
                  placeholder="Enter your full name as on ID"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
                <p className="text-xs text-slate-500">
                  Must match your official identification documents
                </p>
              </div>

              {/* Residence */}
              <div className="space-y-2">
                <Label htmlFor="residence" className="text-white">
                  <Home className="h-4 w-4 inline mr-2 text-cyan-400" />
                  Current Residence
                </Label>
                <Textarea
                  id="residence"
                  value={formData.residence}
                  onChange={(e) => handleInputChange("residence", e.target.value)}
                  placeholder="Enter your complete address including city and country"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px]"
                />
              </div>

              {/* Job/Profession */}
              <div className="space-y-2">
                <Label htmlFor="job" className="text-white">
                  <Briefcase className="h-4 w-4 inline mr-2 text-cyan-400" />
                  Job/Profession
                </Label>
                <Input
                  id="job"
                  value={formData.job}
                  onChange={(e) => handleInputChange("job", e.target.value)}
                  placeholder="What do you do for a living?"
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                />
              </div>

              {/* Withdrawal Methods */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-white">
                    <Phone className="h-4 w-4 inline mr-2 text-cyan-400" />
                    Withdrawal Methods (Mobile Money)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addWithdrawalMethod}
                    disabled={formData.withdrawalMethods.length >= 2}
                    className="text-xs border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    + Add Another
                  </Button>
                </div>
                
                <p className="text-sm text-slate-400">
                  Provide 1-2 mobile money accounts for withdrawals. Name must match account registration.
                </p>

                {formData.withdrawalMethods.map((method, index) => (
                  <div key={index} className="p-4 border border-slate-700 rounded-lg bg-slate-700/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-white">Method {index + 1}</h4>
                      {formData.withdrawalMethods.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeWithdrawalMethod(index)}
                          className="h-6 w-6 p-0 text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          ×
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400">Service Provider</Label>
                        <Select
                          value={method.name}
                          onValueChange={(value) => handleWithdrawalMethodChange(index, "name", value)}
                        >
                          <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                            <SelectValue placeholder="Select provider" />
                          </SelectTrigger>
                          <SelectContent className="bg-slate-800 border-slate-700">
                            <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                            <SelectItem value="orange">Orange Money</SelectItem>
                            <SelectItem value="express">Express Union Mobile</SelectItem>
                            <SelectItem value="nexttel">Nexttel eCash</SelectItem>
                            <SelectItem value="camtel">Camtel Mobile Money</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs text-slate-400">Phone Number</Label>
                        <Input
                          value={method.number}
                          onChange={(e) => handleWithdrawalMethodChange(index, "number", e.target.value)}
                          placeholder="6XXXXXXXX"
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs text-slate-400">Registered Account Name</Label>
                      <Input
                        value={method.registeredName}
                        onChange={(e) => handleWithdrawalMethodChange(index, "registeredName", e.target.value)}
                        placeholder="Name as registered with service provider"
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                      <p className="text-xs text-slate-500">
                        Must match the name on your mobile money account
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Information Security Notice */}
              <div className="p-4 border border-cyan-500/20 bg-cyan-500/5 rounded-lg">
                <div className="flex items-start space-x-3">
                  <Shield className="h-5 w-5 text-cyan-400 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-cyan-300 mb-1">Your Information is Secure</h4>
                    <p className="text-sm text-cyan-200/80">
                      All personal information is encrypted and stored securely. We only use this information for account verification and withdrawal processing.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-700">
                <Button
                  onClick={handleSaveForLater}
                  variant="outline"
                  disabled={saving}
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Save & Finish Later
                </Button>
                <Button
                  onClick={handleSaveAndContinue}
                  disabled={saving}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                >
                  {saving ? "Saving..." : (
                    <>
                      Save & Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-sm text-slate-500">
              Need help? Contact support at{" "}
              <a href="mailto:support@easydollars.com" className="text-cyan-400 hover:text-cyan-300">
                support@easydollars.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}