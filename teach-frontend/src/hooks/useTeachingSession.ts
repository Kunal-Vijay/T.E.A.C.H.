import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  buildTeachingBeats,
  findBeatForCue,
  findBeatIndex,
  type TeachingBeat,
} from '../lib/classroom/teachingBeats'

export function useTeachingSession(
  explanationText: string,
  slideElements: Array<Record<string, unknown>>,
) {
  const { beats, cues } = useMemo(
    () => buildTeachingBeats(explanationText, slideElements),
    [explanationText, slideElements],
  )

  const [activeCueIndex, setActiveCueIndex] = useState(0)
  const [activeBeatIndex, setActiveBeatIndex] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [completedConcepts, setCompletedConcepts] = useState<number[]>([])

  const resetSession = useCallback(() => {
    setActiveCueIndex(0)
    setActiveBeatIndex(0)
    setHasStarted(false)
    setIsPlaying(false)
    setCompletedConcepts([])
  }, [])

  useEffect(() => {
    resetSession()
  }, [explanationText, slideElements, resetSession])

  const applyCueIndex = useCallback((index: number) => {
    setActiveCueIndex(index)
    setHasStarted(true)
    const beatIndex = findBeatIndex(beats, index)
    setActiveBeatIndex(beatIndex)

    const beat = findBeatForCue(beats, index)
    if (beat?.phase === 'recap' && beat.recapItems !== undefined) {
      setCompletedConcepts(beat.recapItems.map((_, conceptIndex) => conceptIndex))
      return
    }

    if (beat?.conceptIndex !== undefined) {
      const conceptIndex = beat.conceptIndex
      setCompletedConcepts((previous) => {
        if (beat.phase === 'explain' || beat.phase === 'visual') {
          const next = new Set(previous)
          if (conceptIndex > 0) {
            for (let i = 0; i < conceptIndex; i += 1) {
              next.add(i)
            }
          }
          return Array.from(next).sort((a, b) => a - b)
        }
        return previous
      })
    }
  }, [beats])

  const onCueStart = useCallback((index: number) => {
    setIsPlaying(true)
    applyCueIndex(index)
  }, [applyCueIndex])

  const onPlaybackEnd = useCallback(() => {
    setIsPlaying(false)
    if (cues.length > 0) {
      applyCueIndex(cues.length - 1)
    }
  }, [applyCueIndex, cues.length])

  const advanceCueManually = useCallback(() => {
    const next = Math.min(activeCueIndex + 1, Math.max(0, cues.length - 1))
    applyCueIndex(next)
  }, [activeCueIndex, applyCueIndex, cues.length])

  const activeBeat: TeachingBeat | null = beats[activeBeatIndex] ?? null
  const currentCue = cues[activeCueIndex] ?? ''
  const previousCue = activeCueIndex > 0 ? cues[activeCueIndex - 1] ?? '' : ''
  const playbackComplete = cues.length > 0 && activeCueIndex >= cues.length - 1 && !isPlaying
  const sessionProgress = cues.length > 0 ? Math.round(((activeCueIndex + 1) / cues.length) * 100) : 0

  return {
    beats,
    cues,
    activeBeat,
    activeBeatIndex,
    activeCueIndex,
    currentCue,
    previousCue,
    completedConcepts,
    hasStarted,
    isPlaying,
    playbackComplete,
    sessionProgress,
    onCueStart,
    onPlaybackEnd,
    advanceCueManually,
    resetSession,
    setIsPlaying,
  }
}
