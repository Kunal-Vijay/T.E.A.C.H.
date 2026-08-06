type AnalyticsEvent =
  | 'page_view'
  | 'role_selected'
  | 'mentor_selected'
  | 'class_joined'
  | 'classroom_session_created'
  | 'lesson_advanced'
  | 'quiz_answered'
  | 'sage_opened'
  | 'course_completed'
  | 'error'

interface AnalyticsPayload {
  [key: string]: string | number | boolean | null | undefined
}

const enabled = import.meta.env.VITE_ANALYTICS_ENABLED === 'true'

export function trackEvent(event: AnalyticsEvent, payload: AnalyticsPayload = {}): void {
  if (!enabled) {
    if (import.meta.env.DEV) {
      console.debug('[analytics]', event, payload)
    }
    return
  }
  window.dispatchEvent(new CustomEvent('teach:analytics', { detail: { event, payload } }))
}

export function trackPageView(path: string): void {
  trackEvent('page_view', { path })
}

export function trackError(message: string, context?: string): void {
  trackEvent('error', { message, context })
}
