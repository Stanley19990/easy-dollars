"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState } from "react"

const countries = [
  { code: "CM", name: "Cameroon", currency: "XAF" },
]

export function CountrySelector() {
  const [selectedCountry, setSelectedCountry] = useState<string>("CM")

  return (
    <section className="py-16 px-4 relative z-10">
      <div className="max-w-md mx-auto text-center">
        <h3 className="text-xl font-bold mb-4 text-cyan-200">CashRise is live in Cameroon</h3>
        <Select value={selectedCountry} onValueChange={setSelectedCountry}>
          <SelectTrigger className="cr-glass text-cyan-100 border-cyan-400/30">
            <SelectValue placeholder="Cameroon (XAF)" />
          </SelectTrigger>
          <SelectContent className="bg-slate-900 border-cyan-500/40">
            {countries.map((country) => (
              <SelectItem key={country.code} value={country.code} className="text-cyan-200 hover:bg-cyan-500/10">
                {country.name} ({country.currency})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </section>
  )
}
