import type { DialogueProfile, MentorId } from '../../types/mentor.types'

function lib(profile: DialogueProfile): DialogueProfile {
  return profile
}

export const MENTOR_DIALOGUES: Record<MentorId, DialogueProfile> = {
  nova: lib({
    greetings: [
      "Hey! I'm Nova — ready to make today a win streak?",
      "What's up! Nova here. Let's turn this into a W.",
      "Hi hi hi! Ready to learn something awesome?",
      "Nova reporting for cheer duty. Let's go!",
    ],
    demoLines: [
      "Awesome! Let's solve this together!",
      "Yes! That's the energy. Next challenge?",
      "Love it. Keep that momentum rolling!",
      "Okay okay — we totally got this!",
    ],
    lessonIntros: [
      "Alright — here's the fun part!",
      "Check this out. It's gonna click.",
      "Ready? This one's a good one.",
      "Let's break this down — quick and clean.",
    ],
    celebrations: [
      "YES! Nice work!",
      "Boom! You nailed it!",
      "That was fire. Seriously.",
      "High five! You earned that one.",
    ],
    encouragements: [
      "No worries! Let's try again.",
      "Almost! You're closer than you think.",
      "Hey — misses happen. Let's regroup.",
      "Shake it off. Next one's yours.",
    ],
    hints: [
      "Try looking at what the question is really asking.",
      "What pattern do you see so far?",
      "Start small — one step at a time.",
    ],
    goodbyes: [
      "Great session! Catch you next time.",
      "You showed up today. That counts.",
      "Rest up — more wins tomorrow!",
    ],
    retries: [
      "Let's give it another shot!",
      "Round two — you've got better info now.",
      "Reset. Breathe. Go again.",
    ],
    quizCorrect: [
      "YES! Nice work!",
      "Crushed it!",
      "That's exactly right!",
    ],
    quizWrong: [
      "No worries! Let's try again.",
      "Close! Want to rethink it?",
      "Not quite — but you're learning!",
    ],
    lessonComplete: [
      "You crushed that session. High five!",
      "Session done. You showed up big.",
      "That's a wrap — well earned!",
    ],
    streakExcited: [
      "Streak mode ON! I knew you had this!",
      "Look at that streak go!",
      "You're on a roll — don't stop!",
    ],
    welcomeBack: [
      "You're back! Ready to pick up the momentum?",
      "Hey again! Where were we?",
      "Welcome back — let's keep winning.",
    ],
    thinking: [
      "Hmm… I've got an idea…",
      "Wait wait — thinking…",
      "One sec — piecing it together.",
    ],
    listening: [
      "I'm all ears — tell me what you're thinking!",
      "Go on — I'm listening.",
      "Say it out loud. I'm here.",
    ],
    explaining: [
      "So here's the cool trick…",
      "Okay so — the key is this.",
      "Watch this move. Simple but powerful.",
    ],
    curious: [
      "Ooh wait — what if we tried it this way?",
      "Hmm, interesting angle…",
      "What happens if we flip it?",
    ],
    proud: [
      "Look at you go!",
      "I'm genuinely proud of that.",
      "That was all you.",
    ],
  }),

  atlas: lib({
    greetings: [
      "I am Atlas. We will build understanding, one step at a time.",
      "Good to begin. There is no rush here.",
      "Welcome. Let us proceed with care.",
      "Atlas here. Shall we examine the idea together?",
    ],
    demoLines: [
      "Excellent observation. Let's understand why this works.",
      "Let us consider the reasoning behind this.",
      "Notice the structure. Everything follows from it.",
      "A solid foundation makes the rest clear.",
    ],
    lessonIntros: [
      "Consider the foundation first.",
      "Let us walk through this deliberately.",
      "Observe the principle before the steps.",
      "We begin with what is given.",
    ],
    celebrations: [
      "Excellent reasoning.",
      "Well reasoned. That clarity will serve you.",
      "Precisely. Your method was sound.",
      "A thoughtful answer. Well done.",
    ],
    encouragements: [
      "This is a common mistake. Let us examine it calmly.",
      "Not yet — but the attempt was thoughtful.",
      "Step back. What is the core concept here?",
      "Errors teach us where the gap lies.",
    ],
    hints: [
      "Return to the definition. What must be true?",
      "Which rule applies in this situation?",
      "Write out what you know. Then infer.",
    ],
    goodbyes: [
      "Until next time. Reflect on what you learned.",
      "Solid work today. Rest and return refreshed.",
      "We will continue building from here.",
    ],
    retries: [
      "Let us attempt this again with fresh eyes.",
      "Try once more. Patience yields clarity.",
      "Reconsider. The answer often follows the principle.",
    ],
    quizCorrect: [
      "Excellent reasoning.",
      "Correct. Your logic holds.",
      "Well done. That was methodical.",
    ],
    quizWrong: [
      "This is a common mistake.",
      "Not quite. Review the underlying rule.",
      "A reasonable attempt. Let us adjust.",
    ],
    lessonComplete: [
      "Solid work. Understanding compounds quietly.",
      "Session complete. Review while it is fresh.",
      "You have built something durable today.",
    ],
    streakExcited: [
      "Consistency is the quiet superpower.",
      "Your discipline is showing. Well done.",
      "Steady progress. That is how mastery forms.",
    ],
    welcomeBack: [
      "Good to see you again. Shall we continue?",
      "Welcome back. We pick up the thread here.",
      "Let us resume where we left off.",
    ],
    thinking: [
      "Let me consider this carefully…",
      "One moment. I am weighing the options.",
      "Hmm. There is nuance here.",
    ],
    listening: [
      "Take your time. I am listening.",
      "Share your reasoning. I will follow.",
      "Explain your thinking. There is no hurry.",
    ],
    explaining: [
      "Notice the pattern beneath the surface.",
      "The key lies in this relationship.",
      "Follow the logic step by step.",
    ],
    curious: [
      "An interesting angle. Tell me more.",
      "What assumption are we making?",
      "That raises a worthwhile question.",
    ],
    proud: [
      "That clarity will serve you well.",
      "You demonstrated real understanding.",
      "Well earned. Be proud of that.",
    ],
  }),

  spark: lib({
    greetings: [
      "Beep-boop! Spark online. What shall we explore?",
      "Boot sequence complete! Ready to experiment?",
      "Hi! Spark here. Let's poke at some ideas!",
      "Systems green. Adventure mode: on.",
    ],
    demoLines: [
      "That was fun! Want another challenge?",
      "Ooo — this one's fun! Ready?",
      "Circuit's humming. Let's go!",
      "Like dominoes — one push, chain reaction!",
    ],
    lessonIntros: [
      "Imagine this like a circuit — follow the flow!",
      "Hypothesis time! Watch what happens.",
      "Experiment mode activated.",
      "Picture a Rube Goldberg machine. Here we go.",
    ],
    celebrations: [
      "Haha! We nailed it.",
      "Circuit complete! Brilliant!",
      "Beep boop — that's a yes!",
      "Output: success. Love it.",
    ],
    encouragements: [
      "Ooo… almost! The logic took a tiny detour.",
      "Interesting guess! Let's trace the wires.",
      "Close! One connection off.",
      "Fun attempt — let's debug it.",
    ],
    hints: [
      "Trace the path from input to output.",
      "What would break if you changed one piece?",
      "Try the simplest case first.",
    ],
    goodbyes: [
      "Mission log saved. See you next orbit!",
      "Powering down. Great experiments today.",
      "Beep boop — until next time!",
    ],
    retries: [
      "Reboot and retry! You've got new data.",
      "Run it again — different angle.",
      "One more pass through the logic.",
    ],
    quizCorrect: [
      "Haha! We nailed it.",
      "Correct! Systems nominal.",
      "Yes yes yes — connection made!",
    ],
    quizWrong: [
      "Ooo… almost!",
      "Detour detected. Recalibrate!",
      "Not quite — but fun try!",
    ],
    lessonComplete: [
      "Mission log updated. You learned heaps!",
      "Experiment complete. Results: awesome.",
      "Session saved. Nice work, scientist!",
    ],
    streakExcited: [
      "Streak mode activated! Systems nominal!",
      "Streak counter climbing! Wheee!",
      "You're on a hot streak. Keep probing!",
    ],
    welcomeBack: [
      "Reboot complete. Ready for more experiments?",
      "Welcome back! What's our next test?",
      "Spark online again. Let's explore!",
    ],
    thinking: [
      "Processing… spinning up ideas…",
      "Whirr… calculating…",
      "Hmm. Running simulations…",
    ],
    listening: [
      "Input received! What's your theory?",
      "I'm listening. Feed me data!",
      "Go on — what's your hypothesis?",
    ],
    explaining: [
      "Picture dominoes — one push, chain reaction!",
      "Think of it like a loop. Watch…",
      "Input goes here. Output pops out there.",
    ],
    curious: [
      "Wait wait — what if we flip it?",
      "What happens at the edge case?",
      "Ooo — twist the idea sideways!",
    ],
    proud: [
      "Circuit complete! Brilliant connection.",
      "You debugged that beautifully.",
      "Innovator vibes. Seriously.",
    ],
  }),

  luna: lib({
    greetings: [
      "Hi… I'm Luna. Learning feels better when you feel safe — I'm here.",
      "Hello, gently. No rush today.",
      "Luna here. We can take this slowly.",
      "Welcome. You're in a good place to learn.",
    ],
    demoLines: [
      "You're doing great. Let's take this one step at a time.",
      "Take your time. You're doing better than you think.",
      "One step. Then another. That's enough.",
      "Breathe. We've got this together.",
    ],
    lessonIntros: [
      "There's no rush. Let's walk through this gently.",
      "When you're ready — here's the next bit.",
      "Soft start. We'll build from here.",
      "Let me guide you through this calmly.",
    ],
    celebrations: [
      "I'm proud of you.",
      "Beautiful. You trusted yourself.",
      "That was lovely work.",
      "See? You had it in you.",
    ],
    encouragements: [
      "It's okay. Learning takes practice.",
      "Mistakes mean you're trying. That matters.",
      "Be gentle with yourself. Try again.",
      "Confusion is part of the path. Keep going.",
    ],
    hints: [
      "What part feels unclear? Start there.",
      "Break it into smaller pieces.",
      "There is no wrong pace. Just the next step.",
    ],
    goodbyes: [
      "Rest well. You did enough today.",
      "I'm glad you came. Take care.",
      "Until next time — gently.",
    ],
    retries: [
      "Want to try once more? No pressure.",
      "Whenever you're ready — again.",
      "Let's walk through it together.",
    ],
    quizCorrect: [
      "I'm proud of you.",
      "You did that so well.",
      "Yes — trust that feeling.",
    ],
    quizWrong: [
      "It's okay. Learning takes practice.",
      "Not this time — and that's alright.",
      "You're still learning. That's the point.",
    ],
    lessonComplete: [
      "You showed up for yourself today. That matters.",
      "Session complete. Be kind to yourself.",
      "You did enough. Truly.",
    ],
    streakExcited: [
      "Look at you — showing up, day after day.",
      "Your steady presence is beautiful.",
      "Consistency, gently built. Well done.",
    ],
    welcomeBack: [
      "I'm glad you're back. We'll go at your pace.",
      "Welcome back. No rush today.",
      "Hello again. Ready when you are.",
    ],
    thinking: [
      "Let's breathe for a moment…",
      "Hmm. Give it a quiet second…",
      "Thinking softly…",
    ],
    listening: [
      "I'm here with you. Share what's on your mind.",
      "I'm listening. Take your time.",
      "Say what you're thinking. I'm here.",
    ],
    explaining: [
      "Think of it like planting a seed — it grows slowly.",
      "One gentle step at a time.",
      "Picture a calm stream — steady and clear.",
    ],
    curious: [
      "I wonder… what feels unclear to you?",
      "What would make this feel easier?",
      "Curious — what do you notice?",
    ],
    proud: [
      "You trusted yourself — and it showed.",
      "That took courage. Well done.",
      "I'm quietly cheering for you.",
    ],
  }),

  sage: lib({
    greetings: [
      "Sage here. Clear goals, clear steps — let's begin.",
      "Welcome. We proceed with structure.",
      "Good. Let us establish the objective.",
      "Session start. Focus and clarity.",
    ],
    demoLines: [
      "Let's analyze this carefully.",
      "Apply the principle. Observe the result.",
      "Method first. Answer second.",
      "Examine the evidence. Then conclude.",
    ],
    lessonIntros: [
      "Apply the principle systematically. Watch.",
      "Note the given information first.",
      "We proceed in ordered steps.",
      "Define terms. Then solve.",
    ],
    celebrations: [
      "Correct. Your method was sound.",
      "Precisely executed.",
      "Valid reasoning throughout.",
      "Accurate. Well done.",
    ],
    encouragements: [
      "Review the core rule. The answer follows from it.",
      "Re-examine the premises.",
      "A common error. Adjust and retry.",
      "Check your assumptions.",
    ],
    hints: [
      "Identify the governing principle.",
      "Which formula or rule applies?",
      "State what is known. Infer the rest.",
    ],
    goodbyes: [
      "Session ended. Review your notes.",
      "Until next lesson. Stay disciplined.",
      "Complete. Prepare for the next unit.",
    ],
    retries: [
      "Attempt again using the same framework.",
      "Reapply the method. Carefully.",
      "One more iteration. Precision matters.",
    ],
    quizCorrect: [
      "Correct. Your method was sound.",
      "Accurate. Well reasoned.",
      "Valid. Proceed.",
    ],
    quizWrong: [
      "Review the core rule.",
      "Incorrect. Revisit step one.",
      "Error detected. Analyze why.",
    ],
    lessonComplete: [
      "Session complete. Review while it is fresh.",
      "Objective met. Document your notes.",
      "Well structured work today.",
    ],
    streakExcited: [
      "Discipline builds mastery. Your streak reflects that.",
      "Consistent effort. Expected and excellent.",
      "Streak maintained. Continue.",
    ],
    welcomeBack: [
      "Welcome back. Let's pick up the thread.",
      "Resume session. Prior context applies.",
      "Continuing from last lesson.",
    ],
    thinking: [
      "Examining the structure…",
      "Analyzing…",
      "One moment. Evaluating.",
    ],
    listening: [
      "State your reasoning. I will follow.",
      "Present your logic.",
      "I am listening. Be precise.",
    ],
    explaining: [
      "The key variable is here. Note it.",
      "Follow the derivation.",
      "Observe the causal chain.",
    ],
    curious: [
      "What assumption are we making?",
      "Define the boundary conditions.",
      "Which case does this cover?",
    ],
    proud: [
      "Precisely executed.",
      "Professional work.",
      "That meets the standard.",
    ],
  }),

  pixel: lib({
    greetings: [
      "Pixel initialized. Optimized path ready.",
      "Boot OK. Awaiting input.",
      "System online. Target: learn.",
      "Ready. Shortest route computed.",
    ],
    demoLines: [
      "Pattern detected. Here's the shortcut.",
      "Output: clear. Next node.",
      "Efficient path found.",
      "Logic check: pass.",
    ],
    lessonIntros: [
      "Reduce to base case. Then recurse.",
      "Input mapped. Processing.",
      "Decompose problem. Execute.",
      "Graph loaded. Traverse.",
    ],
    celebrations: [
      "Output verified. Efficient.",
      "Match confirmed.",
      "Optimal path taken.",
      "Success flag set.",
    ],
    encouragements: [
      "Edge case detected. Re-evaluate input.",
      "Mismatch. Retry with new params.",
      "False branch. Backtrack.",
      "Error handled. Continue.",
    ],
    hints: [
      "Simplify the input.",
      "Check boundary conditions.",
      "Try the trivial case.",
    ],
    goodbyes: [
      "Process exit 0. See you.",
      "State saved. Offline.",
      "Session terminated cleanly.",
    ],
    retries: [
      "Retry iteration.",
      "Reset stack. Run again.",
      "Re-execute with fix.",
    ],
    quizCorrect: [
      "Output verified.",
      "Correct. O of happy.",
      "Pass.",
    ],
    quizWrong: [
      "Edge case fail.",
      "Wrong branch.",
      "Re-run logic.",
    ],
    lessonComplete: [
      "Process complete. State saved.",
      "Job done. Memory flushed.",
      "Exit success.",
    ],
    streakExcited: [
      "Streak counter incremented. Stable.",
      "Uptime extended. Nice.",
      "Metric: consistent.",
    ],
    welcomeBack: [
      "Session resumed. Context loaded.",
      "Cache warm. Continue.",
      "Reconnect OK.",
    ],
    thinking: [
      "Computing…",
      "Dots loading…",
      "Parse in progress…",
    ],
    listening: [
      "Awaiting input.",
      "Buffer open.",
      "Send data.",
    ],
    explaining: [
      "Map: input → transform → output.",
      "Node A connects to B.",
      "Algorithm: linear scan.",
    ],
    curious: [
      "Anomaly detected. Investigate?",
      "Unexpected value. Why?",
      "Edge case?",
    ],
    proud: [
      "Optimal path confirmed.",
      "Clean execution.",
      "Zero waste.",
    ],
  }),

  astro: lib({
    greetings: [
      "Astro reporting! The universe is huge — let's map one idea at a time.",
      "Explorer online. Coordinates set.",
      "Welcome aboard. Mission: understand.",
      "Stars aligned. Let's launch.",
    ],
    demoLines: [
      "Let's explore this idea together.",
      "Like finding a new star — click!",
      "Plot course. Engage curiosity.",
      "Discovery mode: on.",
    ],
    lessonIntros: [
      "Every big discovery started with one question.",
      "Zoom out — see the whole system.",
      "Charting new territory. Ready?",
      "Telescope up. Observe.",
    ],
    celebrations: [
      "Discovery logged! That's science!",
      "New star on the map — you!",
      "Expedition win!",
      "Data confirms: brilliant!",
    ],
    encouragements: [
      "Every explorer takes wrong turns. Recalibrate!",
      "Off course briefly. Adjust heading.",
      "Wrong orbit — slingshot back.",
      "Detour noted. Continue mission.",
    ],
    hints: [
      "What would you measure first?",
      "Zoom out. What pattern emerges?",
      "Compare to a known system.",
    ],
    goodbyes: [
      "Expedition paused. Safe travels.",
      "Docking complete. See you soon.",
      "Mission log closed. Well done.",
    ],
    retries: [
      "Recalibrate and relaunch.",
      "New trajectory. Try again.",
      "Explorer rule: iterate.",
    ],
    quizCorrect: [
      "Discovery logged!",
      "Signal confirmed!",
      "That's how science moves!",
    ],
    quizWrong: [
      "Wrong turn. Recalibrate!",
      "Not this star. Scan again.",
      "Almost in orbit!",
    ],
    lessonComplete: [
      "Expedition complete. Territory charted!",
      "Mission success. Log it.",
      "You mapped new ground today.",
    ],
    streakExcited: [
      "Your learning orbit is rising!",
      "Streak trajectory: ascending!",
      "Consistent thrust. Impressive!",
    ],
    welcomeBack: [
      "Back from the void? Let's launch.",
      "Welcome back, explorer.",
      "Systems warmed. Ready?",
    ],
    thinking: [
      "Scanning the horizon…",
      "Telescope focusing…",
      "Plotting possibilities…",
    ],
    listening: [
      "What do your instruments tell you?",
      "Report your observations.",
      "I'm receiving. Go ahead.",
    ],
    explaining: [
      "Zoom out — see the whole system.",
      "Like gravity — it pulls it together.",
      "Picture two galaxies merging…",
    ],
    curious: [
      "What if we looked through a different lens?",
      "Hypothesis: what else could it be?",
      "Strange reading — investigate?",
    ],
    proud: [
      "Like finding a new star!",
      "Navigator skills: confirmed.",
      "The cosmos approves.",
    ],
  }),

  ember: lib({
    greetings: [
      "Ember here — let's turn ideas into something unforgettable.",
      "Hey! Ready to sketch some magic?",
      "Creative mode on. What shall we make?",
      "Story time? I'm in.",
    ],
    demoLines: [
      "What if we looked at it from another angle?",
      "Love that twist! What else?",
      "Picture the scene differently…",
      "Flip the canvas. See what happens.",
    ],
    lessonIntros: [
      "Picture this as a story — who's the hero?",
      "Imagine flipping the canvas upside down…",
      "Start with a wild what-if.",
      "Every idea is a draft. Here we go.",
    ],
    celebrations: [
      "That spark caught fire. Gorgeous thinking.",
      "Chef's kiss. Creative gold.",
      "You painted outside the lines — perfect.",
      "That's the kind of idea that sticks.",
    ],
    encouragements: [
      "Wild guess — I love the creativity. Let's refine it.",
      "Bold try! Sharpen the edges.",
      "Not quite — but the instinct was cool.",
      "Draft two will be better. Promise.",
    ],
    hints: [
      "What if the opposite were true?",
      "Who is the audience in this story?",
      "Change one variable. What shifts?",
    ],
    goodbyes: [
      "Save the draft. More tomorrow.",
      "The ember stays warm. See you.",
      "Close the sketchbook gently.",
    ],
    retries: [
      "Another draft. Artists iterate.",
      "Rotate the idea 90 degrees.",
      "Version two — go!",
    ],
    quizCorrect: [
      "That spark caught fire!",
      "Beautiful angle!",
      "Yes! Reframe master.",
    ],
    quizWrong: [
      "Interesting draft — refine it?",
      "Cool idea, wrong fit. Twist again.",
      "Almost — reshape it.",
    ],
    lessonComplete: [
      "You left something brilliant on the page.",
      "Session sketched. Well done.",
      "Creative miles today.",
    ],
    streakExcited: [
      "Your creative streak is glowing!",
      "Palette keeps getting richer.",
      "Inspiration streak unlocked!",
    ],
    welcomeBack: [
      "The ember's still warm — ready to create?",
      "Welcome back, storyteller.",
      "Pick up the pen. Continue.",
    ],
    thinking: [
      "Sketching possibilities…",
      "What if… hmm…",
      "Doodling ideas…",
    ],
    listening: [
      "Tell me the version in your head.",
      "I'm listening to your angle.",
      "Paint me the picture.",
    ],
    explaining: [
      "Imagine flipping the canvas upside down…",
      "Think of it as a character arc.",
      "Metaphor time — listen close.",
    ],
    curious: [
      "What if the opposite were true?",
      "Twist the lens — what appears?",
      "Curious… and what then?",
    ],
    proud: [
      "That's the kind of idea that sticks.",
      "Original. Genuinely yours.",
      "Creative courage — noted.",
    ],
  }),
}
