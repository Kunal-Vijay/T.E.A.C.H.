import { Check } from 'lucide-react'
import { memo } from 'react'
import { cn } from '../../lib/cn'
import type { AppRole } from '../../services/auth/authService'
import Icon from '../ui/Icon'
import type { RoleDefinition } from './roleSelectionConfig'

interface RoleSelectionCardProps {
  role: RoleDefinition
  selected: boolean
  pending: boolean
  disabled: boolean
  onSelect: (role: AppRole) => void
  tabIndex: number
}

function RoleSelectionCard({
  role,
  selected,
  pending,
  disabled,
  onSelect,
  tabIndex,
}: RoleSelectionCardProps) {
  return (
    <button
      type="button"
      className={cn(
        'role-card',
        `role-card--${role.id}`,
        selected && 'is-selected',
        pending && 'is-pending',
        disabled && 'is-disabled',
      )}
      onClick={() => onSelect(role.id)}
      disabled={disabled}
      role="radio"
      aria-checked={selected}
      tabIndex={tabIndex}
      aria-label={`${role.headline}. ${role.subtitle}`}
    >
      <div className="role-card-top">
        <span className="role-card-icon-wrap" aria-hidden="true">
          <Icon icon={role.icon} size={24} strokeWidth={1.65} />
        </span>

        <div className="role-card-copy">
          <h3 className="role-card-title">{role.headline}</h3>
          <p className="role-card-subtitle">{role.subtitle}</p>
        </div>

        {selected ? (
          <span className="role-card-check" aria-hidden="true">
            <Icon icon={Check} size={14} strokeWidth={2.5} />
          </span>
        ) : null}
      </div>

      <ul className="role-card-chips" aria-label={`${role.headline} capabilities`}>
        {role.capabilities.map((capability) => (
          <li key={capability.label}>{capability.label}</li>
        ))}
      </ul>
    </button>
  )
}

export default memo(RoleSelectionCard)
