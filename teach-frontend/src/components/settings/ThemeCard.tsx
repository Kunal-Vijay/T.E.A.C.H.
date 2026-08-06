import { Check } from 'lucide-react'
import { memo } from 'react'
import type { ThemeDefinition } from '../../theme/types'
import { cn } from '../../lib/cn'
import Icon from '../ui/Icon'

interface ThemeCardProps {
  theme: ThemeDefinition
  selected: boolean
  onSelect: (id: ThemeDefinition['id']) => void
  /** Compact layout for Welcome page preview */
  variant?: 'settings' | 'welcome'
}

function ThemeCard({ theme, selected, onSelect, variant = 'settings' }: ThemeCardProps) {
  const isWelcome = variant === 'welcome'
  const description = isWelcome ? theme.tagline : theme.description

  return (
    <button
      type="button"
      className={cn('theme-card', isWelcome && 'theme-card--welcome', selected && 'is-selected')}
      onClick={() => onSelect(theme.id)}
      role={isWelcome ? 'radio' : undefined}
      aria-checked={isWelcome ? selected : undefined}
      aria-pressed={isWelcome ? undefined : selected}
      aria-label={`${theme.name} theme${selected ? ', selected' : ''}`}
    >
      <span className="theme-card-glow" aria-hidden="true" />

      <div className="theme-card-preview" data-theme-preview={theme.id}>
        <div className="theme-card-preview-chrome">
          <span className="theme-card-preview-dot" />
          <span className="theme-card-preview-dot" />
          <span className="theme-card-preview-dot" />
        </div>
        <div className="theme-card-preview-body">
          <div className="theme-card-preview-sidebar" />
          <div className="theme-card-preview-main">
            <div className="theme-card-preview-line" />
            <div className="theme-card-preview-line theme-card-preview-line--short" />
            <div className="theme-card-preview-accent" />
          </div>
        </div>
      </div>

      <div className="theme-card-copy">
        <span className="theme-card-emoji" aria-hidden="true">{theme.emoji}</span>
        <span className="theme-card-name">{theme.name}</span>
        <span className="theme-card-description">{description}</span>
      </div>

      {selected ? (
        <span className="theme-card-check" aria-hidden="true">
          <Icon icon={Check} size={14} />
        </span>
      ) : null}
    </button>
  )
}

export default memo(ThemeCard)
