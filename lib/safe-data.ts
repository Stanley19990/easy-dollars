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
