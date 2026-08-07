import { memo, useCallback, useRef, type KeyboardEvent } from 'react'
import type { AppRole } from '../../services/auth/authService'
import RoleSelectionCard from './RoleSelectionCard'
import { ROLE_DEFINITIONS, ROLE_IDS } from './roleSelectionConfig'

const COMMIT_DELAY_MS = 300

interface RoleSelectionPickerProps {
  selectedRole: AppRole | null
  pendingRole: AppRole | null
  onChooseRole: (role: AppRole) => void
}

function RoleSelectionPicker({
  selectedRole,
  pendingRole,
  onChooseRole,
}: RoleSelectionPickerProps) {
  const groupRef = useRef<HTMLDivElement>(null)

  const focusRole = useCallback((index: number) => {
    const buttons = groupRef.current?.querySelectorAll<HTMLButtonElement>('[role="radio"]')
    buttons?.[index]?.focus()
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (pendingRole) {
      return
    }

    const currentIndex = selectedRole ? ROLE_IDS.indexOf(selectedRole) : 0
    const safeIndex = currentIndex === -1 ? 0 : currentIndex
    let nextIndex: number | null = null

    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      nextIndex = (safeIndex + 1) % ROLE_IDS.length
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      nextIndex = (safeIndex - 1 + ROLE_IDS.length) % ROLE_IDS.length
    } else if (event.key === 'Home') {
      nextIndex = 0
    } else if (event.key === 'End') {
      nextIndex = ROLE_IDS.length - 1
    }

    if (nextIndex != null) {
      event.preventDefault()
      focusRole(nextIndex)
    }
  }, [selectedRole, pendingRole, focusRole])

  return (
    <section
      className="welcome-role"
      aria-labelledby="welcome-role-heading"
    >
      <header className="welcome-role-header">
        <h2 id="welcome-role-heading" className="welcome-role-title">
          Choose your role
        </h2>
        <p className="welcome-role-lede">Select how you&apos;ll experience T.E.A.C.H</p>
      </header>

      <div
        ref={groupRef}
        className="welcome-role-picker"
        role="radiogroup"
        aria-labelledby="welcome-role-heading"
        onKeyDown={handleKeyDown}
      >
        <div className="welcome-role-track">
          {ROLE_DEFINITIONS.map((role) => {
            const selected = selectedRole === role.id
            const pending = pendingRole === role.id
            const disabled = pendingRole != null && !pending
            return (
              <RoleSelectionCard
                key={role.id}
                role={role}
                selected={selected}
                pending={pending}
                disabled={disabled}
                onSelect={onChooseRole}
                tabIndex={selected || (selectedRole == null && role.id === 'student') ? 0 : -1}
              />
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default memo(RoleSelectionPicker)

export { COMMIT_DELAY_MS }
