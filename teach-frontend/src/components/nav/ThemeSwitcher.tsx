import { Check, Palette } from 'lucide-react'
import { memo, useCallback, useEffect, useId, useRef, useState } from 'react'
import { trackEvent } from '../../lib/analytics'
import { THEME_REGISTRY } from '../../theme/registry'
import type { ThemeId } from '../../theme/types'
import { useTheme } from '../../theme/useTheme'
import Icon from '../ui/Icon'

function ThemeSwitcher() {
  const { themeId, setTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const listboxId = useId()

  const close = useCallback(() => setOpen(false), [])

  const handleSelect = useCallback((id: ThemeId) => {
    setTheme(id)
    const theme = THEME_REGISTRY.find((entry) => entry.id === id)
    trackEvent('theme_selected', {
      theme: id,
      source: 'nav',
      experience: theme?.experience.title,
    })
    close()
  }, [setTheme, close])

  useEffect(() => {
    if (!open) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close()
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close()
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [open, close])

  return (
    <div className="theme-switcher" ref={rootRef}>
      <button
        type="button"
        className="theme-switcher-trigger"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon icon={Palette} size={16} strokeWidth={1.75} />
        <span>Theme</span>
      </button>

      {open ? (
        <div className="theme-switcher-popover" role="presentation">
          <p className="theme-switcher-heading">Workspace Theme</p>
          <ul id={listboxId} className="theme-switcher-list" role="listbox" aria-label="Workspace theme">
            {THEME_REGISTRY.map((theme) => {
              const selected = themeId === theme.id
              return (
                <li key={theme.id} role="presentation">
                  <button
                    type="button"
                    role="option"
                    aria-selected={selected}
                    className={`theme-switcher-option${selected ? ' is-selected' : ''}`}
                    onClick={() => handleSelect(theme.id)}
                  >
                    <span className="theme-switcher-option-label">
                      {selected ? (
                        <Icon icon={Check} size={14} strokeWidth={2.5} className="theme-switcher-check" />
                      ) : (
                        <span className="theme-switcher-check-placeholder" aria-hidden="true" />
                      )}
                      {theme.experience.title}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ) : null}
    </div>
  )
}

export default memo(ThemeSwitcher)
