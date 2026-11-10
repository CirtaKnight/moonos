export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
  /** Honeypot: humans never fill it. */
  website?: string;
}

export const LIMITS = { name: 80, email: 120, subject: 120, message: 4000 } as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type ContactErrors = Partial<Record<keyof ContactInput, string>>;

export function validateContact(raw: unknown): { ok: true; data: ContactInput } | { ok: false; errors: ContactErrors } {
  const r = (raw ?? {}) as Record<string, unknown>;
  const str = (k: string) => (typeof r[k] === "string" ? (r[k] as string).trim() : "");
  const data: ContactInput = {
    name: str("name"),
    email: str("email"),
    subject: str("subject"),
    message: str("message"),
    website: str("website"),
  };
  const errors: ContactErrors = {};
  if (!data.name) errors.name = "Please tell me your name.";
  else if (data.name.length > LIMITS.name) errors.name = "That name is a bit long.";
  if (!EMAIL_RE.test(data.email) || data.email.length > LIMITS.email) errors.email = "That email doesn't look right.";
  if (data.subject.length > LIMITS.subject) errors.subject = "Subject is too long.";
  if (data.message.length < 10) errors.message = "A few more words, please (10+ characters).";
  else if (data.message.length > LIMITS.message) errors.message = `Keep it under ${LIMITS.message} characters.`;
  return Object.keys(errors).length ? { ok: false, errors } : { ok: true, data };
}

export function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
