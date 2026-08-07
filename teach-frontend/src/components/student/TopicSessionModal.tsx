import {
  Brain,
  Check,
  ChevronDown,
  Clock,
  GraduationCap,
  HelpCircle,
  Layers,
  Settings,
  X,
} from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal'
import { Button, ErrorState, IconButton, Select, StatusBadge } from '../ui'
import Icon from '../ui/Icon'
import { useToast } from '../../context/ToastContext'
import { estimateTopicDurationMinutes } from '../../lib/topicCatalog'
import {
  formatPreferenceFieldDescription,
  formatPreferenceFieldLabel,
  formatPreferenceLabel,
} from '../../lib/preferenceLabels'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { learningSessionApi } from '../../services/api/learningSessionApi'
import { studentProfileApi } from '../../services/api/studentProfileApi'
import { topicApi } from '../../services/api/topicApi'
import { getStudentId } from '../../services/auth/authService'
import {
  MODE_SESSION_SELECTABLE_KEYS,
  type LearningMode,
  type StudentParamOverrides,
  type StudentProfileResponse,
  type TopicResponse,
} from '../../types/learning.types'

const TOPIC_VISIBLE_LIMIT = 8

const MODE_OPTIONS: Array<{
  id: LearningMode
  title: string
  subtitle: string
  icon: typeof GraduationCap
}> = [
  {
    id: 'teach',
    title: 'Teach Me',
    subtitle: 'Complete narrated lesson',
    icon: GraduationCap,
  },
  {
    id: 'doubt',
    title: 'Ask a Doubt',
    subtitle: 'Talk with Nova',
    icon: HelpCircle,
  },
  {
    id: 'viva',
    title: 'Check Understanding',
    subtitle: 'Assess your learning',
    icon: Brain,
  },
]

function buildOverridesForMode(
  mode: LearningMode,
  profile: StudentProfileResponse | null,
): StudentParamOverrides {
  const nextOverrides: StudentParamOverrides = {}
  if (profile == null) {
    return nextOverrides
  }
  for (const key of MODE_SESSION_SELECTABLE_KEYS[mode]) {
    const field = profile.attributes[key]
    if (field != null) {
      nextOverrides[key as keyof StudentParamOverrides] = field.value
    }
  }
  return nextOverrides
}

interface TopicSessionModalProps {
  topicId: string
  open: boolean
  onClose: () => void
  returnFocusRef?: RefObject<HTMLElement | null>
}

export default function TopicSessionModal({
  topicId,
  open,
  onClose,
  returnFocusRef,
}: TopicSessionModalProps) {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [topic, setTopic] = useState<TopicResponse | null>(null)
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null)
  const [selectedMode, setSelectedMode] = useState<LearningMode>('teach')
  const [overrides, setOverrides] = useState<StudentParamOverrides>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [closing, setClosing] = useState(false)
  const [topicsExpanded, setTopicsExpanded] = useState(false)
  const [settingsExpanded, setSettingsExpanded] = useState(false)
  const closeTimerRef = useRef<number | null>(null)

  const requestClose = useCallback(() => {
    if (closing || starting) {
      return
    }
    setClosing(true)
    closeTimerRef.current = window.setTimeout(() => {
      setClosing(false)
      onClose()
    }, 220)
  }, [closing, onClose, starting])

  useEffect(() => {
    if (!open) {
      setClosing(false)
      if (closeTimerRef.current != null) {
        window.clearTimeout(closeTimerRef.current)
        closeTimerRef.current = null
      }
      returnFocusRef?.current?.focus()
      return undefined
    }

    let cancelled = false
    setLoading(true)
    setErrorMessage(null)
    setSelectedMode('teach')
    setTopicsExpanded(false)
    setSettingsExpanded(false)

    const load = async () => {
      try {
        const studentId = getStudentId()
        const [topicResponse, profileResponse] = await Promise.all([
          topicApi.get(topicId),
          studentProfileApi.getAttributes(studentId),
        ])
        if (cancelled) {
          return
        }
        setTopic(topicResponse.data)
        setProfile(profileResponse.data)
        setOverrides(buildOverridesForMode('teach', profileResponse.data))
      } catch (error) {
        if (cancelled) {
          return
        }
        captureException(error, { page: 'topic_session_modal' })
        const message = resolveDisplayedError(
          error,
          { component: 'TopicSessionModal', action: 'load' },
          'Failed to load class',
        )
        if (message !== null) {
          setErrorMessage(message)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [open, topicId, returnFocusRef])

  useEffect(() => () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current)
    }
  }, [])

  const startSession = async () => {
    if (topic == null) {
      return
    }
    setStarting(true)
    try {
      const response = await learningSessionApi.start({
        topic_id: topic.id,
        mode: selectedMode,
        student_identifier: getStudentId(),
        param_overrides: selectedMode === 'viva' ? undefined : overrides,
      })
      if (selectedMode === 'viva') {
        navigate(`/student/sessions/${response.data.id}/viva`)
      } else {
        navigate(`/student/sessions/${response.data.id}`)
      }
    } catch (error) {
      captureException(error, { page: 'topic_session_modal', action: 'start' })
      const message = resolveDisplayedError(
        error,
        { component: 'TopicSessionModal', action: 'start_session' },
        'Could not start session',
      )
      if (message !== null) {
        pushToast(message, 'error')
        setErrorMessage(message)
      }
    } finally {
      setStarting(false)
    }
  }

  const durationMinutes = topic != null
    ? estimateTopicDurationMinutes(topic.toc_items.length)
    : null

  const topicItems = topic?.toc_items ?? []
  const hasHiddenTopics = topicItems.length > TOPIC_VISIBLE_LIMIT
  const visibleTopics = useMemo(() => {
    if (!hasHiddenTopics || topicsExpanded) {
      return topicItems
    }
    return topicItems.slice(0, TOPIC_VISIBLE_LIMIT)
  }, [hasHiddenTopics, topicItems, topicsExpanded])

  const selectableKeys = MODE_SESSION_SELECTABLE_KEYS[selectedMode]

  const selectMode = (mode: LearningMode) => {
    setSelectedMode(mode)
    setOverrides(buildOverridesForMode(mode, profile))
    if (MODE_SESSION_SELECTABLE_KEYS[mode].length === 0) {
      setSettingsExpanded(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={requestClose}
      ariaLabel={topic?.title ?? 'Configure class session'}
      panelClassName={`session-config-modal${closing ? ' session-config-modal--closing' : ''}`}
    >
      {loading ? (
        <div className="session-config-state" role="status">
          <div className="session-config-state-bar" />
          <p>Loading class…</p>
        </div>
      ) : null}

      {!loading && topic == null ? (
        <div className="session-config-state">
          <ErrorState message="Class not found. Close and pick another recording." />
          <Button type="button" variant="secondary" onClick={requestClose}>
            Close
          </Button>
        </div>
      ) : null}

      {!loading && topic != null ? (
        <>
          <header className="session-config-header">
            <div className="session-config-header-main">
              <StatusBadge variant="hub" status="published" label={topic.subject} />
              <h2 className="session-config-title">{topic.title}</h2>
              <p className="session-config-description">
                {topic.description !== ''
                  ? topic.description
                  : 'Learn with Nova in a live AI-guided session.'}
              </p>
            </div>
            <IconButton
              type="button"
              icon={X}
              label="Close"
              className="session-config-close"
              onClick={requestClose}
              disabled={starting}
            />
          </header>

          <div className="session-config-body">
            {errorMessage !== null ? (
              <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
            ) : null}

            <section className="session-config-section" aria-labelledby="session-config-overview">
              <h3 id="session-config-overview" className="session-config-kicker">
                Lesson Overview
              </h3>

              <div className="session-config-overview-card">
                <div className="session-config-stats">
                  <div className="session-config-stat">
                    <Icon icon={Layers} size={16} className="session-config-stat-icon" />
                    <span>
                      {topicItems.length} {topicItems.length === 1 ? 'topic' : 'topics'}
                    </span>
                  </div>
                  {durationMinutes != null ? (
                    <div className="session-config-stat">
                      <Icon icon={Clock} size={16} className="session-config-stat-icon" />
                      <span>{durationMinutes} min estimated</span>
                    </div>
                  ) : null}
                </div>

                <ol className="session-config-timeline" aria-label="Lesson topics">
                  {visibleTopics.map((item, index) => (
                    <li key={item.id} className="session-config-timeline-item">
                      <span className="session-config-timeline-marker" aria-hidden="true">
                        <span className="session-config-timeline-dot" />
                        {index < visibleTopics.length - 1 ? (
                          <span className="session-config-timeline-line" />
                        ) : null}
                      </span>
                      <span className="session-config-timeline-title">{item.title}</span>
                    </li>
                  ))}
                </ol>

                {hasHiddenTopics ? (
                  <button
                    type="button"
                    className="session-config-timeline-toggle"
                    aria-expanded={topicsExpanded}
                    onClick={() => setTopicsExpanded((value) => !value)}
                  >
                    {topicsExpanded
                      ? 'Show fewer topics'
                      : `Show all ${topicItems.length} topics`}
                  </button>
                ) : null}
              </div>
            </section>

            <section className="session-config-section session-config-section--hero" aria-labelledby="session-config-modes">
              <h3 id="session-config-modes" className="session-config-kicker">
                Learning Mode
              </h3>

              <div
                className="session-config-mode-grid session-config-mode-grid--triple"
                role="radiogroup"
                aria-labelledby="session-config-modes"
              >
                {MODE_OPTIONS.map((mode) => {
                  const selected = selectedMode === mode.id
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      className={selected ? 'session-config-mode is-selected' : 'session-config-mode'}
                      onClick={() => selectMode(mode.id)}
                    >
                      {selected ? (
                        <span className="session-config-mode-check" aria-hidden="true">
                          <Check size={14} strokeWidth={2.5} />
                        </span>
                      ) : null}
                      <span className="session-config-mode-icon" aria-hidden="true">
                        <Icon icon={mode.icon} size={22} />
                      </span>
                      <span className="session-config-mode-copy">
                        <strong>{mode.title}</strong>
                        <span>{mode.subtitle}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </section>

            {selectableKeys.length > 0 ? (
            <section className="session-config-section" aria-labelledby="session-config-settings-label">
              <button
                type="button"
                id="session-config-settings-label"
                className="session-config-settings-trigger"
                aria-expanded={settingsExpanded}
                aria-controls="session-config-settings-panel"
                onClick={() => setSettingsExpanded((value) => !value)}
              >
                <span className="session-config-settings-trigger-icon" aria-hidden="true">
                  <Icon icon={Settings} size={17} />
                </span>
                <span className="session-config-settings-trigger-copy">
                  <strong>Advanced Settings</strong>
                  <span>Recommended defaults are already selected</span>
                </span>
                <ChevronDown
                  size={18}
                  className={settingsExpanded ? 'session-config-chevron is-open' : 'session-config-chevron'}
                  aria-hidden="true"
                />
              </button>

              <div
                id="session-config-settings-panel"
                className={settingsExpanded ? 'session-config-reveal is-open' : 'session-config-reveal'}
                aria-hidden={!settingsExpanded}
              >
                <div className="session-config-reveal-inner">
                  <div className="session-config-settings-panel">
                    {selectableKeys.map((key) => {
                      const field = profile?.attributes[key]
                      if (field == null) {
                        return null
                      }
                      const meta = {
                        label: formatPreferenceFieldLabel(key),
                        description: formatPreferenceFieldDescription(key),
                      }
                      return (
                        <div key={key} className="session-config-field">
                          <div className="session-config-field-copy">
                            <span className="session-config-field-label">{meta.label}</span>
                            <span className="session-config-field-desc">{meta.description}</span>
                          </div>
                          <Select
                            value={overrides[key as keyof StudentParamOverrides] ?? field.value}
                            onChange={(nextValue) =>
                              setOverrides((current) => ({
                                ...current,
                                [key]: nextValue,
                              }))
                            }
                            options={field.possible_values}
                            getOptionLabel={formatPreferenceLabel}
                            aria-label={meta.label}
                          />
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </section>
            ) : null}
          </div>

          <footer className="session-config-footer">
            <div className="session-config-footer-meta">
              {durationMinutes != null ? (
                <p className="session-config-duration">
                  <Icon icon={Clock} size={15} />
                  <span>
                    <strong>{durationMinutes} min</strong> estimated
                  </span>
                </p>
              ) : (
                <span aria-hidden="true" />
              )}
            </div>
            <div className="session-config-footer-actions">
              <Button type="button" variant="secondary" onClick={requestClose} disabled={starting}>
                Cancel
              </Button>
              <Button type="button" disabled={starting} onClick={() => void startSession()}>
                {starting ? 'Starting…' : 'Start Session'}
              </Button>
            </div>
          </footer>
        </>
      ) : null}
    </Modal>
  )
}
