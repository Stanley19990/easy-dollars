// lib/performance.ts
export const withPerformanceLog = async <T>(
  name: string, 
  promise: Promise<T>
): Promise<T> => {
  const start = performance.now()
  try {
    const result = await promise
    const end = performance.now()
    console.log(`⏱️ ${name}: ${(end - start).toFixed(2)}ms`)
    return result
  } catch (error) {
    const end = performance.now()
    console.error(`⏱️ ${name} ERROR: ${(end - start).toFixed(2)}ms`, error)
    throw error
  }
}