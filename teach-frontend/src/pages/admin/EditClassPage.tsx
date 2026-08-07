import { Link, useNavigate, useParams } from 'react-router-dom'
import { useCallback, useEffect, useMemo, useState } from 'react'
import axios from 'axios'
import CreateClassForm from '../../components/admin/CreateClassForm'
import TeachLogo from '../../components/branding/TeachLogo'
import { classPlanApi } from '../../services/api/classPlanApi'
import type { ClassPlanDetailResponse, CreateClassPlanRequest } from '../../types/api.types'

export default function EditClassPage() {
  const { planId = '' } = useParams()
  const navigate = useNavigate()
  const [classPlan, setClassPlan] = useState<ClassPlanDetailResponse | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)

  const loadPlan = useCallback(async () => {
    const response = await classPlanApi.get(planId)
    setClassPlan(response.data)
  }, [planId])

  useEffect(() => {
    const initialize = async () => {
      try {
        await loadPlan()
      } catch {
        setErrorMessage('Failed to load class plan')
      } finally {
        setLoading(false)
      }
    }
    initialize()
  }, [loadPlan])

  const initialValues = useMemo<CreateClassPlanRequest | undefined>(() => {
    if (classPlan === null) {
      return undefined
    }
    return {
      title: classPlan.title,
      subject: classPlan.subject,
      grade: classPlan.grade,
      class_label: classPlan.class_label,
      chapter_name: classPlan.chapter_name,
      chapter_number: classPlan.chapter_number,
      target_exam: classPlan.target_exam,
      language_code: classPlan.language_code,
      topics: classPlan.topics.map(({ topic_id: _topicId, ...topic }) => topic),
    }
  }, [classPlan])

  const handleUpdate = async (payload: CreateClassPlanRequest) => {
    setSaving(true)
    setErrorMessage(null)
    try {
      await classPlanApi.update(planId, payload)
      navigate(`/teacher/classes/${planId}/review`)
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string') {
        setErrorMessage(error.response.data.detail)
        return
      }
      setErrorMessage('Failed to update class plan')
    } finally {
      setSaving(false)
    }
  }

  const unpublishPlan = async () => {
    setUnpublishing(true)
    setErrorMessage(null)
    try {
      await classPlanApi.unpublish(planId)
      await loadPlan()
    } catch (error) {
      if (axios.isAxiosError(error) && typeof error.response?.data?.detail === 'string') {
        setErrorMessage(error.response.data.detail)
        return
      }
      setErrorMessage('Failed to unpublish class plan')
    } finally {
      setUnpublishing(false)
    }
  }

  if (loading) {
    return <div className="page container page-main">Loading...</div>
  }

  if (classPlan === null) {
    return <div className="page container page-main">Class plan not found</div>
  }

  return (
    <div className="page">
      <header className="container page-header">
        <TeachLogo />
        <Link to={`/teacher/classes/${planId}/review`} className="btn btn-secondary">Back to Review</Link>
      </header>
      <main className="container page-main">
        {errorMessage !== null ? <div className="error-banner">{errorMessage}</div> : null}
        {classPlan.status === 'published' ? (
          <section className="card unpublish-card">
            <h2>Edit Class Plan</h2>
            <p>
              This class plan is published. Unpublish it to draft before editing topics or teaching guidelines.
            </p>
            <button className="btn btn-primary" onClick={unpublishPlan} disabled={unpublishing}>
              {unpublishing ? 'Unpublishing...' : 'Unpublish to Edit'}
            </button>
          </section>
        ) : (
          <CreateClassForm
            formTitle="Edit Class Plan"
            submitLabel="Save Changes"
            initialValues={initialValues}
            onSubmit={handleUpdate}
            loading={saving}
          />
        )}
      </main>
      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 0; }
        .page-main { padding-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem; }
        .unpublish-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
      `}</style>
    </div>
  )
}
