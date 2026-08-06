import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import CreateClassForm from '../../components/admin/CreateClassForm'
import TeacherHubBackLink from '../../components/nav/TeacherHubBackLink'
import {
  AppPage,
  ErrorState,
  HubHero,
  PageAlert,
  PageHeader,
} from '../../components/ui'
import { useToast } from '../../context/ToastContext'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { classPlanApi } from '../../services/api/classPlanApi'

export default function CreateClassPage() {
  const navigate = useNavigate()
  const { pushToast } = useToast()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (payload: Parameters<typeof CreateClassForm>[0]['onSubmit'] extends (value: infer T) => unknown ? T : never) => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await classPlanApi.create(payload)
      navigate(`/teacher/classes/${response.data.plan_id}`, { state: { created: true } })
    } catch (error) {
      captureException(error, { action: 'create_class_plan' })
      const message = resolveDisplayedError(error, {
        component: 'CreateClassPage',
        action: 'create_class_plan',
      }, 'Failed to create class plan')
      if (message !== null) {
        setErrorMessage(message)
        pushToast(message, 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppPage variant="teacher-form">
      {errorMessage !== null ? (
        <PageAlert>
          <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
        </PageAlert>
      ) : null}

      <TeacherHubBackLink />

      <HubHero>
        <PageHeader
          variant="hub"
          kicker="New lesson"
          title="Create class"
          lede="Add topics and notes — T.E.A.C.H will turn them into a live classroom."
        />
      </HubHero>

      <CreateClassForm onSubmit={handleSubmit} loading={loading} />
    </AppPage>
  )
}
