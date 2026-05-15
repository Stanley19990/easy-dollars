"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function AppError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("App route error:", error)
  }, [error])

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#070b13] px-4 text-white">
      <section className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-6 text-center shadow-2xl">
        <h1 className="text-2xl font-bold text-cyan-200">Something went wrong</h1>
        <p className="mt-3 text-sm text-slate-300">
          This section could not load correctly. Please try again.
        </p>
        {error.digest && (
          <p className="mt-3 text-xs text-slate-500">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 grid gap-3">
          <Button onClick={reset} className="w-full cr-button text-slate-950">
            Try again
          </Button>
          <a
            href="/dashboard"
            className="rounded-xl border border-cyan-400/40 px-4 py-3 text-sm font-semibold text-cyan-100"
          >
            Go to dashboard
          </a>
        </div>
      </section>
    </main>
  )
}
