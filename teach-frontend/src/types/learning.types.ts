export type TopicStatus = 'draft' | 'published' | 'archived'

export type LearningMode = 'teach' | 'doubt' | 'viva'

export type LearningSessionStatus = 'active' | 'completed' | 'abandoned'

export type GoalStatus = 'in_progress' | 'completed'

export type InputChannel = 'chat' | 'speech'

export type VivaAdvanceReason = 'pass' | 'silence' | 'dont_know'

export type SessionTurnRole = 'student' | 'tutor' | 'system'

export interface TopicTocItem {
  id: string
  order: number
  title: string
  summary: string
  teaching_notes: string[]
}

export interface TopicResponse {
  id: string
  title: string
  subject: string
  description: string
  status: TopicStatus
  created_by: string | null
  created_at: string | null
  updated_at: string | null
  toc_items: TopicTocItem[]
}

export interface PaginatedTopicList {
  items: TopicResponse[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface CreateTopicRequest {
  title: string
  subject: string
  description?: string
  created_by?: string | null
  toc_items: Array<{
    order: number
    title: string
    summary: string
    teaching_notes?: string[]
  }>
}

export interface StudentAttributeField {
  value: string
  possible_values: string[]
}

export interface StudentProfileResponse {
  id: string
  student_identifier: string
  display_name: string | null
  attributes: Record<string, StudentAttributeField>
  created_at: string | null
  updated_at: string | null
}

export interface StudentParamsSnapshot {
  academic_level: string
  exam_target: string
  prior_knowledge: string
  learning_style: string
  explanation_depth: string
  pace: string
  language_style: string
  interaction_mode: string
  practice_preference: string
  primary_goal: string
  knowledge_level: string
  preferred_explanation: string
}

export interface StudentParamOverrides {
  explanation_depth?: string
  pace?: string
  interaction_mode?: string
  knowledge_level?: string
  preferred_explanation?: string
}

export interface SessionSlideElement {
  element_id: string
  type: string
  content: string | string[] | null
}

export interface SessionSlide {
  slide_id: string
  layout: string
  elements: SessionSlideElement[]
  explanation_text?: string
}

export interface SessionVisual {
  id: string
  session_turn_id: string
  slides: SessionSlide[]
  explanation_text: string
  quiz_payload: Record<string, unknown> | null
}

export interface SessionTurn {
  id: string
  order: number
  role: SessionTurnRole
  text: string
  input_channel: InputChannel | null
  created_at: string | null
}

export interface VivaAssessment {
  weak_toc_item_ids: string[]
  insight_summary: string
  question_evaluations: Array<Record<string, unknown>>
}

export interface LearningSessionResponse {
  id: string
  topic_id: string
  mode: LearningMode
  student_identifier: string
  params_snapshot: StudentParamsSnapshot
  status: LearningSessionStatus
  goal_status: GoalStatus
  taught_toc_item_ids: string[]
  mode_state: Record<string, unknown>
  turns: SessionTurn[]
  current_visual: SessionVisual | null
  viva_assessment: VivaAssessment | null
  latest_tutor_message: string | null
  created_at: string | null
  updated_at: string | null
  completed_at: string | null
}

export const LEARNING_MODE_LABELS: Record<LearningMode, string> = {
  teach: 'Teach me this topic',
  doubt: 'Ask a doubt',
  viva: 'Know your understanding',
}

export const MODE_SESSION_SELECTABLE_KEYS: Record<LearningMode, readonly string[]> = {
  teach: ['explanation_depth', 'pace', 'interaction_mode'],
  doubt: ['knowledge_level', 'preferred_explanation'],
  viva: [],
}

// --- Spoken viva (Amazon Nova Sonic) ---

export type GraspLevel = 'solid' | 'partial' | 'shaky'

export interface VivaRubricScore {
  key: string
  label: string
  score: number
  max_score: number
  comment: string
}

export interface VoiceVivaAssessment {
  session_id: string
  topic_title: string
  grasp_level: GraspLevel
  headline: string
  overall_score: number
  rubric: VivaRubricScore[]
  understood_well: string[]
  needs_work: string[]
  misconceptions: string[]
  next_steps: string[]
  weak_toc_item_ids: string[]
  questions_asked: number
  questions_answered: number
}

export interface VoiceVivaHealth {
  voice_viva_available: boolean
  sdk_available: boolean
  credentials_available: boolean
  sdk_error: string
  max_questions: number
  max_seconds: number
}
