// ── Client-side content moderation ───────────────────────────────────────────
// Runs instantly in the browser before any network call.
// Catches: PII (emails, phone numbers), spam/link flooding, bad file types.
// Server-side checks (OpenAI + Google Vision) run after these pass.

export interface ModerationResult {
  safe:    boolean;
  reason?: string;  // user-facing message if not safe
}

// ── PII patterns ──────────────────────────────────────────────────────────────
const PII: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b/,
    reason: "Please don't share email addresses.",
  },
  {
    // Matches most international phone formats: +1 (555) 123-4567 / 07911 123456 etc.
    pattern: /(\+?\d[\s.\-]?)?\(?\d{3}\)?[\s.\-]?\d{3}[\s.\-]\d{4}/,
    reason: "Please don't share phone numbers.",
  },
  {
    // US Social Security Numbers
    pattern: /\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b/,
    reason: "Please don't share personal ID numbers.",
  },
  {
    // Street address pattern: "123 Main Street", "45 Elm Ave"
    pattern: /\b\d{1,5}\s+\w+\s+(street|st|avenue|ave|road|rd|drive|dr|lane|ln|blvd|boulevard|way|place|pl)\b/i,
    reason: "Please don't share home addresses.",
  },
];

// ── Spam / self-promotion heuristics ─────────────────────────────────────────
const URL_RE = /https?:\/\/[^\s]+/gi;

function isSpam(text: string): string | null {
  // More than 2 URLs = link dump / self-promotion
  const urls = text.match(URL_RE) ?? [];
  if (urls.length > 2) return 'Too many links — this looks like self-promotion.';

  // Excessive repetition: if >15 words and unique-word ratio < 30%
  const words = text.trim().toLowerCase().split(/\s+/);
  if (words.length > 15) {
    const unique = new Set(words);
    if (unique.size / words.length < 0.30) return 'Content seems repetitive.';
  }

  // All-caps shouting (>70% uppercase letters, >20 chars)
  if (text.length > 20) {
    const letters = text.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 10 && (letters.replace(/[a-z]/g, '').length / letters.length) > 0.70) {
      return 'Please avoid writing in all caps.';
    }
  }

  return null;
}

// ── Text moderation (client-side pass) ───────────────────────────────────────
export function moderateTextLocally(text: string): ModerationResult {
  if (!text || !text.trim()) return { safe: true };

  for (const { pattern, reason } of PII) {
    if (pattern.test(text)) return { safe: false, reason };
  }

  const spamReason = isSpam(text);
  if (spamReason) return { safe: false, reason: spamReason };

  return { safe: true };
}

// ── File moderation (client-side pass) ───────────────────────────────────────
const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/heic',
  'image/heif',
]);

const MAX_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

export function moderateFile(file: File): ModerationResult {
  if (!ALLOWED_MIME.has(file.type.toLowerCase())) {
    return { safe: false, reason: 'Only JPEG, PNG, WebP, GIF, or HEIC images are allowed.' };
  }
  if (file.size > MAX_FILE_BYTES) {
    return { safe: false, reason: 'Image must be under 8 MB.' };
  }
  // Reject suspiciously tiny files (< 1 KB — likely corrupt or a trick)
  if (file.size < 1024) {
    return { safe: false, reason: 'That image looks corrupted — please try another.' };
  }
  return { safe: true };
}

// ── Collect all text fields from a post into one string for server moderation ─
export function extractTextFromPost(data: {
  content?: string;
  name?: string;
  description?: string;
  caption?: string;
  title?: string;
  attribution?: string;
}): string {
  return [data.content, data.name, data.description, data.caption, data.title, data.attribution]
    .filter(Boolean)
    .join(' ');
}
