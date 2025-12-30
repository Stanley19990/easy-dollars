// components/verification-progress.tsx
"use client"

import { CheckCircle, Circle } from "lucide-react"
import { cn } from "@/lib/utils"

interface VerificationProgressProps {
  currentStep: number
}

export function VerificationProgress({ currentStep }: VerificationProgressProps) {
  const steps = [
    { number: 1, label: "Personal Info" },
    { number: 2, label: "Support Check" },
    { number: 3, label: "ID Upload" }
  ]

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => (
          <div key={step.number} className="flex flex-col items-center relative flex-1">
            {/* Connection Line */}
            {index > 0 && (
              <div className={cn(
                "absolute h-0.5 w-full -left-1/2 top-5 -z-10",
                currentStep >= step.number ? "bg-cyan-500" : "bg-slate-700"
              )} />
            )}
            
            {/* Step Circle */}
            <div className={cn(
              "h-10 w-10 rounded-full border-2 flex items-center justify-center mb-2",
              currentStep > step.number && "bg-green-500/20 border-green-500",
              currentStep === step.number && "bg-cyan-500/20 border-cyan-500",
              currentStep < step.number && "bg-slate-800 border-slate-700"
            )}>
              {currentStep > step.number ? (
                <CheckCircle className="h-5 w-5 text-green-400" />
              ) : currentStep === step.number ? (
                <div className="h-5 w-5 rounded-full bg-cyan-500" />
              ) : (
                <Circle className="h-5 w-5 text-slate-500" />
              )}
            </div>
            
            {/* Step Label */}
            <span className={cn(
              "text-xs font-medium",
              currentStep >= step.number ? "text-white" : "text-slate-500"
            )}>
              Step {step.number}
            </span>
            <span className={cn(
              "text-xs",
              currentStep >= step.number ? "text-slate-300" : "text-slate-600"
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}