const dsn = import.meta.env.VITE_SENTRY_DSN ?? ''

if (typeof window !== 'undefined') {
  window.addEventListener('teach:error-displayed', (event) => {
    const detail = (event as CustomEvent<Record<string, unknown>>).detail
    window.dispatchEvent(
      new CustomEvent('teach:monitoring', {
        detail: { type: 'displayed-error', error: detail, dsn: dsn || undefined },
      }),
    )
  })
}

export function captureException(error: unknown, context?: Record<string, string>): void {
  if (import.meta.env.DEV) {
    console.error('[monitoring]', error, context)
  }
  window.dispatchEvent(
    new CustomEvent('teach:monitoring', {
      detail: { type: 'exception', error, context, dsn: dsn || undefined },
    }),
  )
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info'): void {
  if (import.meta.env.DEV) {
    console[level === 'error' ? 'error' : 'log'](`[monitoring:${level}]`, message)
  }
  window.dispatchEvent(
    new CustomEvent('teach:monitoring', {
      detail: { type: 'message', message, level, dsn: dsn || undefined },
    }),
  )
}
