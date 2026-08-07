import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import CreateClassForm from '../../components/admin/CreateClassForm'
import TeachLogo from '../../components/branding/TeachLogo'
import { classPlanApi } from '../../services/api/classPlanApi'
import type { CreateClassPlanRequest } from '../../types/api.types'

export default function CreateClassPage() {
  const navigate = useNavigate()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (payload: CreateClassPlanRequest) => {
    setLoading(true)
    setErrorMessage(null)
    try {
      const response = await classPlanApi.create(payload)
      navigate(`/admin/classes/${response.data.plan_id}`)
    } catch {
      setErrorMessage('Failed to create class plan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="container page-header">
        <TeachLogo />
      </header>
      <main className="container page-main">
        {errorMessage !== null ? <div className="error-banner">{errorMessage}</div> : null}
        <CreateClassForm onSubmit={handleSubmit} loading={loading} />
      </main>
      <style>{`
        .page-header { padding: 1.5rem 0; }
        .page-main { padding-bottom: 2rem; }
      `}</style>
    </div>
  )
}
