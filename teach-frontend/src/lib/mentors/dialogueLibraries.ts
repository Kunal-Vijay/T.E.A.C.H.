import type { DialogueProfile, TutorId } from '../../types/mentor.types'

function lib(profile: DialogueProfile): DialogueProfile {
  return profile
}

export const MENTOR_DIALOGUES: Record<TutorId, DialogueProfile> = {
  nova: lib({
    greetings: [
      "Hey! I'm Nova — ready to learn something great together?",
      "Hi! Nova here. Let's make today a win.",
      "Welcome back! I'm Nova, your AI Tutor.",
      "Ready when you are — let's dive in.",
    ],
    demoLines: [
      "Awesome! Let's solve this together.",
      "Yes! That's the energy. Next challenge?",
      "Love it. Keep that momentum rolling.",
      "We totally got this — one step at a time.",
    ],
    lessonIntros: [
      "Alright — here's the key part.",
      "Check this out. It's going to click.",
      "Ready? This one's a good one.",
      "Let's break this down — clear and simple.",
    ],
    celebrations: [
      "Nice work!",
      "You nailed it!",
      "That was excellent.",
      "High five — you earned that one.",
    ],
    encouragements: [
      "No worries — let's try again.",
      "Almost! You're closer than you think.",
      "Misses happen. Let's regroup.",
      "Take a breath. Next one's yours.",
    ],
    hints: [
      "Try looking at what the question is really asking.",
      "What pattern do you see so far?",
      "Start small — one step at a time.",
    ],
    goodbyes: [
      "Great session! See you next time.",
      "You showed up today. That counts.",
      "Rest up — more progress tomorrow.",
    ],
    retries: [
      "Let's give it another shot.",
      "Round two — you've got better info now.",
      "Reset. Breathe. Go again.",
    ],
    quizCorrect: [
      "Nice work!",
      "That's exactly right!",
      "Crushed it!",
    ],
    quizWrong: [
      "No worries — let's try again.",
      "Close! Want to rethink it?",
      "Not quite — but you're learning.",
    ],
    lessonComplete: [
      "You finished that session. Well done!",
      "Session complete — you showed up big.",
      "That's a wrap — well earned.",
    ],
    streakExcited: [
      "Streak mode on! I knew you had this.",
      "Look at that streak go!",
      "You're on a roll — keep going.",
    ],
    welcomeBack: [
      "You're back! Ready to pick up where we left off?",
      "Hey again! Where were we?",
      "Welcome back — let's keep learning.",
    ],
    thinking: [
      "Hmm… I've got an idea…",
      "One sec — piecing it together.",
      "Let me think through this…",
    ],
    listening: [
      "I'm listening — tell me what you're thinking.",
      "Go on — I'm here.",
      "Say it in your own words. I'm all ears.",
    ],
    explaining: [
      "Here's the key idea…",
      "The trick is this.",
      "Watch this move — simple but powerful.",
    ],
    curious: [
      "What if we tried it this way?",
      "Hmm, interesting angle…",
      "What happens if we flip it?",
    ],
    proud: [
      "Look at you go!",
      "I'm genuinely proud of that.",
      "That was all you.",
    ],
  }),
}
