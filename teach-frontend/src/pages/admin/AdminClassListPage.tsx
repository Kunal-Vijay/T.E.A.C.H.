import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import TeachLogo from '../../components/branding/TeachLogo'
import { classPlanApi } from '../../services/api/classPlanApi'
import type { ClassPlanResponse } from '../../types/api.types'

export default function AdminClassListPage() {
  const [classPlans, setClassPlans] = useState<ClassPlanResponse[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadClassPlans = async () => {
      try {
        const response = await classPlanApi.list()
        setClassPlans(response.data.items)
      } catch {
        setErrorMessage('Could not load classes. Make sure the backend is running on port 8000.')
      } finally {
        setLoading(false)
      }
    }
    loadClassPlans()
  }, [])

  return (
    <div className="page">
      <header className="page-header container">
        <TeachLogo />
        <Link className="btn btn-primary" to="/admin/classes/new">Create Class</Link>
      </header>
      <main className="container page-main">
        {errorMessage !== null ? <div className="error-banner">{errorMessage}</div> : null}
        {loading ? <p>Loading classes...</p> : classPlans.length === 0 ? (
          <div className="empty-state card">
            <p>No classes yet.</p>
            <p>Click <strong>Create Class</strong> to add your first class plan.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {classPlans.map((classPlan) => (
              <Link key={classPlan.plan_id} to={`/admin/classes/${classPlan.plan_id}`} className="card class-card">
                <span className={`badge badge-${classPlan.status}`}>{classPlan.status}</span>
                <h3>{classPlan.title}</h3>
                <p>{classPlan.subject} • Grade {classPlan.grade}</p>
                <p>{classPlan.chapter_name}</p>
                <p>{classPlan.total_duration_minutes} minutes</p>
              </Link>
            ))}
          </div>
        )}
      </main>
      <style>{`
        .page-header { display: flex; justify-content: space-between; align-items: center; padding: 1.5rem 0; }
        .page-main { padding-bottom: 2rem; }
        .class-card { padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .empty-state { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; color: var(--teach-muted, #64748b); }
      `}</style>
    </div>
  )
}
