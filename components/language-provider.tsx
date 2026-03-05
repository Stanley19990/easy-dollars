"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Language } from "@/lib/i18n"
import { translations } from "@/lib/i18n"

type I18nContextValue = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: keyof typeof translations.en) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("cashrise_lang") : null
    if (stored === "en" || stored === "fr") {
      setLanguageState(stored)
      document.documentElement.lang = stored
      return
    }
    const browserLang = typeof navigator !== "undefined" ? navigator.language.toLowerCase() : "en"
    const detected = browserLang.startsWith("fr") ? "fr" : "en"
    setLanguageState(detected)
    document.documentElement.lang = detected
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof window !== "undefined") {
      localStorage.setItem("cashrise_lang", lang)
    }
    document.documentElement.lang = lang
  }

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      setLanguage,
      t: (key) => translations[language]?.[key] ?? translations.en[key] ?? String(key)
    }
  }, [language])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider")
  }
  return ctx
}
