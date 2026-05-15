"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Global app error:", error)
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-[#070b13] text-white">
        <main className="flex min-h-screen items-center justify-center px-4">
          <section className="w-full max-w-md rounded-2xl border border-cyan-400/20 bg-slate-950/80 p-6 text-center shadow-2xl">
            <h1 className="text-2xl font-bold text-cyan-200">CashRise could not load</h1>
            <p className="mt-3 text-sm text-slate-300">
              Please refresh the page. If this keeps happening, open the app again from the dashboard link.
            </p>
            {error.digest && (
              <p className="mt-3 text-xs text-slate-500">Error ID: {error.digest}</p>
            )}
            <div className="mt-6 grid gap-3">
              <button
                onClick={reset}
                className="rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950"
              >
                Try again
              </button>
              <a
                href="/dashboard"
                className="rounded-xl border border-cyan-400/40 px-4 py-3 text-sm font-semibold text-cyan-100"
              >
                Go to dashboard
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  )
}
