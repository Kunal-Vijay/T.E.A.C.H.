/** Speech orchestration types — synced playback segments. */

export type PlaybackSegmentKind = 'intro' | 'lesson'

/** One narration unit: the same text is spoken and shown as the subtitle. */
export interface PlaybackSegment {
  id: number
  text: string
  kind: PlaybackSegmentKind
  /** Index into lesson subtitle cues (excludes intro). */
  cueIndex?: number
  /** Pause after this segment before the next (ms). */
  pauseAfterMs?: number
}

export interface LessonPlaybackPlan {
  segments: PlaybackSegment[]
  /** Subtitle cues from explanation_text (excludes intro). */
  lessonCueCount: number
}

/** @deprecated Use PlaybackSegment — kept for transitional imports. */
export interface SpeechSegment {
  id: number
  text: string
  pauseAfterMs?: number
}

/** @deprecated Timer-based subtitles removed — use playback events. */
export interface SubtitleSegment {
  id: number
  text: string
  startMs: number
}
