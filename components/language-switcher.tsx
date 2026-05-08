"use client"

import { Globe } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, preference, setLanguage, t } = useLanguage()

  return (
    <Select value={preference} onValueChange={(value) => setLanguage(value as any)}>
      <SelectTrigger
        className={`cr-outline-button border-cyan-500/40 bg-slate-950/40 text-slate-100 ${compact ? "h-8 w-[104px]" : "w-[140px]"}`}
        aria-label={t("selectLanguage")}
      >
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <SelectValue placeholder={language === "fr" ? t("french") : t("english")} />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
        <SelectItem value="system">{t("systemLanguage")}</SelectItem>
        <SelectItem value="en">{t("english")}</SelectItem>
        <SelectItem value="fr">{t("french")}</SelectItem>
      </SelectContent>
    </Select>
  )
}
