import { useEffect, useState } from 'react'
import type { CreateClassPlanRequest, TopicInput } from '../../types/api.types'

const emptyTopic = (): TopicInput => ({
  order: 1,
  title: '',
  duration_minutes: 15,
  base_material: '',
  teaching_guidelines: [''],
  miscellaneous_notes: [''],
})

interface NoteListFieldProps {
  label: string
  notes: string[]
  onChange: (notes: string[]) => void
  placeholder: string
}

function NoteListField({ label, notes, onChange, placeholder }: NoteListFieldProps) {
  const displayNotes = notes.length === 0 ? [''] : notes

  const updateNote = (noteIndex: number, value: string) => {
    onChange(displayNotes.map((note, index) => (index === noteIndex ? value : note)))
  }

  const addNote = () => {
    onChange([...displayNotes, ''])
  }

  const removeNote = (noteIndex: number) => {
    if (displayNotes.length === 1) {
      onChange([''])
      return
    }
    onChange(displayNotes.filter((_, index) => index !== noteIndex))
  }

  return (
    <div className="note-list-field">
      <div className="note-list-header">
        <label className="note-list-label">{label}</label>
        <button type="button" className="btn btn-icon" onClick={addNote} aria-label={`Add ${label}`}>
          +
        </button>
      </div>
      {displayNotes.map((note, noteIndex) => (
        <div className="note-row" key={`${label}-${noteIndex}`}>
          <input
            className="input"
            placeholder={placeholder}
            value={note}
            onChange={(event) => updateNote(noteIndex, event.target.value)}
          />
          {displayNotes.length > 1 ? (
            <button
              type="button"
              className="btn btn-icon btn-icon-remove"
              onClick={() => removeNote(noteIndex)}
              aria-label={`Remove ${label}`}
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

interface CreateClassFormProps {
  formTitle?: string
  submitLabel?: string
  initialValues?: CreateClassPlanRequest
  onSubmit: (payload: CreateClassPlanRequest) => Promise<void>
  loading?: boolean
}

export default function CreateClassForm({
  formTitle = 'Create Class Plan',
  submitLabel = 'Save Draft',
  initialValues,
  onSubmit,
  loading = false,
}: CreateClassFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '')
  const [subject, setSubject] = useState(initialValues?.subject ?? 'Physics')
  const [grade, setGrade] = useState(initialValues?.grade ?? '11')
  const [classLabel, setClassLabel] = useState(initialValues?.class_label ?? 'Class 11')
  const [chapterName, setChapterName] = useState(initialValues?.chapter_name ?? '')
  const [chapterNumber, setChapterNumber] = useState<number | undefined>(initialValues?.chapter_number)
  const [targetExam, setTargetExam] = useState(initialValues?.target_exam ?? 'JEE Main')
  const [languageCode, setLanguageCode] = useState(initialValues?.language_code ?? 'en-IN')
  const [topics, setTopics] = useState<TopicInput[]>(
    initialValues?.topics.length ? initialValues.topics : [emptyTopic()],
  )

  useEffect(() => {
    if (initialValues === undefined) {
      return
    }
    setTitle(initialValues.title)
    setSubject(initialValues.subject)
    setGrade(initialValues.grade)
    setClassLabel(initialValues.class_label)
    setChapterName(initialValues.chapter_name)
    setChapterNumber(initialValues.chapter_number)
    setTargetExam(initialValues.target_exam)
    setLanguageCode(initialValues.language_code)
    setTopics(initialValues.topics.length > 0 ? initialValues.topics : [emptyTopic()])
  }, [initialValues])

  const updateTopic = (index: number, field: keyof TopicInput, value: string | number | string[]) => {
    setTopics((previousTopics) =>
      previousTopics.map((topic, topicIndex) =>
        topicIndex === index ? { ...topic, [field]: value } : topic,
      ),
    )
  }

  const addTopic = () => {
    setTopics((previousTopics) => [
      ...previousTopics,
      { ...emptyTopic(), order: previousTopics.length + 1 },
    ])
  }

  const removeTopic = (index: number) => {
    setTopics((previousTopics) =>
      previousTopics
        .filter((_, topicIndex) => topicIndex !== index)
        .map((topic, topicIndex) => ({ ...topic, order: topicIndex + 1 })),
    )
  }

  const sanitizeNotes = (notes: string[]) => notes.filter((note) => note.trim() !== '')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    await onSubmit({
      title,
      subject,
      grade,
      class_label: classLabel,
      chapter_name: chapterName,
      chapter_number: chapterNumber,
      target_exam: targetExam,
      language_code: languageCode,
      topics: topics.map((topic) => ({
        ...topic,
        teaching_guidelines: sanitizeNotes(topic.teaching_guidelines),
        miscellaneous_notes: sanitizeNotes(topic.miscellaneous_notes),
      })),
    })
  }

  return (
    <form className={`create-class-form card ${loading ? 'loading' : ''}`} onSubmit={handleSubmit}>
      <h2>{formTitle}</h2>
      <div className="form-grid">
        <input className="input" placeholder="Title" value={title} onChange={(event) => setTitle(event.target.value)} required />
        <input className="input" placeholder="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} required />
        <input className="input" placeholder="Grade" value={grade} onChange={(event) => setGrade(event.target.value)} required />
        <input className="input" placeholder="Class Label" value={classLabel} onChange={(event) => setClassLabel(event.target.value)} required />
        <input className="input" placeholder="Chapter Name" value={chapterName} onChange={(event) => setChapterName(event.target.value)} required />
        <input className="input" type="number" placeholder="Chapter Number" value={chapterNumber ?? ''} onChange={(event) => setChapterNumber(event.target.value ? Number(event.target.value) : undefined)} />
        <input className="input" placeholder="Target Exam" value={targetExam} onChange={(event) => setTargetExam(event.target.value)} required />
        <input className="input" placeholder="Language Code" value={languageCode} onChange={(event) => setLanguageCode(event.target.value)} required />
      </div>

      {topics.map((topic, index) => (
        <div className="topic-editor card" key={`topic-${index}`}>
          <div className="topic-header">
            <h3>Topic {topic.order}</h3>
            {topics.length > 1 ? (
              <button type="button" className="btn btn-secondary" onClick={() => removeTopic(index)}>
                Remove
              </button>
            ) : null}
          </div>
          <input className="input" placeholder="Topic Title" value={topic.title} onChange={(event) => updateTopic(index, 'title', event.target.value)} required />
          <input className="input" type="number" placeholder="Duration (minutes)" value={topic.duration_minutes} onChange={(event) => updateTopic(index, 'duration_minutes', Number(event.target.value))} required />
          <textarea className="textarea" placeholder="Base Material" value={topic.base_material} onChange={(event) => updateTopic(index, 'base_material', event.target.value)} required />
          <NoteListField
            label="Teaching Guidelines"
            notes={topic.teaching_guidelines}
            placeholder="Enter one teaching guideline"
            onChange={(notes) => updateTopic(index, 'teaching_guidelines', notes)}
          />
          <NoteListField
            label="Miscellaneous Notes"
            notes={topic.miscellaneous_notes}
            placeholder="Enter one miscellaneous note"
            onChange={(notes) => updateTopic(index, 'miscellaneous_notes', notes)}
          />
        </div>
      ))}

      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={addTopic}>Add Topic</button>
        <button type="submit" className="btn btn-primary">{submitLabel}</button>
      </div>

      <style>{`
        .create-class-form { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
        .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 0.75rem; }
        .topic-editor { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; background: #fbfdff; }
        .topic-header { display: flex; justify-content: space-between; align-items: center; }
        .form-actions { display: flex; gap: 0.75rem; justify-content: flex-end; }
        .note-list-field { display: flex; flex-direction: column; gap: 0.5rem; }
        .note-list-header { display: flex; justify-content: space-between; align-items: center; }
        .note-list-label { font-weight: 600; color: var(--teach-text, #0f172a); }
        .note-row { display: flex; gap: 0.5rem; align-items: center; }
        .note-row .input { flex: 1; }
        .btn-icon {
          width: 2rem;
          height: 2rem;
          padding: 0;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          line-height: 1;
          background: #dbeafe;
          color: #1d4ed8;
          border: 1px solid #93c5fd;
        }
        .btn-icon-remove {
          background: #fee2e2;
          color: #b91c1c;
          border-color: #fca5a5;
        }
      `}</style>
    </form>
  )
}
