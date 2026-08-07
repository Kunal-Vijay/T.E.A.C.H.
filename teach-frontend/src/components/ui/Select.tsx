import { Check, ChevronDown } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  id?: string
  disabled?: boolean
  className?: string
  'aria-label'?: string
}

interface MenuPosition {
  top: number
  left: number
  width: number
  maxHeight: number
  placement: 'bottom' | 'top'
}

const MENU_GAP = 6
const VIEWPORT_PADDING = 8
const MENU_MAX_HEIGHT = 240

function computeMenuPosition(trigger: HTMLElement): MenuPosition {
  const rect = trigger.getBoundingClientRect()
  const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PADDING
  const spaceAbove = rect.top - VIEWPORT_PADDING
  const placement = spaceBelow < 160 && spaceAbove > spaceBelow ? 'top' : 'bottom'
  const maxHeight = Math.min(
    MENU_MAX_HEIGHT,
    placement === 'bottom' ? spaceBelow - MENU_GAP : spaceAbove - MENU_GAP,
  )

  return {
    top: placement === 'bottom' ? rect.bottom + MENU_GAP : rect.top - MENU_GAP,
    left: rect.left,
    width: rect.width,
    maxHeight: Math.max(maxHeight, 120),
    placement,
  }
}

export default function Select({
  value,
  onChange,
  options,
  id,
  disabled = false,
  className,
  'aria-label': ariaLabel,
}: SelectProps) {
  const generatedId = useId()
  const triggerId = id ?? generatedId
  const listboxId = `${triggerId}-listbox`
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [menuPosition, setMenuPosition] = useState<MenuPosition | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedIndex = options.findIndex((option) => option === value)

  const closeMenu = useCallback(() => {
    setOpen(false)
    setHighlightedIndex(-1)
    setMenuPosition(null)
  }, [])

  const openMenu = useCallback(() => {
    if (disabled || triggerRef.current == null) {
      return
    }
    setMenuPosition(computeMenuPosition(triggerRef.current))
    setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }, [disabled, selectedIndex])

  const selectOption = useCallback((option: string) => {
    onChange(option)
    closeMenu()
    triggerRef.current?.focus()
  }, [closeMenu, onChange])

  useLayoutEffect(() => {
    if (!open || triggerRef.current == null) {
      return undefined
    }

    const updatePosition = () => {
      if (triggerRef.current != null) {
        setMenuPosition(computeMenuPosition(triggerRef.current))
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current?.contains(target)
        || listRef.current?.contains(target)
      ) {
        return
      }
      closeMenu()
    }

    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [closeMenu, open])

  useEffect(() => {
    if (!open || highlightedIndex < 0 || listRef.current == null) {
      return
    }
    const option = listRef.current.children[highlightedIndex] as HTMLElement | undefined
    option?.scrollIntoView({ block: 'nearest' })
  }, [highlightedIndex, open])

  const onTriggerKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) {
      return
    }

    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
      case 'Enter':
      case ' ':
        event.preventDefault()
        if (!open) {
          openMenu()
          return
        }
        break
      case 'Escape':
        if (open) {
          event.preventDefault()
          closeMenu()
        }
        return
      default:
        return
    }

    if (!open) {
      return
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlightedIndex((current) => {
        const next = current < 0 ? 0 : Math.min(current + 1, options.length - 1)
        return next
      })
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlightedIndex((current) => {
        const next = current < 0 ? options.length - 1 : Math.max(current - 1, 0)
        return next
      })
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const option = options[highlightedIndex >= 0 ? highlightedIndex : selectedIndex]
      if (option != null) {
        selectOption(option)
      }
    }
  }

  const activeIndex = highlightedIndex >= 0 ? highlightedIndex : selectedIndex

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        className={cn('teach-select-trigger', open && 'is-open', className)}
        role="combobox"
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={listboxId}
        aria-activedescendant={
          open && activeIndex >= 0 ? `${triggerId}-option-${activeIndex}` : undefined
        }
        disabled={disabled}
        onClick={() => {
          if (open) {
            closeMenu()
          } else {
            openMenu()
          }
        }}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="teach-select-value">{value}</span>
        <ChevronDown size={16} className="teach-select-chevron" aria-hidden="true" />
      </button>

      {open && menuPosition != null
        ? createPortal(
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-labelledby={triggerId}
              className={cn(
                'teach-select-menu',
                menuPosition.placement === 'top' && 'teach-select-menu--top',
              )}
              style={{
                top: menuPosition.placement === 'bottom' ? menuPosition.top : undefined,
                bottom: menuPosition.placement === 'top'
                  ? window.innerHeight - menuPosition.top
                  : undefined,
                left: menuPosition.left,
                width: menuPosition.width,
                maxHeight: menuPosition.maxHeight,
              }}
            >
              {options.map((option, index) => {
                const selected = option === value
                const highlighted = index === activeIndex
                return (
                  <li
                    key={option}
                    id={`${triggerId}-option-${index}`}
                    role="option"
                    aria-selected={selected}
                    className={cn(
                      'teach-select-option',
                      selected && 'is-selected',
                      highlighted && 'is-highlighted',
                    )}
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectOption(option)}
                  >
                    <span className="teach-select-option-label">{option}</span>
                    {selected ? (
                      <Check size={15} className="teach-select-option-check" aria-hidden="true" />
                    ) : null}
                  </li>
                )
              })}
            </ul>,
            document.body,
          )
        : null}
    </>
  )
}
