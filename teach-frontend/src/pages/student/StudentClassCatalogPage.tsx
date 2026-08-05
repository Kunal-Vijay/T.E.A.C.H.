import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import TeachLogo from '../../components/branding/TeachLogo'
import { classPlanApi } from '../../services/api/classPlanApi'
import { generationApi } from '../../services/api/generationApi'
import { classroomApi } from '../../services/api/classroomApi'
import type { ClassPlanResponse, GenerationStatusResponse } from '../../types/api.types'

interface AvailableClass {
  classPlan: ClassPlanResponse
  generation: GenerationStatusResponse
}

export default function StudentClassCatalogPage() {
  const navigate = useNavigate()
  const [availableClasses, setAvailableClasses] = useState<AvailableClass[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadAvailableClasses = async () => {
      try {
        const response = await classPlanApi.list({ status: 'published' })
        const readyClasses: AvailableClass[] = []
        for (const classPlan of response.data.items) {
          const detailResponse = await classPlanApi.get(classPlan.plan_id)
          if (detailResponse.data.latest_generation == null) {
            continue
          }
          const generationResponse = await generationApi.getStatus(detailResponse.data.latest_generation.generation_id)
          if (generationResponse.data.status === 'completed' || generationResponse.data.status === 'completed_with_warnings') {
            readyClasses.push({ classPlan, generation: generationResponse.data })
          }
        }
        setAvailableClasses(readyClasses)
      } catch {
        setErrorMessage('Failed to load available classes')
      } finally {
        setLoading(false)
      }
    }
    loadAvailableClasses()
  }, [])

  const attendClass = async (generationId: string) => {
    try {
      const response = await classroomApi.create(generationId, 'student')
      sessionStorage.setItem('classroomSessionId', response.data.session_id)
      navigate(`/student/classroom/${generationId}`)
    } catch {
      setErrorMessage('Failed to join class')
    }
  }

  return (
    <div className="page">
      <header className="container page-header">
        <TeachLogo />
      </header>
      <main className="container page-main">
        <h2>Available Classes</h2>
        {errorMessage !== null ? <div className="error-banner">{errorMessage}</div> : null}
        {loading ? <p>Loading classes...</p> : availableClasses.length === 0 ? (
          <div className="empty-state card">
            <p>No classes are ready yet.</p>
            <p>Ask your teacher to publish a class and click Generate Class in the Admin tab.</p>
          </div>
        ) : (
          <div className="grid-cards">
            {availableClasses.map(({ classPlan, generation }) => (
              <div className="card class-card" key={generation.generation_id}>
                <span className="badge badge-ready">Ready</span>
                <h3>{classPlan.title}</h3>
                <p>{classPlan.subject} • Grade {classPlan.grade}</p>
                <p>{classPlan.chapter_name}</p>
                <p>{classPlan.total_duration_minutes} minutes</p>
                <button className="btn btn-primary" onClick={() => attendClass(generation.generation_id)}>
                  Attend Class
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
      <style>{`
        .page-header { padding: 1.5rem 0; }
        .page-main { padding-bottom: 2rem; display: flex; flex-direction: column; gap: 1rem; }
        .class-card { padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem; }
        .empty-state { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.5rem; color: var(--teach-muted, #64748b); }
      `}</style>
    </div>
  )
}
