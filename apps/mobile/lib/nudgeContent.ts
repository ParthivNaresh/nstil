const NUDGE_MESSAGES: readonly string[] = [
  "How are you feeling right now?",
  "Your journal is here whenever you're ready.",
  "A quick check-in can go a long way.",
  "Sometimes the hardest part is starting. What's one sentence about your day?",
  "What's one thing you noticed today that you usually overlook?",
  "End your day with a thought. What's on your mind?",
  "Morning thought: what's your intention for today?",
  "Even a few words can help. How are you doing?",
  "Take a moment to pause and reflect.",
  "What made you smile today?",
  "Your thoughts matter. Write them down.",
  "A moment of reflection can change your whole day.",
  "Check in with yourself. How's your energy?",
  "What's something you're grateful for right now?",
  "You've been doing great. Keep the momentum going.",
];

export function getRandomNudgeMessage(): string {
  const index = Math.floor(Math.random() * NUDGE_MESSAGES.length);
  return NUDGE_MESSAGES[index];
}
