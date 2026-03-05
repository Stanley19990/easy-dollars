"use client"

import { Globe } from "lucide-react"
import { useLanguage } from "@/components/language-provider"
import { Button } from "@/components/ui/button"

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage, t } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        onClick={() => setLanguage(language === "en" ? "fr" : "en")}
        className="cr-outline-button px-3"
        aria-label={t("selectLanguage")}
      >
        <Globe className="h-4 w-4" />
        <span className="ml-2 text-xs sm:text-sm">
          {language === "en" ? t("english") : t("french")}
        </span>
      </Button>
    </div>
  )
}
