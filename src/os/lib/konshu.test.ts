import { describe, expect, it } from "vitest";
import { fallbackContent } from "../content/fallback";
import { extractActions, localAnswer } from "./konshu";

const ask = (q: string) => localAnswer(q, fallbackContent, new Date("2026-11-11"));

describe("Konshu local brain", () => {
  it("greets and explains itself", () => {
    expect(ask("hello").text).toMatch(/Konshu/);
    expect(ask("who are you?").text).toMatch(/moon-watcher/);
  });

  it("answers about projects with actions", () => {
    const r = ask("Show me your projects");
    expect(r.confident).toBe(true);
    expect(r.text).toMatch(/MoonOS/);
    expect(r.actions.some((a) => a.type === "project")).toBe(true);
  });

  it("routes contact and CV questions to the right apps", () => {
    expect(ask("How can I contact you?").actions[0]).toMatchObject({ type: "app", app: "mail" });
    expect(ask("Can I see your résumé?").actions[0]).toMatchObject({ type: "app", app: "cv" });
  });

  it("sends recruiters in a hurry to the one-page view", () => {
    expect(ask("I'm a recruiter, give me a quick overview").actions[0]).toMatchObject({ type: "url", href: "/recruiter" });
    expect(ask("tl;dr?").actions[0]).toMatchObject({ type: "url", href: "/recruiter" });
  });

  it("explains apps by name", () => {
    expect(ask("what is moonword").actions[0]).toMatchObject({ app: "moonword" });
    expect(ask("open the terminal").actions[0]).toMatchObject({ app: "terminal" });
  });

  it("recognises a project by name", () => {
    expect(ask("tell me more about moonos").actions[0]).toMatchObject({ type: "project", slug: "moonos" });
  });

  it("hands unknown questions to the remote model", () => {
    expect(ask("what's your favourite sorting algorithm and why").confident).toBe(false);
  });
});

describe("extractActions", () => {
  it("pulls action tokens out of model text", () => {
    const r = extractActions("Have a look! [[project:moonos]] [[app:map]] [[url:https://github.com/CirtaKnight]] [[project:nope]]", fallbackContent);
    expect(r.text).toBe("Have a look!");
    expect(r.actions.map((a) => a.type)).toEqual(["project", "app", "url"]);
  });
});
