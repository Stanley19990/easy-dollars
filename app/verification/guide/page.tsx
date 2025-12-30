// app/verification/guide/page.tsx - NEW SETUP GUIDE PAGE
"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Shield, Lock, Users, Camera, FileText, Cpu, Clock, ArrowRight, AlertCircle, Zap, TrendingUp, DollarSign, UserCheck, Handshake } from "lucide-react"

export default function VerificationGuidePage() {
  const router = useRouter()

  const steps = [
    {
      number: 1,
      title: "Purchase Your First Machine",
      description: "Buy at least one AI gaming machine (minimum 2500 XAF). The 7-day waiting period starts from your first machine purchase.",
      icon: Cpu,
      iconColor: "text-red-400",
      bgColor: "bg-red-500/10",
      requirements: [
        "Minimum 2500 XAF machine purchase",
        "7-day waiting period begins"
      ]
    },
    {
      number: 2,
      title: "Wait 7 Days",
      description: "Complete 7 days since your first machine purchase. This helps us ensure serious commitment and prevent fraud.",
      icon: Clock,
      iconColor: "text-yellow-400",
      bgColor: "bg-yellow-500/10",
      requirements: [
        "7 days from first machine purchase",
        "Automatic tracking"
      ]
    },
    {
      number: 3,
      title: "Personal Information",
      description: "Provide your full legal name, residence address, job details, and withdrawal methods (mobile money).",
      icon: FileText,
      iconColor: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      requirements: [
        "Full legal name matching ID",
        "Complete residential address",
        "Job/profession details",
        "Mobile money withdrawal methods"
      ]
    },
    {
      number: 4,
      title: "Support Verification",
      description: "Invite 10 friends to join, with at least 5 purchasing machines (2500 XAF minimum each).",
      icon: Users,
      iconColor: "text-purple-400",
      bgColor: "bg-purple-500/10",
      requirements: [
        "10 successful referrals",
        "5+ referrals with machine purchases",
        "Minimum 2500 XAF per machine"
      ]
    },
    {
      number: 5,
      title: "ID Verification",
      description: "Upload clear photos of your ID card and a selfie with your ID for identity confirmation.",
      icon: Camera,
      iconColor: "text-green-400",
      bgColor: "bg-green-500/10",
      requirements: [
        "Front ID photo (clear & readable)",
        "Selfie with ID (face + ID visible)",
        "Optional back ID photo"
      ]
    }
  ]

  const benefits = [
    {
      title: "Unlock Withdrawals",
      description: "Cash out your earnings to your mobile money account",
      icon: DollarSign,
      color: "text-green-400"
    },
    {
      title: "Higher Earnings",
      description: "Increased daily earning limits and bonus opportunities",
      icon: TrendingUp,
      color: "text-yellow-400"
    },
    {
      title: "Priority Support",
      description: "Faster response times and dedicated assistance",
      icon: Zap,
      color: "text-cyan-400"
    },
    {
      title: "Community Trust",
      description: "Verified badge and recognition in the community",
      icon: UserCheck,
      color: "text-purple-400"
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">Account Verification Guide</h1>
                <p className="text-slate-400">Complete verification to unlock withdrawals and secure your account</p>
              </div>
            </div>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Security Message Banner */}
        <div className="mb-8">
          <Card className="border-red-500/20 bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div className="p-3 bg-red-500/20 rounded-lg">
                    <AlertCircle className="h-6 w-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-1">Security & Fraud Prevention</h3>
                    <p className="text-slate-300">
                      To combat fraud, ensure platform security, and protect your earnings, all users must complete identity verification. 
                      This maintains trust and security within our gaming community.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => router.push("/verification")}
                  className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 whitespace-nowrap"
                >
                  Start Verification
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Why Verification is Required */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Lock className="h-5 w-5 text-cyan-400" />
                  <span>Why Verification is Required</span>
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Protecting our community and your earnings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/30">
                    <h4 className="font-medium text-white mb-2">Fraud Prevention</h4>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5" />
                        <span>Prevent multiple fake accounts</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5" />
                        <span>Stop bot attacks and automated systems</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-red-400 mt-1.5" />
                        <span>Ensure real, active users only</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/30">
                    <h4 className="font-medium text-white mb-2">Your Security</h4>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-400 mt-1.5" />
                        <span>Protect your earnings and withdrawals</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-400 mt-1.5" />
                        <span>Secure your account from unauthorized access</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-400 mt-1.5" />
                        <span>Verified identity for dispute resolution</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/30">
                    <h4 className="font-medium text-white mb-2">Community Trust</h4>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5" />
                        <span>Build trust among genuine gamers</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5" />
                        <span>Create a safe environment for everyone</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5" />
                        <span>Maintain platform integrity and reputation</span>
                      </li>
                    </ul>
                  </div>

                  <div className="p-4 border border-slate-700 rounded-lg bg-slate-800/30">
                    <h4 className="font-medium text-white mb-2">Compliance</h4>
                    <ul className="space-y-1 text-sm text-slate-400">
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5" />
                        <span>Meet financial regulations and standards</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5" />
                        <span>Enable secure payment processing</span>
                      </li>
                      <li className="flex items-start space-x-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-purple-400 mt-1.5" />
                        <span>Ensure legal operation of the platform</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Verification Steps */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">Complete Verification in 5 Steps</CardTitle>
                <CardDescription className="text-slate-400">
                  Follow these steps to verify your account and unlock all features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {steps.map((step, index) => (
                    <div key={step.number} className="relative">
                      {index < steps.length - 1 && (
                        <div className="absolute left-6 top-14 bottom-0 w-0.5 bg-slate-700"></div>
                      )}
                      
                      <div className="flex items-start space-x-4">
                        <div className={`p-4 rounded-xl ${step.bgColor} flex-shrink-0`}>
                          <step.icon className={`h-6 w-6 ${step.iconColor}`} />
                        </div>
                        
                        <div className="flex-1 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center space-x-2">
                                <div className="px-3 py-1 bg-slate-700 rounded-full text-sm font-medium text-white">
                                  Step {step.number}
                                </div>
                                <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                              </div>
                              <p className="text-slate-300 mt-1">{step.description}</p>
                            </div>
                          </div>
                          
                          <div className="bg-slate-800/50 rounded-lg p-4">
                            <h4 className="text-sm font-medium text-slate-300 mb-2">Requirements:</h4>
                            <ul className="space-y-1">
                              {step.requirements.map((req, idx) => (
                                <li key={idx} className="flex items-center space-x-2 text-sm text-slate-400">
                                  <CheckCircle className="h-3 w-3 text-green-400" />
                                  <span>{req}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Benefits Card */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-white">
                  <Handshake className="h-5 w-5 text-green-400" />
                  <span>Benefits of Verification</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border border-slate-700 rounded-lg bg-slate-800/30">
                    <div className="p-2 bg-slate-700 rounded-lg">
                      <benefit.icon className={`h-5 w-5 ${benefit.color}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{benefit.title}</h4>
                      <p className="text-sm text-slate-400">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Start Card */}
            <Card className="border-cyan-500/20 bg-gradient-to-b from-cyan-500/10 to-blue-500/10 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="bg-gradient-to-r from-cyan-500 to-blue-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Zap className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Ready to Verify?</h3>
                  <p className="text-slate-300 mb-6">
                    Complete verification to unlock withdrawals and start cashing out your earnings!
                  </p>
                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push("/verification")}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
                    >
                      Start Verification
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    <Button
                      onClick={() => router.push("/dashboard")}
                      variant="outline"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      Check Eligibility
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* FAQ Card */}
            <Card className="border-slate-700 bg-slate-800/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white">FAQs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-white mb-1">Why 7-day waiting period?</h4>
                  <p className="text-sm text-slate-400">
                    This ensures serious commitment and helps prevent fraud by verifying genuine users.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">How long does verification take?</h4>
                  <p className="text-sm text-slate-400">
                    Manual review takes 24-48 hours after you complete all 3 steps.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Is my information safe?</h4>
                  <p className="text-sm text-slate-400">
                    Yes, all data is encrypted and stored securely. We never share your information.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">What if I need help?</h4>
                  <p className="text-sm text-slate-400">
                    Contact support at support@easydollars.com for assistance.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}