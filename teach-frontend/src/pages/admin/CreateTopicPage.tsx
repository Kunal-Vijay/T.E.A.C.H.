import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppPage, Button, ErrorState, PageAlert, PageHeader, PageSection } from '../../components/ui'
import { captureException } from '../../lib/monitoring'
import { resolveDisplayedError } from '../../services/api/apiError'
import { topicApi } from '../../services/api/topicApi'

interface TocDraft {
  order: number
  title: string
  summary: string
}

export default function CreateTopicPage() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [tocItems, setTocItems] = useState<TocDraft[]>([
    { order: 1, title: '', summary: '' },
  ])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const saveTopic = async () => {
    setSaving(true)
    setErrorMessage(null)
    try {
      const response = await topicApi.create({
        title,
        subject,
        description,
        toc_items: tocItems.map((item) => ({
          order: item.order,
          title: item.title,
          summary: item.summary,
          teaching_notes: [],
        })),
      })
      navigate(`/teacher/topics/${response.data.id}`)
    } catch (error) {
      captureException(error, { page: 'create_topic' })
      const message = resolveDisplayedError(
        error,
        { component: 'CreateTopicPage', action: 'create' },
        'Could not create topic.',
      )
      if (message !== null) {
        setErrorMessage(message)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppPage>
      <PageHeader
        title="Create topic"
        lede="Add the syllabus as an ordered table of contents. Content is generated live in student sessions."
      />
      <PageSection label="Create topic form">
        {errorMessage !== null ? (
          <PageAlert>
            <ErrorState message={errorMessage} onDismiss={() => setErrorMessage(null)} />
          </PageAlert>
        ) : null}
        <label className="param-field">
          <span>Title</span>
          <input value={title} onChange={(event) => setTitle(event.target.value)} />
        </label>
        <label className="param-field">
          <span>Subject</span>
          <input value={subject} onChange={(event) => setSubject(event.target.value)} />
        </label>
        <label className="param-field">
          <span>Description</span>
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} />
        </label>
        <h2>Table of contents</h2>
        {tocItems.map((item, index) => (
          <div key={item.order} className="toc-draft-row">
            <label className="param-field">
              <span>TOC title</span>
              <input
                value={item.title}
                onChange={(event) => {
                  const value = event.target.value
                  setTocItems((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, title: value } : row,
                    ),
                  )
                }}
              />
            </label>
            <label className="param-field">
              <span>Summary / base material</span>
              <textarea
                value={item.summary}
                onChange={(event) => {
                  const value = event.target.value
                  setTocItems((current) =>
                    current.map((row, rowIndex) =>
                      rowIndex === index ? { ...row, summary: value } : row,
                    ),
                  )
                }}
              />
            </label>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setTocItems((current) => [
              ...current,
              { order: current.length + 1, title: '', summary: '' },
            ])
          }
        >
          Add TOC item
        </Button>
        <Button type="button" disabled={saving} onClick={() => void saveTopic()}>
          {saving ? 'Saving…' : 'Create topic'}
        </Button>
      </PageSection>
    </AppPage>
  )
}
