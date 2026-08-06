export function isSafeAssetUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin)
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      if (import.meta.env.PROD && parsed.protocol === 'http:') {
        return false
      }
      return true
    }
    return parsed.protocol === 'blob:' || parsed.origin === window.location.origin
  } catch {
    return false
  }
}
