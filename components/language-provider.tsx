"use client"

import React, { createContext, useContext, useEffect, useMemo, useState } from "react"
import type { Language, LanguagePreference } from "@/lib/i18n"
import { translations } from "@/lib/i18n"
import { safeStorageGet, safeStorageSet } from "@/lib/safe-data"

type I18nContextValue = {
  language: Language
  preference: LanguagePreference
  setLanguage: (lang: LanguagePreference) => void
  t: (key: keyof typeof translations.en) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")
  const [preference, setPreference] = useState<LanguagePreference>("system")

  const detectLanguage = (): Language => {
    if (typeof navigator === "undefined") return "en"
    const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
    const detected = languages.find((lang) => lang?.toLowerCase().startsWith("fr"))
    return detected ? "fr" : "en"
  }

  const applyLanguage = (lang: Language) => {
    setLanguageState(lang)
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang
    }
  }

  useEffect(() => {
    const stored = typeof window !== "undefined" ? safeStorageGet(window.localStorage, "cashrise_lang") : null
    if (stored === "en" || stored === "fr" || stored === "system") {
      setPreference(stored)
      applyLanguage(stored === "system" ? detectLanguage() : stored)
      return
    }

    setPreference("system")
    applyLanguage(detectLanguage())
  }, [])

  useEffect(() => {
    if (preference !== "system" || typeof window === "undefined") return

    const handleLanguageChange = () => applyLanguage(detectLanguage())
    window.addEventListener("languagechange", handleLanguageChange)
    return () => window.removeEventListener("languagechange", handleLanguageChange)
  }, [preference])

  const setLanguage = (lang: LanguagePreference) => {
    setPreference(lang)
    applyLanguage(lang === "system" ? detectLanguage() : lang)
    if (typeof window !== "undefined") {
      safeStorageSet(window.localStorage, "cashrise_lang", lang)
    }
  }

  const value = useMemo<I18nContextValue>(() => {
    return {
      language,
      preference,
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
