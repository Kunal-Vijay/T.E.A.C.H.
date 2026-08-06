import type { PlaybackSegment } from './types'

export interface SubtitleSyncHandlers {
  onCueStart: (index: number, segment: PlaybackSegment) => void
  onCueEnd?: (index: number, segment: PlaybackSegment) => void
  onReset?: () => void
}

/**
 * Event-driven subtitle state — advances only on speech playback events.
 * No timers.
 */
export class SubtitleController {
  private generation = 0
  private currentIndex = -1
  private handlers: SubtitleSyncHandlers | null = null

  bind(handlers: SubtitleSyncHandlers): void {
    this.handlers = handlers
  }

  onSpeechStart(index: number, segment: PlaybackSegment): void {
    this.currentIndex = index
    this.handlers?.onCueStart(index, segment)
  }

  onSpeechEnd(index: number, segment: PlaybackSegment): void {
    this.handlers?.onCueEnd?.(index, segment)
  }

  reset(): void {
    this.currentIndex = -1
    this.handlers?.onReset?.()
  }

  stop(): void {
    this.generation += 1
    this.currentIndex = -1
    this.handlers = null
  }

  getCurrentIndex(): number {
    return this.currentIndex
  }
}

export const subtitleController = new SubtitleController()
