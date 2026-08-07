import {
  speechController,
  type SpeechQueueItem,
  type SpeakOptions,
} from '../../components/avatar/SpeechController'
import { subtitleController } from './SubtitleController'
import { buildLessonPlaybackPlan } from './lessonPlaybackPlan'
import type { PlaybackSegment } from './types'
import type { MentorDefinition } from '../../types/mentor.types'

export type PlaybackStatus = 'idle' | 'playing' | 'paused' | 'completed'

export interface SegmentPlaybackEvent {
  index: number
  segment: PlaybackSegment
  text: string
  cueIndex: number | null
}

export interface LessonPlaybackCallbacks {
  /** Fired when audio for a segment is about to start — subtitle updates here. */
  onSegmentStart?: (event: SegmentPlaybackEvent) => void
  /** Fired when audio for a segment finishes. */
  onSegmentEnd?: (event: SegmentPlaybackEvent) => void
  /** Lesson cue index for session progress (null during intro). */
  onCueStart?: (cueIndex: number, text: string) => void
  onEnd?: () => void
  onCancel?: () => void
  onStatusChange?: (status: PlaybackStatus) => void
}

/**
 * Single source of truth for lesson narration + subtitle sync.
 * Subtitles advance on speech start events — never on timers.
 */
export class SpeechPlaybackController {
  private activeGeneration = 0
  private status: PlaybackStatus = 'idle'
  private segments: PlaybackSegment[] = []

  getStatus(): PlaybackStatus {
    return this.status
  }

  getSegments(): PlaybackSegment[] {
    return this.segments
  }

  async playLesson(
    mentor: MentorDefinition,
    lessonText: string,
    callbacks?: LessonPlaybackCallbacks,
  ): Promise<boolean> {
    this.stop()

    const plan = buildLessonPlaybackPlan(mentor, lessonText)
    this.segments = plan.segments

    if (plan.segments.length === 0) {
      return false
    }

    const generation = this.activeGeneration + 1
    this.activeGeneration = generation

    this.setStatus('playing', callbacks)

    subtitleController.bind({
      onCueStart: (index, segment) => {
        if (generation !== this.activeGeneration) {
          return
        }
        callbacks?.onSegmentStart?.(this.toEvent(index, segment))
      },
    })

    const speechQueue: SpeechQueueItem[] = plan.segments.map((segment) => ({
      text: segment.text,
      pauseAfterMs: segment.pauseAfterMs,
    }))

    speechController.prefetchAll(speechQueue.map((item) => item.text), mentor.voice)

    const speakOptions: SpeakOptions = {
      voice: mentor.voice,
      prefetchAhead: 4,
      onSentenceStart: (index) => {
        if (generation !== this.activeGeneration) {
          return
        }
        const segment = plan.segments[index]
        if (segment !== undefined) {
          subtitleController.onSpeechStart(index, segment)
        }
      },
      onSentenceEnd: (index) => {
        if (generation !== this.activeGeneration) {
          return
        }
        const segment = plan.segments[index]
        if (segment !== undefined) {
          subtitleController.onSpeechEnd(index, segment)
          callbacks?.onSegmentEnd?.(this.toEvent(index, segment))
        }
      },
      onEnd: () => {
        if (generation !== this.activeGeneration) {
          return
        }
        this.setStatus('completed', callbacks)
        subtitleController.stop()
        callbacks?.onEnd?.()
      },
      onError: () => {
        if (generation !== this.activeGeneration) {
          return
        }
        this.setStatus('idle', callbacks)
        subtitleController.stop()
      },
    }

    const started = await speechController.speakSequence(speechQueue, speakOptions)

    if (generation === this.activeGeneration && !started) {
      this.setStatus('idle', callbacks)
      subtitleController.stop()
    }

    return started
  }

  pause(): void {
    if (this.status !== 'playing') {
      return
    }
    speechController.pause()
    this.status = 'paused'
  }

  resume(): void {
    if (this.status !== 'paused') {
      return
    }
    speechController.resume()
    this.status = 'playing'
  }

  stop(): void {
    this.activeGeneration += 1
    speechController.stop()
    subtitleController.stop()
    this.segments = []
    this.status = 'idle'
  }

  private toEvent(index: number, segment: PlaybackSegment): SegmentPlaybackEvent {
    return {
      index,
      segment,
      text: segment.text,
      cueIndex: segment.kind === 'lesson' && segment.cueIndex !== undefined
        ? segment.cueIndex
        : null,
    }
  }

  private setStatus(status: PlaybackStatus, callbacks?: LessonPlaybackCallbacks): void {
    this.status = status
    callbacks?.onStatusChange?.(status)
  }
}

export const playbackController = new SpeechPlaybackController()

/** @deprecated Use SpeechPlaybackController — alias for existing imports. */
export { SpeechPlaybackController as PlaybackController }
