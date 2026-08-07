import { memo, useMemo } from 'react'
import { cn } from '../../lib/cn'
import {
  NOVA_TUTOR_IDLE_SRC,
  NOVA_TUTOR_INTRINSIC_HEIGHT,
  NOVA_TUTOR_INTRINSIC_WIDTH,
  NOVA_TUTOR_SPEAKING_SRC,
} from '../../lib/tutor/novaTutorAssets'
import { getTutorAriaLabel } from '../../lib/tutor'
import { useNovaSpeakingVisual } from '../../lib/tutor/useNovaSpeakingVisual'
import { useNovaTutorSpeakingReady } from '../../lib/tutor/useNovaTutorSpeakingReady'

export type NovaTutorSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero'

/** Sizes that appear above the fold — idle PNG stays eager. */
const EAGER_IDLE_SIZES = new Set<NovaTutorSize>(['xs', 'hero', 'xl'])

export interface NovaTutorProps {
  /** Live narration flag from app state (e.g. speechStatus === 'speaking'). */
  speaking?: boolean
  /** Pre-resolved visual speaking state — skips internal idle delay when provided. */
  speakingVisual?: boolean
  /** Lesson prep — idle PNG only, no speaking GIF. */
  preparing?: boolean
  size?: NovaTutorSize
  className?: string
  /** Override default aria label. Pass empty string for decorative use. */
  label?: string
}

function NovaTutorInner({
  speaking = false,
  speakingVisual,
  preparing = false,
  size = 'md',
  className,
  label,
}: NovaTutorProps) {
  const speakingGifReady = useNovaTutorSpeakingReady()
  const debouncedSpeaking = useNovaSpeakingVisual(speaking)
  const showSpeaking = !preparing && (speakingVisual ?? debouncedSpeaking) && speakingGifReady
  const speakingSrc = speakingGifReady ? NOVA_TUTOR_SPEAKING_SRC : undefined
  const idleLoading = EAGER_IDLE_SIZES.has(size) ? 'eager' : 'lazy'

  const ariaLabel = useMemo(() => {
    if (label !== undefined) {
      return label
    }
    return showSpeaking ? getTutorAriaLabel('explaining') : getTutorAriaLabel()
  }, [label, showSpeaking])

  const isDecorative = ariaLabel === ''

  return (
    <div
      className={cn('nova-tutor', `nova-tutor--${size}`, className)}
      role={isDecorative ? 'presentation' : 'img'}
      aria-label={isDecorative ? undefined : ariaLabel}
      aria-hidden={isDecorative ? true : undefined}
      data-nova-speaking={showSpeaking ? 'true' : 'false'}
      data-nova-narrating={speaking ? 'true' : 'false'}
      data-nova-preparing={preparing ? 'true' : 'false'}
    >
      <div className="nova-tutor__ambient" aria-hidden="true" />
      <div className="nova-tutor__shadow" aria-hidden="true" />
      <div className="nova-tutor__figure">
        <div className="nova-tutor__canvas">
          <img
            src={NOVA_TUTOR_IDLE_SRC}
            alt=""
            aria-hidden="true"
            className={cn(
              'nova-tutor__layer',
              showSpeaking ? 'nova-tutor__layer--hidden' : 'nova-tutor__layer--visible',
            )}
            width={NOVA_TUTOR_INTRINSIC_WIDTH}
            height={NOVA_TUTOR_INTRINSIC_HEIGHT}
            loading={idleLoading}
            decoding="async"
            fetchPriority={size === 'hero' ? 'high' : undefined}
            draggable={false}
          />
          {speakingSrc ? (
            <img
              src={speakingSrc}
              alt=""
              aria-hidden="true"
              className={cn(
                'nova-tutor__layer',
                showSpeaking ? 'nova-tutor__layer--visible' : 'nova-tutor__layer--hidden',
              )}
              width={NOVA_TUTOR_INTRINSIC_WIDTH}
              height={NOVA_TUTOR_INTRINSIC_HEIGHT}
              decoding="async"
              draggable={false}
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}

/** Nova AI tutor — static PNG idle, animated GIF speaking. */
const NovaTutor = memo(NovaTutorInner)
export default NovaTutor
