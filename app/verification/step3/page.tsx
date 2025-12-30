// app/verification/step3/page.tsx - UPDATED WITH MACHINE PURCHASE CHECK
"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Camera, Upload, CheckCircle, XCircle, ArrowLeft, Shield, AlertCircle, FileText, User, Image as ImageIcon, Cpu, Clock } from "lucide-react"
import { toast } from "sonner"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/hooks/use-auth"
import { VerificationProgress } from "@/components/verification-progress"

export default function VerificationStep3() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [machinePurchaseDays, setMachinePurchaseDays] = useState<number>(0)
  const [hasPurchasedMachine, setHasPurchasedMachine] = useState(false)
  
  // File state
  const [frontId, setFrontId] = useState<File | null>(null)
  const [backId, setBackId] = useState<File | null>(null)
  const [selfie, setSelfie] = useState<File | null>(null)
  
  // Preview state
  const [frontIdPreview, setFrontIdPreview] = useState<string>("")
  const [backIdPreview, setBackIdPreview] = useState<string>("")
  const [selfiePreview, setSelfiePreview] = useState<string>("")

  // File input refs
  const frontIdRef = useRef<HTMLInputElement>(null)
  const backIdRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  // Check machine purchase eligibility on load
  useEffect(() => {
    if (user) {
      checkMachinePurchaseEligibility()
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

  const handleFileSelect = (
    file: File | null, 
    setFile: (file: File | null) => void, 
    setPreview: (preview: string) => void,
    type: string
  ) => {
    if (!file) return
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(`File size too large. Maximum size is 5MB.`)
      return
    }
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!validTypes.includes(file.type)) {
      toast.error(`Invalid file type. Please upload JPEG, PNG, or WebP images.`)
      return
    }
    
    setFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
    
    toast.success(`${type} selected successfully`)
  }

  const triggerFileInput = (ref: React.RefObject<HTMLInputElement>) => {
    if (ref.current) {
      ref.current.click()
    }
  }

  const uploadFile = async (file: File, path: string): Promise<string> => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = `${path}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('verification-documents')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('verification-documents')
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handleCompleteVerification = async () => {
    if (!user) {
      toast.error("You must be logged in")
      router.push("/login")
      return
    }

    // Validate all files are uploaded
    if (!frontId || !selfie) {
      toast.error("Please upload both ID Front and Selfie with ID")
      return
    }

    setLoading(true)
    setUploading(true)

    try {
      const uploadedFiles: any = {}

      // Upload front ID
      if (frontId) {
        const frontUrl = await uploadFile(frontId, `${user.id}/id_docs`)
        uploadedFiles.frontIdUrl = frontUrl
      }

      // Upload back ID (optional)
      if (backId) {
        const backUrl = await uploadFile(backId, `${user.id}/id_docs`)
        uploadedFiles.backIdUrl = backUrl
      }

      // Upload selfie
      if (selfie) {
        const selfieUrl = await uploadFile(selfie, `${user.id}/selfies`)
        uploadedFiles.selfieUrl = selfieUrl
      }

      // Update verification data
      const { error } = await supabase
        .from('users')
        .update({
          verification_data: {
            id_verification: {
              ...uploadedFiles,
              uploadedAt: new Date().toISOString(),
              verified: false
            },
            id_verified: true
          },
          verification_status: 'in_progress',
          verification_completed_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) throw error

      toast.success("Verification submitted successfully! Our team will review your documents within 24-48 hours.")
      router.push("/verification/success")
      
    } catch (error: any) {
      console.error("Error completing verification:", error)
      toast.error(error.message || "Failed to submit verification. Please try again.")
    } finally {
      setLoading(false)
      setUploading(false)
    }
  }

  const handleSaveForLater = () => {
    router.push("/dashboard")
    toast.info("You can return to complete ID verification later")
  }

  const FileUploadCard = ({ 
    title, 
    description, 
    required,
    file: fileProp,
    preview,
    onFileSelect,
    onTrigger,
    inputRef,
    type
  }: {
    title: string
    description: string
    required: boolean
    file: File | null
    preview: string
    onFileSelect: (file: File) => void
    onTrigger: () => void
    inputRef: React.RefObject<HTMLInputElement>
    type: string
  }) => {
    return (
      <Card className="border-slate-700 bg-slate-800/30">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1 space-y-4">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h3 className="font-semibold text-white">{title}</h3>
                  {required && (
                    <span className="text-xs px-2 py-1 bg-red-500/10 text-red-400 rounded-full">
                      Required
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-400">{description}</p>
              </div>

              <input
                type="file"
                ref={inputRef}
                onChange={(e) => {
                  const file = e.target.files?.[0] || null
                  if (file) onFileSelect(file)
                }}
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
              />

              <Button
                onClick={onTrigger}
                variant="outline"
                className="w-full border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
                disabled={uploading}
              >
                {fileProp ? (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
                    Change {type}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload {type}
                  </>
                )}
              </Button>

              {fileProp && (
                <div className="text-xs text-slate-500">
                  <p>File: {fileProp.name}</p>
                  <p>Size: {(fileProp.size / 1024 / 1024).toFixed(2)} MB</p>
                  <p>Type: {fileProp.type}</p>
                </div>
              )}
            </div>

            {/* Preview */}
            <div className="md:w-48">
              <div className="aspect-video rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/50 overflow-hidden">
                {preview ? (
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <ImageIcon className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">No image selected</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
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

  const canSubmit = frontId && selfie

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Camera className="h-6 w-6 text-green-400" />
              <h1 className="text-xl font-bold text-white">ID Verification</h1>
            </div>
            <Button
              variant="ghost"
              onClick={() => router.push("/verification/step2")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Progress Bar */}
        <VerificationProgress currentStep={3} />

        <div className="max-w-4xl mx-auto">
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-white">
                <Shield className="h-5 w-5 text-green-400" />
                <span>Identity Verification</span>
              </CardTitle>
              <CardDescription className="text-slate-400">
                Upload clear photos of your ID documents for verification. This ensures account security and enables withdrawals.
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Upload Section */}
          <div className="space-y-6 mb-8">
            <FileUploadCard
              title="ID Card Front"
              description="Clear photo of the front side of your National ID Card, Driver's License, or Passport"
              required={true}
              file={frontId}
              preview={frontIdPreview}
              onFileSelect={(file) => handleFileSelect(file, setFrontId, setFrontIdPreview, "Front ID")}
              onTrigger={() => triggerFileInput(frontIdRef)}
              inputRef={frontIdRef}
              type="Front ID"
            />

            <FileUploadCard
              title="ID Card Back (Optional)"
              description="Photo of the back side of your ID card if applicable"
              required={false}
              file={backId}
              preview={backIdPreview}
              onFileSelect={(file) => handleFileSelect(file, setBackId, setBackIdPreview, "Back ID")}
              onTrigger={() => triggerFileInput(backIdRef)}
              inputRef={backIdRef}
              type="Back ID"
            />

            <FileUploadCard
              title="Selfie with ID"
              description="Take a selfie while holding your ID card next to your face. Ensure both face and ID are clearly visible."
              required={true}
              file={selfie}
              preview={selfiePreview}
              onFileSelect={(file) => handleFileSelect(file, setSelfie, setSelfiePreview, "Selfie")}
              onTrigger={() => triggerFileInput(selfieRef)}
              inputRef={selfieRef}
              type="Selfie"
            />
          </div>

          {/* Requirements & Tips */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card className="border-cyan-500/20 bg-cyan-500/5">
              <CardHeader>
                <CardTitle className="flex items-center text-sm text-cyan-300">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Photo Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-cyan-200/80">
                  <li className="flex items-start space-x-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5" />
                    <span>Use high-quality, clear photos</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5" />
                    <span>Ensure all text is readable</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5" />
                    <span>Good lighting, no shadows on ID</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5" />
                    <span>File size under 5MB each</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5" />
                    <span>Accepted formats: JPG, PNG, WebP</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-500/20 bg-purple-500/5">
              <CardHeader>
                <CardTitle className="flex items-center text-sm text-purple-300">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Security Notice
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-purple-200/80">
                  <li className="flex items-start space-x-2">
                    <Shield className="h-4 w-4 text-purple-400 mt-0.5" />
                    <span>All documents are encrypted and securely stored</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <FileText className="h-4 w-4 text-purple-400 mt-0.5" />
                    <span>Documents are only used for verification</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <User className="h-4 w-4 text-purple-400 mt-0.5" />
                    <span>We never share your documents with third parties</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-purple-400 mt-0.5" />
                    <span>Documents are deleted after verification</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={handleSaveForLater}
                  variant="outline"
                  className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  Save & Finish Later
                </Button>
                <Button
                  onClick={handleCompleteVerification}
                  disabled={loading || !canSubmit}
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">⟳</span>
                      {uploading ? "Uploading..." : "Submitting..."}
                    </>
                  ) : (
                    "Submit for Verification"
                  )}
                </Button>
              </div>
              
              {!canSubmit && (
                <p className="text-sm text-yellow-400 mt-4 text-center">
                  Please upload both ID Front and Selfie with ID to submit
                </p>
              )}
            </CardContent>
          </Card>

          {/* Processing Time Info */}
          <div className="mt-6 p-4 border border-blue-500/20 bg-blue-500/5 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-300 mb-1">Verification Processing</h4>
                <p className="text-sm text-blue-200/80">
                  Once submitted, our team will review your documents within 24-48 hours. 
                  You'll receive a notification when your verification is complete. 
                  During this time, you can continue using the app normally.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}