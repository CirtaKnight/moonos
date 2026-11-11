"use client";

import { Check, LoaderCircle, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { LIMITS, validateContact, type ContactErrors } from "@/os/lib/contact";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

/**
 * The recruiter page's closing beat: write to the owner without leaving the page
 * (the same /api/contact endpoint as the Mail app).
 */
export function RecruiterContact({ name, fallbackHref }: { name: string; fallbackHref?: string }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<ContactErrors>({});

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = Object.fromEntries(form.entries());
    // Same rules as the server, so mistakes show up instantly and next to their field.
    const check = validateContact(body);
    if (!check.ok) {
      setErrors(check.errors);
      setStatus({ kind: "idle" });
      return;
    }
    setStatus({ kind: "sending" });
    setErrors({});
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ kind: "sent" });
        return;
      }
      if (res.status === 422 && data.errors) {
        setErrors(data.errors);
        setStatus({ kind: "idle" });
        return;
      }
      setStatus({
        kind: "error",
        message:
          res.status === 503
            ? "Messages can't be delivered from here yet."
            : (data.error ?? "That didn't go through. Please try again in a moment."),
      });
    } catch {
      setStatus({ kind: "error", message: "You seem to be offline. Please try again in a moment." });
    }
  }

  if (status.kind === "sent") {
    return (
      <p role="status" className="flex items-center gap-2 rounded-2xl border border-success/40 bg-success/10 px-4 py-3 text-sm text-fg">
        <Check size={16} className="text-success" /> Sent. {name} will reply to the address you gave.
      </p>
    );
  }

  const field = "w-full rounded-xl border border-line bg-surface-2 px-3.5 py-2.5 text-sm text-fg placeholder:text-faint focus:border-accent focus:outline-none";
  return (
    <form onSubmit={submit} noValidate className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5 text-sm text-muted">
        Your name
        <input name="name" required maxLength={LIMITS.name} autoComplete="name" className={field} aria-invalid={!!errors.name} />
        {errors.name && <span className="text-xs text-danger">{errors.name}</span>}
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-muted">
        Work email
        <input name="email" type="email" required maxLength={LIMITS.email} autoComplete="email" className={field} aria-invalid={!!errors.email} />
        {errors.email && <span className="text-xs text-danger">{errors.email}</span>}
      </label>
      <label className="flex flex-col gap-1.5 text-sm text-muted sm:col-span-2">
        Message
        <textarea
          name="message"
          required
          rows={4}
          maxLength={LIMITS.message}
          placeholder="The role, the team, and how to reach you."
          className={`${field} resize-y`}
          aria-invalid={!!errors.message}
        />
        {errors.message && <span className="text-xs text-danger">{errors.message}</span>}
      </label>
      {/* Honeypot for bots; hidden from people and assistive tech. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      <input type="hidden" name="subject" value="Recruiter view" />
      <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
        <button
          type="submit"
          disabled={status.kind === "sending"}
          className="inline-flex h-11 items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-[#1a1406] shadow-[0_6px_16px_-6px_rgb(200_169_111/0.6)] transition-colors hover:bg-[#dcc08a] disabled:opacity-60"
        >
          {status.kind === "sending" ? <LoaderCircle size={16} className="animate-spin" /> : <Send size={15} />}
          {status.kind === "sending" ? "Sending…" : "Send message"}
        </button>
        {status.kind === "error" && (
          <p role="alert" className="text-sm text-muted">
            {status.message}{" "}
            {fallbackHref && (
              <a href={fallbackHref} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-4">
                Reach out here instead.
              </a>
            )}
          </p>
        )}
      </div>
    </form>
  );
}
