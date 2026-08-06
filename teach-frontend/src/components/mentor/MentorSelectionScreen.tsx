import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { MENTOR_LIST } from '../../lib/mentors'
import { useMentor } from '../../context/MentorContext'
import { useMentorVoice } from '../../hooks/useMentorVoice'
import { trackEvent } from '../../lib/analytics'
import type { MentorDefinition, MentorId } from '../../types/mentor.types'
import MentorCard from './MentorCard'
import MentorPreviewPanel from './MentorPreviewPanel'
import Icon from '../ui/Icon'

export default function MentorSelectionScreen() {
  const navigate = useNavigate()
  const { selectMentor } = useMentor()
  const { previewVoice, stopPreview } = useMentorVoice()
  const [focusedId, setFocusedId] = useState<MentorId>(MENTOR_LIST[0]?.id ?? 'nova')
  const [selectedId, setSelectedId] = useState<MentorId | null>(null)
  const [mobilePreviewOpen, setMobilePreviewOpen] = useState(false)

  const focusedMentor = MENTOR_LIST.find((m) => m.id === focusedId) ?? MENTOR_LIST[0]

  useEffect(() => () => stopPreview(), [stopPreview])

  const confirmSelection = useCallback((mentor: MentorDefinition) => {
    selectMentor(mentor.id)
    trackEvent('mentor_selected', { mentorId: mentor.id })
    navigate('/student', { replace: true })
  }, [navigate, selectMentor])

  const handleCardFocus = (mentor: MentorDefinition) => {
    setFocusedId(mentor.id)
    if (window.matchMedia('(max-width: 900px)').matches) {
      setMobilePreviewOpen(true)
    }
  }

  const handleVoicePreview = (mentor: MentorDefinition) => {
    setFocusedId(mentor.id)
    void previewVoice(mentor)
  }

  const handleKeyNav = (event: React.KeyboardEvent) => {
    const index = MENTOR_LIST.findIndex((m) => m.id === focusedId)
    if (index < 0) {
      return
    }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
      event.preventDefault()
      const next = MENTOR_LIST[(index + 1) % MENTOR_LIST.length]
      if (next !== undefined) {
        setFocusedId(next.id)
      }
    }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
      event.preventDefault()
      const prev = MENTOR_LIST[(index - 1 + MENTOR_LIST.length) % MENTOR_LIST.length]
      if (prev !== undefined) {
        setFocusedId(prev.id)
      }
    }
    if (event.key === 'Enter' && focusedMentor !== undefined) {
      event.preventDefault()
      confirmSelection(focusedMentor)
    }
  }

  return (
    <div className="mentor-selection page-main" onKeyDown={handleKeyNav}>
      <header className="mentor-selection-header">
        <p className="mentor-selection-kicker">
          <Icon icon={Sparkles} size={14} />
          Your learning companion
        </p>
        <h1>Choose your AI Study Mentor</h1>
        <p className="mentor-selection-lede">
          Pick a mentor who matches your vibe. They&apos;ll guide you through lessons, celebrate wins,
          and cheer you on when things get tricky.
        </p>
      </header>

      <div className="mentor-selection-layout">
        <div className="mentor-selection-grid" role="listbox" aria-label="Available mentors" aria-activedescendant={`mentor-card-${focusedId}`}>
          {MENTOR_LIST.map((mentor) => (
            <MentorCard
              key={mentor.id}
              mentor={mentor}
              selected={selectedId === mentor.id || focusedId === mentor.id}
              previewing={focusedId === mentor.id}
              onFocus={() => handleCardFocus(mentor)}
              onPreview={() => handleVoicePreview(mentor)}
              onSelect={() => {
                setSelectedId(mentor.id)
                confirmSelection(mentor)
              }}
            />
          ))}
        </div>

        <div className="mentor-selection-preview mentor-selection-preview-desktop">
          {focusedMentor !== undefined ? (
            <MentorPreviewPanel
              mentor={focusedMentor}
              onSelect={() => confirmSelection(focusedMentor)}
            />
          ) : null}
        </div>
      </div>

      {mobilePreviewOpen && focusedMentor !== undefined ? (
        <div className="mentor-preview-modal" role="dialog" aria-modal="true" aria-label={`${focusedMentor.name} preview`}>
          <button
            type="button"
            className="mentor-preview-backdrop"
            aria-label="Close preview"
            onClick={() => setMobilePreviewOpen(false)}
          />
          <MentorPreviewPanel
            mentor={focusedMentor}
            compact
            onClose={() => setMobilePreviewOpen(false)}
            onSelect={() => confirmSelection(focusedMentor)}
          />
        </div>
      ) : null}
    </div>
  )
}
