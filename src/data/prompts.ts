const PROMPTS = [
  'what made you smile today?',
  'what is a tiny joy you would recommend?',
  'what did the sky look like?',
  'what have you been meaning to say?',
  'what place deserves more love?',
  'what are you watching lately?',
  'what ordinary moment felt special?',
  'what advice would you leave a stranger?',
  'what should someone try once?',
  'what sentence has stayed with you?',
];

export function getDailyPrompt(date = new Date()): string {
  const day = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return PROMPTS[Math.abs(day) % PROMPTS.length];
}
