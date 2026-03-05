import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/hooks/use-auth"
import { LanguageProvider } from "@/components/language-provider"

export const metadata: Metadata = {
  title: "CashRise - Invest, Play, Earn",
  description: "Invest in AI gaming machines, watch ads, and grow your earnings with CashRise.",
  generator: "v0.dev",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased cr-theme" suppressHydrationWarning>
        <LanguageProvider>
          <AuthProvider>{children}</AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  )
}
