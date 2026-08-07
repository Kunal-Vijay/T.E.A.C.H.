import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useFocusTrap } from '../../hooks/useFocusTrap'

interface ModalProps {
  open: boolean
  onClose: () => void
  ariaLabel: string
  children: ReactNode
  panelClassName?: string
}

export default function Modal({
  open,
  onClose,
  ariaLabel,
  children,
  panelClassName = 'modal-panel',
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  useFocusTrap(panelRef, open)

  useEffect(() => {
    if (!open) {
      return undefined
    }
    const previousBodyOverflow = document.body.style.overflow
    const previousHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.overflow = previousHtmlOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, onClose])

  if (!open) {
    return null
  }

  return createPortal(
    <div className="modal-root">
      <button
        type="button"
        className="modal-backdrop"
        aria-label="Close"
        onClick={() => { void onClose() }}
      />
      <div
        className="modal-shell"
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
      >
        <div className={panelClassName} ref={panelRef}>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
