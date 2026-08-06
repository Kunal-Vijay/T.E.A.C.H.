function readFlag(name: string, defaultValue: boolean): boolean {
  const value = import.meta.env[name]
  if (value === undefined || value === '') {
    return defaultValue
  }
  return value === 'true' || value === '1'
}

export const featureFlags = {
  sageStreaming: readFlag('VITE_FLAG_SAGE_STREAMING', false),
  delightGamification: readFlag('VITE_FLAG_DELIGHT_GAMIFICATION', true),
} as const

export function isFeatureEnabled(flag: keyof typeof featureFlags): boolean {
  return featureFlags[flag]
}
