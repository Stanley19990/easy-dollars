export const toNumber = (value: unknown, fallback = 0) => {
  const number = Number(value)
  return Number.isFinite(number) ? number : fallback
}

export const formatNumber = (value: unknown, fallback = "0") => {
  const number = Number(value)
  return Number.isFinite(number) ? number.toLocaleString() : fallback
}

export const formatDate = (value: unknown, fallback = "Unknown") => {
  if (!value) return fallback
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString()
}

export const formatDateTime = (value: unknown, fallback = "Unknown") => {
  if (!value) return fallback
  const date = new Date(String(value))
  return Number.isNaN(date.getTime())
    ? fallback
    : date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
}

export const asArray = <T = any>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[]
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

export const firstRelation = <T = any>(value: unknown): T | null => {
  if (Array.isArray(value)) return (value[0] as T) || null
  if (value && typeof value === "object") return value as T
  return null
}

export const safeStorageGet = (storage: Storage | undefined, key: string) => {
  try {
    return storage?.getItem(key) ?? null
  } catch {
    return null
  }
}

export const safeStorageSet = (storage: Storage | undefined, key: string, value: string) => {
  try {
    storage?.setItem(key, value)
  } catch {
    // Storage can be blocked in some mobile/privacy browser modes.
  }
}
