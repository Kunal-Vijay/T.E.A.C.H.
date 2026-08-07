export type PlanStatus = 'draft' | 'published' | 'archived'
export type GenerationStatus =
  | 'pending'
  | 'generating_content'
  | 'generating_images'
  | 'completed'
  | 'completed_with_warnings'
  | 'failed'

export interface TopicInput {
  order: number
  title: string
  duration_minutes: number
  base_material: string
  teaching_notes: string[]
  miscellaneous_notes: string[]
}

export interface CreateClassPlanRequest {
  title: string
  subject: string
  grade: string
  class_label: string
  chapter_name: string
  chapter_number?: number
  target_exam: string
  language_code: string
  topics: TopicInput[]
}

export interface ClassPlanResponse {
  plan_id: string
  title: string
  subject: string
  grade: string
  class_label: string
  chapter_name: string
  chapter_number?: number
  target_exam: string
  language_code: string
  total_duration_minutes: number
  status: PlanStatus
}

export interface ClassPlanDetailResponse extends ClassPlanResponse {
  topics: Array<TopicInput & { topic_id: string }>
  latest_generation: {
    generation_id: string
    status: GenerationStatus
  } | null
}

export interface PaginatedClassPlanList {
  items: ClassPlanResponse[]
  total: number
  page: number
  limit: number
}

export interface GenerationStartedResponse {
  generation_id: string
  status: GenerationStatus
}

export interface GenerationStatusResponse {
  generation_id: string
  class_plan_id: string
  status: GenerationStatus
  progress: {
    slides_generated: number
    images_total: number
    images_completed: number
  }
  error_message?: string | null
}

export interface SlideExplanation {
  explanation_text: string
  duration_seconds: number
}

export interface CurrentSlide {
  slide_id: string
  elements: Array<Record<string, unknown>>
  explanation?: SlideExplanation
}

export interface QuizOption {
  option_id: string
  text: string
}

export interface QuizQuestion {
  question_id: string
  question_text: string
  options: QuizOption[]
}

export interface CurrentStateResponse {
  session_id: string
  topic_id?: string
  current_state?: {
    state_id: string
    phase: string
    state_type: string
    label: string
    requires_student_input: boolean
  }
  content?: {
    slides: import('./api.types').CurrentSlide[]
    quiz_questions: import('./api.types').QuizQuestion[]
  }
  next_advance_trigger?: string
  session_status: string
}

export interface ClassroomSessionResponse {
  session_id: string
  generation_id: string
  current_topic_id?: string
  current_state_id?: string
  session_status: string
}

export interface QuizAttemptResponse {
  attempt_id: string
  question_id: string
  selected_option_id: string
  is_correct: boolean
  feedback_explanation: string
}

export interface DoubtSessionResponse {
  doubt_session_id: string
  classroom_session_id: string
  topic_id: string
  status: string
}

export interface DoubtMessageResponse {
  message_id: string
  student_message: string
  ai_response: string
}

export interface DoubtSessionDetailResponse extends DoubtSessionResponse {
  messages: DoubtMessageResponse[]
}

export interface UnderstandingCheckTopic {
  topic_id: string
  title: string
  order: number
  slide_count: number
  quiz_question_count: number
  teaching_approach: string | null
}

export interface UnderstandingCheckTopicList {
  generation_id: string
  class_plan_id: string
  class_title: string
  subject: string
  grade: string
  topics: UnderstandingCheckTopic[]
}

export interface UnderstandingCheckPrompt {
  generation_id: string
  topic_id: string
  topic_title: string
  system_prompt: string
  character_count: number
  opening_line: string
  voice_id: string
  model_id: string
  nova_sonic_configured: boolean
  source_counts: Record<string, number>
}

export interface UnderstandingCheckHealth {
  nova_sonic_configured: boolean
  sdk_available: boolean
  sdk_error: string
  model_id: string
  region: string
  voice_id: string
}

export interface UnderstandingFeedbackRequest {
  generation_id: string
  topic_id: string
  classroom_session_id?: string | null
  transcript: { role: string; text: string }[]
  seconds_elapsed?: number | null
}

export type GraspLevel = 'solid' | 'partial' | 'shaky'

export interface RubricScore {
  key: string
  label: string
  score: number
  max_score: number
  comment: string
}

export interface UnderstandingFeedback {
  topic_title: string
  grasp_level: GraspLevel
  headline: string
  rubric: RubricScore[]
  overall_score: number
  understood_well: string[]
  needs_work: string[]
  misconceptions: string[]
  next_steps: string[]
  questions_asked: number
  questions_answered: number
  student_turns_analysed: number
  model_used: string
}
