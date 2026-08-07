/**
 * Premium report page: hero score ring, radar chart, misconception cards,
 * question timeline, and personal learning plan.
 */

import { ArrowLeft, ChevronDown, RotateCcw, Target } from 'lucide-react'
import { useState } from 'react'
import type { VivaRubricScore, VoiceVivaAssessment } from '../../../types/learning.types'
import type { VivaTranscriptTurn } from '../../../hooks/useVivaVoiceSession'

interface VivaReportProps {
  assessment: VoiceVivaAssessment
  transcript: VivaTranscriptTurn[]
  onRetry: () => void
  onExit: () => void
}

const GRASP_LABELS: Record<string, { label: string; color: string }> = {
  solid: { label: 'Strong Understanding', color: '#22c55e' },
  partial: { label: 'Needs Improvement', color: '#f59e0b' },
  shaky: { label: 'Needs More Practice', color: '#ef4444' },
}

export default function VivaReport({ assessment, transcript, onRetry, onExit }: VivaReportProps) {
  const grasp = GRASP_LABELS[assessment.grasp_level] ?? GRASP_LABELS.partial
  const hasRubric = assessment.rubric.length > 0

  return (
    <div className="viva-report">
      {/* ─── Hero ─── */}
      <section className="viva-report-hero">
        <ScoreRing score={assessment.overall_score} color={grasp.color} />
        <div className="viva-report-hero-text">
          <span className="viva-report-badge" style={{ color: grasp.color }}>
            {grasp.label}
          </span>
          <p className="viva-report-headline">{assessment.headline}</p>
          <p className="viva-report-meta">
            {assessment.questions_answered} of {assessment.questions_asked} questions answered
          </p>
        </div>
      </section>

      {/* ─── Radar Chart ─── */}
      {hasRubric && (
        <section className="viva-report-section">
          <h3 className="viva-report-section-title">Knowledge Radar</h3>
          <RadarChart rubric={assessment.rubric} />
          <div className="viva-report-bars">
            {assessment.rubric.map((entry) => (
              <ScoreBar key={entry.key} entry={entry} />
            ))}
          </div>
        </section>
      )}

      {/* ─── Strengths ─── */}
      {assessment.understood_well.length > 0 && (
        <section className="viva-report-section">
          <h3 className="viva-report-section-title">✓ Strengths</h3>
          <div className="viva-report-cards">
            {assessment.understood_well.map((item) => (
              <div key={item} className="viva-report-card viva-report-card--good">
                <span className="viva-report-card-icon">✓</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Misconceptions ─── */}
      {assessment.misconceptions.length > 0 && (
        <section className="viva-report-section">
          <h3 className="viva-report-section-title">✗ Misconceptions</h3>
          <div className="viva-report-cards">
            {assessment.misconceptions.map((item) => (
              <div key={item} className="viva-report-card viva-report-card--bad">
                <span className="viva-report-card-icon">✗</span>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Question Timeline ─── */}
      {transcript.length > 0 && (
        <section className="viva-report-section">
          <h3 className="viva-report-section-title">Timeline</h3>
          <QuestionTimeline transcript={transcript} />
        </section>
      )}

      {/* ─── Personal Learning Plan ─── */}
      {assessment.next_steps.length > 0 && (
        <section className="viva-report-section">
          <h3 className="viva-report-section-title">
            <Target size={16} /> Personal Learning Plan
          </h3>
          <div className="viva-report-plan">
            {assessment.next_steps.map((step, index) => (
              <div key={step} className="viva-report-plan-item">
                <span className="viva-report-plan-priority">Priority {index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Actions ─── */}
      <footer className="viva-report-actions">
        <button className="viva-exp-btn viva-exp-btn--primary" onClick={onRetry}>
          <RotateCcw size={16} /> Retry Viva
        </button>
        <button className="viva-exp-btn" onClick={onExit}>
          <ArrowLeft size={16} /> Back to Topics
        </button>
      </footer>
    </div>
  )
}

/* ─── Score Ring ─── */
function ScoreRing({ score, color }: { score: number; color: string }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference

  return (
    <div className="viva-score-ring">
      <svg viewBox="0 0 120 120" className="viva-score-ring-svg">
        <circle cx="60" cy="60" r={radius} className="viva-score-ring-bg" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          className="viva-score-ring-fill"
          style={{
            strokeDasharray: circumference,
            strokeDashoffset: offset,
            stroke: color,
          }}
        />
      </svg>
      <div className="viva-score-ring-value">
        <span className="viva-score-ring-number">{score}</span>
        <span className="viva-score-ring-unit">%</span>
      </div>
    </div>
  )
}

/* ─── Radar Chart (SVG) ─── */
function RadarChart({ rubric }: { rubric: VivaRubricScore[] }) {
  const count = rubric.length
  if (count < 3) return null

  const size = 200
  const center = size / 2
  const maxR = 80
  const angleStep = (2 * Math.PI) / count

  const getPoint = (index: number, value: number) => {
    const angle = angleStep * index - Math.PI / 2
    const r = (value / 5) * maxR
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
  }

  const gridLevels = [1, 2, 3, 4, 5]
  const dataPoints = rubric.map((entry, i) => getPoint(i, entry.score))
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="viva-radar">
      {/* Grid */}
      {gridLevels.map((level) => {
        const pts = Array.from({ length: count }, (_, i) => getPoint(i, level))
        const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z'
        return <path key={level} d={path} className="viva-radar-grid" />
      })}
      {/* Axes */}
      {rubric.map((_, i) => {
        const p = getPoint(i, 5)
        return <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} className="viva-radar-axis" />
      })}
      {/* Data */}
      <path d={dataPath} className="viva-radar-data" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" className="viva-radar-dot" />
      ))}
      {/* Labels */}
      {rubric.map((entry, i) => {
        const labelR = maxR + 18
        const angle = angleStep * i - Math.PI / 2
        const x = center + labelR * Math.cos(angle)
        const y = center + labelR * Math.sin(angle)
        return (
          <text key={entry.key} x={x} y={y} className="viva-radar-label" textAnchor="middle">
            {entry.label.split(' ')[0]}
          </text>
        )
      })}
    </svg>
  )
}

/* ─── Score Bar ─── */
function ScoreBar({ entry }: { entry: VivaRubricScore }) {
  const pct = (entry.score / entry.max_score) * 100
  const band = pct >= 70 ? 'good' : pct >= 40 ? 'fair' : 'weak'

  return (
    <div className="viva-bar">
      <div className="viva-bar-header">
        <span className="viva-bar-label">{entry.label}</span>
        <span className={`viva-bar-score viva-bar-score--${band}`}>
          {entry.score}/{entry.max_score}
        </span>
      </div>
      <div className="viva-bar-track">
        <div className={`viva-bar-fill viva-bar-fill--${band}`} style={{ width: `${pct}%` }} />
      </div>
      {entry.comment && <p className="viva-bar-comment">{entry.comment}</p>}
    </div>
  )
}

/* ─── Question Timeline ─── */
function QuestionTimeline({ transcript }: { transcript: VivaTranscriptTurn[] }) {
  const [expanded, setExpanded] = useState<string | null>(null)

  // Group into Q&A pairs
  const pairs: { question: string; answer: string; id: string }[] = []
  for (let i = 0; i < transcript.length; i++) {
    if (transcript[i].role === 'ASSISTANT') {
      const answer = transcript[i + 1]?.role === 'USER' ? transcript[i + 1].text : '(no answer)'
      pairs.push({ question: transcript[i].text, answer, id: transcript[i].id })
    }
  }

  return (
    <div className="viva-timeline">
      {pairs.map((pair, index) => (
        <div
          key={pair.id}
          className={`viva-timeline-item${expanded === pair.id ? ' is-expanded' : ''}`}
          onClick={() => setExpanded(expanded === pair.id ? null : pair.id)}
        >
          <div className="viva-timeline-header">
            <span className="viva-timeline-num">Q{index + 1}</span>
            <span className="viva-timeline-q">{pair.question}</span>
            <ChevronDown size={14} className="viva-timeline-chevron" />
          </div>
          {expanded === pair.id && (
            <div className="viva-timeline-answer">
              <strong>Your answer:</strong> {pair.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
