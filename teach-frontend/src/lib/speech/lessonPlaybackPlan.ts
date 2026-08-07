import { getLessonIntro, shouldPlayLessonIntro } from '../mentors/dialogue'
import { getPauseAfterMs } from './speechPause'
import { buildSubtitleCues } from './subtitleChunker'
import type { LessonPlaybackPlan, PlaybackSegment } from './types'
import type { MentorDefinition } from '../../types/mentor.types'

/** Builds synchronized speech + subtitle segments from explanation_text. */
export function buildLessonPlaybackPlan(
  mentor: MentorDefinition,
  lessonText: string,
): LessonPlaybackPlan {
  const pauseOptions = {
    rate: mentor.voice.rate,
    pacingMs: mentor.voice.pauseBetweenMs,
  }

  const segments: PlaybackSegment[] = []

  if (shouldPlayLessonIntro(mentor)) {
    const intro = getLessonIntro(mentor).trim()
    if (intro !== '') {
      segments.push({
        id: segments.length,
        text: intro,
        kind: 'intro',
        pauseAfterMs: getPauseAfterMs(intro, pauseOptions),
      })
    }
  }

  const cues = buildSubtitleCues(lessonText)
  cues.forEach((text, cueIndex) => {
    segments.push({
      id: segments.length,
      text,
      kind: 'lesson',
      cueIndex,
      pauseAfterMs: cueIndex < cues.length - 1
        ? getPauseAfterMs(text, pauseOptions)
        : undefined,
    })
  })

  return {
    segments,
    lessonCueCount: cues.length,
  }
}
