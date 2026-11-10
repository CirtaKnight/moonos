import { describe, expect, it } from "vitest";
import { escapeHtml, validateContact } from "./contact";

const valid = { name: "Ada", email: "ada@example.com", subject: "Hi", message: "Loved the terminal easter eggs!" };

describe("validateContact", () => {
  it("accepts a valid message and trims fields", () => {
    const r = validateContact({ ...valid, name: "  Ada  " });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.name).toBe("Ada");
  });

  it("reports each invalid field", () => {
    const r = validateContact({ name: "", email: "nope", message: "short" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["email", "message", "name"]);
  });

  it("survives garbage input", () => {
    expect(validateContact(null).ok).toBe(false);
    expect(validateContact({ name: 42 }).ok).toBe(false);
  });
});

describe("escapeHtml", () => {
  it("escapes markup", () => {
    expect(escapeHtml(`<b>"x" & 'y'</b>`)).toBe("&lt;b&gt;&quot;x&quot; &amp; &#39;y&#39;&lt;/b&gt;");
  });
});
