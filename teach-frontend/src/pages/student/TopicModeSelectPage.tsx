import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AppPage,
  Button,
  ErrorState,
  PageAlert,
  PageHeader,
  PageSection,
} from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { learningSessionApi } from '../../services/api/learningSessionApi'
import { studentProfileApi } from '../../services/api/studentProfileApi'
import { topicApi } from '../../services/api/topicApi'
import { getStudentId } from '../../services/auth/authService'
import {
  LEARNING_MODE_LABELS,
  MODE_SESSION_SELECTABLE_KEYS,
  type LearningMode,
  type StudentParamOverrides,
  type StudentProfileResponse,
  type TopicResponse,
} from '../../types/learning.types'

const MODES: LearningMode[] = ['teach', 'doubt', 'viva']

function formatParamLabel(key: string): string {
  return key.replace(/_/g, ' ')
}

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

export default function TopicModeSelectPage() {
  const { topicId = '' } = useParams()
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [topic, setTopic] = useState<TopicResponse | null>(null)
  const [profile, setProfile] = useState<StudentProfileResponse | null>(null)
  const [selectedMode, setSelectedMode] = useState<LearningMode>('teach')
  const [overrides, setOverrides] = useState<StudentParamOverrides>({})
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    let cancelled = false
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
        captureException(error, { page: 'topic_mode_select' })
        const message = resolveDisplayedError(
          error,
          { component: 'TopicModeSelectPage', action: 'load' },
          'Failed to load topic',
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
  }, [topicId])

  const selectMode = (mode: LearningMode) => {
    setSelectedMode(mode)
    setOverrides(buildOverridesForMode(mode, profile))
  }

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
      captureException(error, { page: 'topic_mode_select', action: 'start' })
      const message = resolveDisplayedError(
        error,
        { component: 'TopicModeSelectPage', action: 'start_session' },
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

  if (loading) {
    return (
      <AppPage>
        <PageSection label="Loading topic">Loading topic…</PageSection>
      </AppPage>
    )
  }

  if (topic == null) {
    return (
      <AppPage>
        <ErrorState message="Topic not found. Go back to the catalog and pick another topic." />
      </AppPage>
    )
  }

  const selectableKeys = MODE_SESSION_SELECTABLE_KEYS[selectedMode]

  return (
    <AppPage>
      <PageHeader title={topic.title} lede={topic.description} />
      <PageSection label="Mode selection">
        {errorMessage !== null ? (
          <PageAlert>
            <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          </PageAlert>
        ) : null}
        <h2>Table of contents</h2>
        <ol>
          {topic.toc_items.map((item) => (
            <li key={item.id}>
              <strong>{item.title}</strong> — {item.summary}
            </li>
          ))}
        </ol>
        <h2>Choose a mode</h2>
        <div className="mode-picker-grid">
          {MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className={selectedMode === mode ? 'mode-card is-selected' : 'mode-card'}
              onClick={() => selectMode(mode)}
            >
              {LEARNING_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
        {selectableKeys.length > 0 ? (
          <>
            <h2>Session preferences</h2>
            <div className="params-grid">
              {selectableKeys.map((key) => {
                const field = profile?.attributes[key]
                if (field == null) {
                  return null
                }
                return (
                  <label key={key} className="param-field">
                    <span>{formatParamLabel(key)}</span>
                    <select
                      value={overrides[key as keyof StudentParamOverrides] ?? field.value}
                      onChange={(event) =>
                        setOverrides((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                      }
                    >
                      {field.possible_values.map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                  </label>
                )
              })}
            </div>
          </>
        ) : null}
        <Button type="button" disabled={starting} onClick={() => void startSession()}>
          {starting ? 'Starting…' : 'Start session'}
        </Button>
      </PageSection>
    </AppPage>
  )
}
