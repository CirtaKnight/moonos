"use client";

import { motion } from "motion/react";
import { Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { MoonGlyph } from "../components/MoonGlyph";
import { useContent } from "../content/ContentProvider";
import { LIMITS, validateContact, type ContactErrors } from "../lib/contact";
import { play } from "../lib/sound";
import type { AppProps } from "./types";
import { Button, Scroll } from "./ui";

type Status = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string };

export function Mail(_props: AppProps) {
  void _props;
  const { profile } = useContent();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "", website: "" });
  const [errors, setErrors] = useState<ContactErrors>({});
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const check = validateContact(form);
    if (!check.ok) {
      setErrors(check.errors);
      play("error");
      return;
    }
    setStatus({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatus({ kind: "sent" });
        play("notify");
      } else if (data.errors) {
        setErrors(data.errors);
        setStatus({ kind: "idle" });
      } else {
        setStatus({ kind: "error", message: data.error ?? "Something went wrong." });
        play("error");
      }
    } catch {
      setStatus({ kind: "error", message: "Network error — are you offline?" });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="grid h-full place-items-center p-8 text-center">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex max-w-xs flex-col items-center gap-3">
          <MoonGlyph phase={0.5} size={52} className="text-gold" />
          <h3 className="text-lg font-semibold text-fg">Message sent</h3>
          <p className="text-sm text-muted">Thanks, {form.name.split(" ")[0]}. I&apos;ll reply to {form.email} as soon as I can.</p>
          <Button onClick={() => { setForm({ name: "", email: "", subject: "", message: "", website: "" }); setStatus({ kind: "idle" }); }}>
            Write another
          </Button>
        </motion.div>
      </div>
    );
  }

  const field =
    "w-full rounded-lg border bg-surface-2 px-3 py-2 text-sm text-fg placeholder:text-faint transition-colors focus:border-accent focus:outline-none";

  return (
    <Scroll>
      <form onSubmit={onSubmit} noValidate className="flex min-h-full flex-col">
        <div className="border-b border-line px-5 py-3 text-sm">
          <span className="text-muted">To: </span>
          <span className="text-fg">{profile.name}</span>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Your name" error={errors.name}>
              <input value={form.name} onChange={set("name")} maxLength={LIMITS.name} autoComplete="name" className={`${field} ${errors.name ? "border-danger" : "border-line"}`} />
            </Field>
            <Field label="Your email" error={errors.email}>
              <input type="email" value={form.email} onChange={set("email")} maxLength={LIMITS.email} autoComplete="email" className={`${field} ${errors.email ? "border-danger" : "border-line"}`} />
            </Field>
          </div>
          <Field label="Subject (optional)" error={errors.subject}>
            <input value={form.subject} onChange={set("subject")} maxLength={LIMITS.subject} placeholder="Internship, project, coffee…" className={`${field} border-line`} />
          </Field>
          <Field label="Message" error={errors.message}>
            <textarea value={form.message} onChange={set("message")} maxLength={LIMITS.message} rows={7} className={`${field} min-h-36 resize-none ${errors.message ? "border-danger" : "border-line"}`} />
          </Field>
          {/* Honeypot — hidden from humans and assistive tech */}
          <input tabIndex={-1} aria-hidden autoComplete="off" value={form.website} onChange={set("website")} className="absolute -left-[9999px] h-0 w-0 opacity-0" name="website" />
          {status.kind === "error" && (
            <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-xs text-danger">
              {status.message}
              {profile.email && (
                <> You can also write to <a className="underline" href={`mailto:${profile.email}`}>{profile.email}</a>.</>
              )}
            </p>
          )}
          <div className="mt-auto flex justify-end pt-2">
            <button
              type="submit"
              disabled={status.kind === "sending"}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-medium text-accent-ink transition-colors hover:bg-accent-strong disabled:opacity-60"
            >
              <Send size={15} /> {status.kind === "sending" ? "Sending…" : "Send"}
            </button>
          </div>
        </div>
      </form>
    </Scroll>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs text-muted">{label}</span>
      {children}
      {error && <span className="text-xs text-danger">{error}</span>}
    </label>
  );
}
