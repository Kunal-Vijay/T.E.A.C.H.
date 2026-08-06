import { useEffect, useState } from 'react'

/** True when the document tab is visible and focused for animation. */
export function usePageVisibility(): boolean {
  const [visible, setVisible] = useState(() =>
    typeof document === 'undefined' ? true : document.visibilityState === 'visible',
  )

  useEffect(() => {
    const handleVisibility = () => {
      setVisible(document.visibilityState === 'visible')
    }

    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  return visible
}
