import { Plus, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Button, GlassPanel, IconButton } from '../ui'
import type { TopicInput } from '../../types/api.types'

const emptyTopic = (): TopicInput => ({
  order: 1,
  title: '',
  duration_minutes: 15,
  base_material: '',
  teaching_notes: [''],
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
        <span className="note-list-label">{label}</span>
        <IconButton icon={Plus} label={`Add ${label}`} onClick={addNote} />
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
            <IconButton
              icon={X}
              label={`Remove ${label}`}
              remove
              onClick={() => removeNote(noteIndex)}
            />
          ) : null}
        </div>
      ))}
    </div>
  )
}

interface CreateClassFormProps {
  onSubmit: (payload: {
    title: string
    subject: string
    grade: string
    class_label: string
    chapter_name: string
    chapter_number?: number
    target_exam: string
    language_code: string
    topics: TopicInput[]
  }) => Promise<void>
  loading?: boolean
}

type FormErrors = Record<string, string>

const WIZARD_STEPS = ['Basics', 'Topics', 'Review'] as const

export default function CreateClassForm({ onSubmit, loading = false }: CreateClassFormProps) {
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState<FormErrors>({})
  const [title, setTitle] = useState('')
  const [subject, setSubject] = useState('Physics')
  const [grade, setGrade] = useState('11')
  const [classLabel, setClassLabel] = useState('Class 11')
  const [chapterName, setChapterName] = useState('')
  const [chapterNumber, setChapterNumber] = useState<number | undefined>(undefined)
  const [targetExam, setTargetExam] = useState('JEE Main')
  const [languageCode, setLanguageCode] = useState('en-IN')
  const [topics, setTopics] = useState<TopicInput[]>([emptyTopic()])

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

  const validateBasics = (): FormErrors => {
    const nextErrors: FormErrors = {}
    if (title.trim() === '') {
      nextErrors.title = 'Title is required'
    }
    if (subject.trim() === '') {
      nextErrors.subject = 'Subject is required'
    }
    if (grade.trim() === '') {
      nextErrors.grade = 'Grade is required'
    }
    if (classLabel.trim() === '') {
      nextErrors.classLabel = 'Class label is required'
    }
    if (chapterName.trim() === '') {
      nextErrors.chapterName = 'Chapter name is required'
    }
    if (targetExam.trim() === '') {
      nextErrors.targetExam = 'Target exam is required'
    }
    if (languageCode.trim() === '') {
      nextErrors.languageCode = 'Language code is required'
    }
    return nextErrors
  }

  const validateTopics = (): FormErrors => {
    const nextErrors: FormErrors = {}
    topics.forEach((topic, index) => {
      if (topic.title.trim() === '') {
        nextErrors[`topic-${index}-title`] = 'Topic title is required'
      }
      if (topic.duration_minutes <= 0) {
        nextErrors[`topic-${index}-duration`] = 'Duration must be greater than 0'
      }
      if (topic.base_material.trim() === '') {
        nextErrors[`topic-${index}-material`] = 'Base material is required'
      }
    })
    return nextErrors
  }

  const totalDuration = useMemo(
    () => topics.reduce((sum, topic) => sum + topic.duration_minutes, 0),
    [topics],
  )

  const goNext = () => {
    const nextErrors = step === 0 ? validateBasics() : validateTopics()
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      return
    }
    setStep((previous) => Math.min(previous + 1, WIZARD_STEPS.length - 1))
  }

  const goBack = () => {
    setErrors({})
    setStep((previous) => Math.max(previous - 1, 0))
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    const basicsErrors = validateBasics()
    const topicErrors = validateTopics()
    const merged = { ...basicsErrors, ...topicErrors }
    setErrors(merged)
    if (Object.keys(merged).length > 0) {
      if (Object.keys(basicsErrors).length > 0) {
        setStep(0)
      } else {
        setStep(1)
      }
      return
    }
    await onSubmit({
      title: title.trim(),
      subject: subject.trim(),
      grade: grade.trim(),
      class_label: classLabel.trim(),
      chapter_name: chapterName.trim(),
      chapter_number: chapterNumber,
      target_exam: targetExam.trim(),
      language_code: languageCode.trim(),
      topics: topics.map((topic) => ({
        ...topic,
        title: topic.title.trim(),
        base_material: topic.base_material.trim(),
        teaching_notes: sanitizeNotes(topic.teaching_notes),
        miscellaneous_notes: sanitizeNotes(topic.miscellaneous_notes),
      })),
    })
  }

  return (
    <GlassPanel
      as="form"
      className={`create-class-form teacher-create-class-form${loading ? ' is-loading' : ''}`}
      onSubmit={handleSubmit}
    >
      <nav className="wizard-steps" aria-label="Create class steps">
        {WIZARD_STEPS.map((label, index) => (
          <span
            key={label}
            className={`wizard-step-indicator${index === step ? ' is-active' : ''}${index < step ? ' is-done' : ''}`}
            aria-current={index === step ? 'step' : undefined}
          >
            {index + 1}. {label}
          </span>
        ))}
      </nav>

      {step === 0 ? (
        <div className="wizard-panel">
          <div className="form-grid">
            <label className="form-field">
              <span className="field-label">Class title</span>
              <input
                className={`input${errors.title != null ? ' input-invalid' : ''}`}
                value={title}
                onChange={(event) => setTitle(event.target.value)}
              />
              <p className="field-hint">What students will see on their dashboard.</p>
              {errors.title != null ? <p className="field-error">{errors.title}</p> : null}
            </label>
            <label className="form-field">
              <span className="field-label">Subject</span>
              <input
                className={`input${errors.subject != null ? ' input-invalid' : ''}`}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              />
              {errors.subject != null ? <p className="field-error">{errors.subject}</p> : null}
            </label>
            <label className="form-field">
              <span className="field-label">Grade</span>
              <input
                className={`input${errors.grade != null ? ' input-invalid' : ''}`}
                value={grade}
                onChange={(event) => setGrade(event.target.value)}
              />
              {errors.grade != null ? <p className="field-error">{errors.grade}</p> : null}
            </label>
            <label className="form-field">
              <span className="field-label">Class label</span>
              <input
                className={`input${errors.classLabel != null ? ' input-invalid' : ''}`}
                value={classLabel}
                onChange={(event) => setClassLabel(event.target.value)}
              />
              <p className="field-hint">e.g. Class 11-A, Batch 2026</p>
              {errors.classLabel != null ? <p className="field-error">{errors.classLabel}</p> : null}
            </label>
            <label className="form-field">
              <span className="field-label">Chapter name</span>
              <input
                className={`input${errors.chapterName != null ? ' input-invalid' : ''}`}
                value={chapterName}
                onChange={(event) => setChapterName(event.target.value)}
              />
              {errors.chapterName != null ? <p className="field-error">{errors.chapterName}</p> : null}
            </label>
            <label className="form-field">
              <span className="field-label">Chapter number</span>
              <input
                className="input"
                type="number"
                min={1}
                value={chapterNumber ?? ''}
                onChange={(event) => setChapterNumber(event.target.value ? Number(event.target.value) : undefined)}
              />
              <p className="field-hint">Optional — helps order chapters in a syllabus.</p>
            </label>
            <label className="form-field">
              <span className="field-label">Target exam</span>
              <input
                className={`input${errors.targetExam != null ? ' input-invalid' : ''}`}
                value={targetExam}
                onChange={(event) => setTargetExam(event.target.value)}
              />
              {errors.targetExam != null ? <p className="field-error">{errors.targetExam}</p> : null}
            </label>
            <label className="form-field">
              <span className="field-label">Language</span>
              <input
                className={`input${errors.languageCode != null ? ' input-invalid' : ''}`}
                value={languageCode}
                onChange={(event) => setLanguageCode(event.target.value)}
              />
              <p className="field-hint">BCP-47 code, e.g. en-IN for Indian English.</p>
              {errors.languageCode != null ? <p className="field-error">{errors.languageCode}</p> : null}
            </label>
          </div>
        </div>
      ) : null}

      {step === 1 ? (
        <div className="wizard-panel">
          {topics.map((topic, index) => (
            <div className="topic-editor" key={`topic-${index}`}>
              <div className="topic-header">
                <h3>Topic {topic.order}</h3>
                {topics.length > 1 ? (
                  <Button type="button" variant="secondary" onClick={() => removeTopic(index)}>
                    Remove
                  </Button>
                ) : null}
              </div>
              <label className="form-field">
                <span className="field-label">Topic title</span>
                <input
                  className={`input${errors[`topic-${index}-title`] != null ? ' input-invalid' : ''}`}
                  value={topic.title}
                  onChange={(event) => updateTopic(index, 'title', event.target.value)}
                />
                {errors[`topic-${index}-title`] != null ? (
                  <p className="field-error">{errors[`topic-${index}-title`]}</p>
                ) : null}
              </label>
              <label className="form-field">
                <span className="field-label">Duration (minutes)</span>
                <input
                  className={`input${errors[`topic-${index}-duration`] != null ? ' input-invalid' : ''}`}
                  type="number"
                  min={1}
                  value={topic.duration_minutes}
                  onChange={(event) => updateTopic(index, 'duration_minutes', Number(event.target.value))}
                />
                {errors[`topic-${index}-duration`] != null ? (
                  <p className="field-error">{errors[`topic-${index}-duration`]}</p>
                ) : null}
              </label>
              <label className="form-field">
                <span className="field-label">Base material</span>
                <textarea
                  className={`textarea${errors[`topic-${index}-material`] != null ? ' input-invalid' : ''}`}
                  value={topic.base_material}
                  onChange={(event) => updateTopic(index, 'base_material', event.target.value)}
                />
                <p className="field-hint">Core content SAGE and the AI teacher will build from.</p>
                {errors[`topic-${index}-material`] != null ? (
                  <p className="field-error">{errors[`topic-${index}-material`]}</p>
                ) : null}
              </label>
              <NoteListField
                label="Teaching notes"
                notes={topic.teaching_notes}
                placeholder="One teaching note"
                onChange={(notes) => updateTopic(index, 'teaching_notes', notes)}
              />
              <NoteListField
                label="Miscellaneous notes"
                notes={topic.miscellaneous_notes}
                placeholder="One miscellaneous note"
                onChange={(notes) => updateTopic(index, 'miscellaneous_notes', notes)}
              />
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addTopic}>
            Add topic
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="wizard-panel">
          <ul className="review-list">
            <li><strong>{title || 'Untitled class'}</strong> · {subject} · Grade {grade}</li>
            <li>{chapterName} · {targetExam} · {languageCode}</li>
            <li>{topics.length} topic{topics.length === 1 ? '' : 's'} · {totalDuration} min total</li>
          </ul>
          <ul className="review-list">
            {topics.map((topic) => (
              <li key={topic.order}>
                <strong>{topic.order}. {topic.title || 'Untitled topic'}</strong> — {topic.duration_minutes} min
              </li>
            ))}
          </ul>
          <p className="field-hint">Saving creates a draft. Publish and generate from the class detail page.</p>
        </div>
      ) : null}

      <div className="wizard-actions">
        {step > 0 ? (
          <Button type="button" variant="secondary" onClick={goBack} disabled={loading}>
            Back
          </Button>
        ) : (
          <span />
        )}
        {step < WIZARD_STEPS.length - 1 ? (
          <Button type="button" variant="primary" pill onClick={goNext}>
            Continue
          </Button>
        ) : (
          <Button type="submit" variant="primary" pill loading={loading} disabled={loading}>
            Save draft
          </Button>
        )}
      </div>
    </GlassPanel>
  )
}
