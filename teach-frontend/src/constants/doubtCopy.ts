/** Copy for the post-lesson doubt invitation moment. */

export const DOUBT_INVITATION_LINES = [
  'Would you like me to explain anything again?',
  'Still confused about this topic?',
  'Ask me anything before we continue.',
  'Anything I can clarify before we move on?',
  'Got a question? I\'m here for you.',
] as const

export const DOUBT_QUICK_ACTIONS = [
  { id: 'simpler', label: 'Explain more simply', message: 'Can you explain this more simply?' },
  { id: 'example', label: 'Give another example', message: 'Can you give me another example?' },
  { id: 'diagram', label: 'Show a diagram', message: 'Can you show this as a diagram or visual?' },
  { id: 'real-life', label: 'Real-life example', message: 'Can you give a real-life example of this?' },
  { id: 'repeat', label: 'Repeat explanation', message: 'Can you repeat the explanation in different words?' },
] as const

export function pickDoubtInvitation(): string {
  const index = Math.floor(Math.random() * DOUBT_INVITATION_LINES.length)
  return DOUBT_INVITATION_LINES[index] ?? DOUBT_INVITATION_LINES[0]
}
