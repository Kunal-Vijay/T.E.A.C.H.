import { Check } from 'lucide-react'
import { memo } from 'react'
import type { EnvironmentDefinition } from '../../environment/types'
import { cn } from '../../lib/cn'
import Icon from '../ui/Icon'

interface EnvironmentCardProps {
  environment: EnvironmentDefinition
  selected: boolean
  onSelect: (id: EnvironmentDefinition['id']) => void
}

function EnvironmentCard({ environment, selected, onSelect }: EnvironmentCardProps) {
  return (
    <button
      type="button"
      className={cn('environment-card', selected && 'is-selected')}
      onClick={() => onSelect(environment.id)}
      aria-pressed={selected}
      aria-label={`${environment.name} environment${selected ? ', selected' : ''}`}
    >
      <div
        className="environment-card-preview"
        data-environment-preview={environment.id}
        aria-hidden="true"
      >
        <div className="environment-card-preview-mesh environment-card-preview-mesh-a" />
        <div className="environment-card-preview-mesh environment-card-preview-mesh-b" />
        <div className="environment-card-preview-scene" />
        <div className="environment-card-preview-texture" />
        <div className="environment-card-preview-lighting" />
      </div>

      <div className="environment-card-copy">
        <span className="environment-card-emoji" aria-hidden="true">{environment.emoji}</span>
        <span className="environment-card-name">{environment.name}</span>
        <span className="environment-card-description">{environment.description}</span>
      </div>

      {selected ? (
        <span className="environment-card-check" aria-hidden="true">
          <Icon icon={Check} size={14} />
        </span>
      ) : null}
    </button>
  )
}

export default memo(EnvironmentCard)
