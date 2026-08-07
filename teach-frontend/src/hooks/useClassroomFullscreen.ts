import { useCallback, useEffect, useState, type RefObject } from 'react'

export type ClassroomFullscreenMode = 'normal' | 'native' | 'pseudo'

export function useClassroomFullscreen(targetRef: RefObject<HTMLElement | null>) {
  const [mode, setMode] = useState<ClassroomFullscreenMode>('normal')

  useEffect(() => {
    const syncNativeState = () => {
      const target = targetRef.current
      if (target != null && document.fullscreenElement === target) {
        setMode('native')
        return
      }
      setMode((current) => (current === 'native' ? 'normal' : current))
    }

    document.addEventListener('fullscreenchange', syncNativeState)
    return () => document.removeEventListener('fullscreenchange', syncNativeState)
  }, [targetRef])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && mode === 'pseudo') {
        setMode('normal')
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mode])

  useEffect(() => {
    document.documentElement.classList.toggle('live-classroom-fullscreen', mode !== 'normal')
    const target = targetRef.current
    if (target != null) {
      target.classList.toggle('is-pseudo-fullscreen', mode === 'pseudo')
    }
    return () => {
      document.documentElement.classList.remove('live-classroom-fullscreen')
      if (target != null) {
        target.classList.remove('is-pseudo-fullscreen')
      }
    }
  }, [mode, targetRef])

  const enterFullscreen = useCallback(async () => {
    const target = targetRef.current
    if (target == null) {
      return
    }

    if (typeof target.requestFullscreen === 'function') {
      try {
        await target.requestFullscreen()
        setMode('native')
        return
      } catch {
        /* pseudo fallback */
      }
    }

    setMode('pseudo')
  }, [targetRef])

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement != null && typeof document.exitFullscreen === 'function') {
      try {
        await document.exitFullscreen()
      } catch {
        /* ignore */
      }
    }
    setMode('normal')
  }, [])

  const toggleFullscreen = useCallback(async () => {
    if (mode === 'normal') {
      await enterFullscreen()
      return
    }
    await exitFullscreen()
  }, [enterFullscreen, exitFullscreen, mode])

  return {
    mode,
    isFullscreen: mode !== 'normal',
    isPseudoFullscreen: mode === 'pseudo',
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  }
}
