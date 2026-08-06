import { useOnlineStatus } from '../hooks/useOnlineStatus'

export default function OfflineBanner() {
  const online = useOnlineStatus()
  if (online) {
    return null
  }
  return (
    <div className="offline-banner" role="status" aria-live="polite">
      You&apos;re offline. Some actions will resume when your connection returns.
    </div>
  )
}
