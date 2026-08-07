/**
 * Presentation layer for student profile / session preference enums.
 * Maps backend snake_case values to student-facing labels.
 */

const PREFERENCE_VALUE_LABELS: Record<string, string> = {
  // Explanation depth
  quick_overview: 'Quick Overview',
  standard: 'Standard',
  detailed: 'Detailed',
  deep_conceptual: 'Deep Conceptual',
  exam_oriented: 'Exam Focused',

  // Pace
  slow: 'Slow',
  moderate: 'Moderate',
  fast: 'Fast',
  adaptive: 'Adaptive',

  // Interaction mode
  lecture: 'Lecture',
  guided: 'Guided',
  socratic: 'Socratic',
  interactive: 'Interactive',
  quiz_focused: 'Quiz Focused',
  discussion: 'Discussion',

  // Practice preference
  mostly_explanations: 'Mostly Explanations',
  balanced: 'Balanced',
  practice_heavy: 'Practice Heavy',
  challenge_mode: 'Challenge Mode',
  theory_first: 'Theory First',
  practice_first: 'Practice First',

  // Knowledge level
  none: 'None',
  basic: 'Basic',
  intermediate: 'Intermediate',
  strong: 'Strong',
  expert: 'Expert',

  // Preferred explanation (doubt mode)
  concise: 'Concise & Direct',
  step_by_step: 'Step by Step',
  example_heavy: 'Example Heavy',
  conceptual: 'Conceptual',
  formula_focused: 'Formula Focused',
}

export interface PreferenceFieldMeta {
  label: string
  description: string
}

export const PREFERENCE_FIELD_META: Record<string, PreferenceFieldMeta> = {
  explanation_depth: {
    label: 'Explanation Style',
    description: 'How detailed Nova explains concepts',
  },
  pace: {
    label: 'Learning Pace',
    description: 'How quickly the lesson progresses',
  },
  interaction_mode: {
    label: 'Interaction Style',
    description: 'How involved you want to be',
  },
  practice_preference: {
    label: 'Practice Focus',
    description: 'Balance between explanation and practice',
  },
  knowledge_level: {
    label: 'Starting Level',
    description: 'How familiar you are with this topic',
  },
  preferred_explanation: {
    label: 'Explanation Style',
    description: 'How Nova should explain answers',
  },
}

function titleCaseWords(value: string): string {
  return value
    .split('_')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

/** Convert a backend enum value into a student-facing label. */
export function formatPreferenceLabel(value: string): string {
  const mapped = PREFERENCE_VALUE_LABELS[value]
  if (mapped != null) {
    return mapped
  }
  return titleCaseWords(value)
}

/** Student-facing label for a preference field key. */
export function formatPreferenceFieldLabel(fieldKey: string): string {
  return PREFERENCE_FIELD_META[fieldKey]?.label ?? titleCaseWords(fieldKey)
}

/** Description copy for a preference field key. */
export function formatPreferenceFieldDescription(fieldKey: string): string {
  return PREFERENCE_FIELD_META[fieldKey]?.description ?? 'Customize this session setting'
}
