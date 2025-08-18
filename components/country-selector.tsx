"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

const countries = [
  { code: "CM", name: "Cameroon", currency: "XAF" },
  { code: "NG", name: "Nigeria", currency: "NGN" },
  { code: "GH", name: "Ghana", currency: "GHS" },
]

export function CountrySelector() {
  const [selectedCountry, setSelectedCountry] = useState<string>("")

  return (
    <section className="py-16 px-4 relative z-10">
      <div className="max-w-md mx-auto text-center">
        <h3 className="text-xl font-bold mb-4 text-cyan-300">Select Your Country</h3>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="neon-border bg-slate-800/50 text-cyan-300">
            <SelectValue placeholder="Choose your country" />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-cyan-500">
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code} className="text-cyan-300 hover:bg-cyan-500/10">
                {country.name} ({country.currency})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}
