import { describe, expect, it } from "vitest";
import { fallbackContent } from "../content/fallback";
import type { OSContent } from "../content/types";
import { complete, promptPath, runCommand } from "./terminal";

const content: OSContent = {
  ...fallbackContent,
  projects: [
    ...fallbackContent.projects,
    {
      id: "p2",
      slug: "old-thing",
      title: "Old thing",
      tags: [],
      archived: true,
      items: [],
    },
  ],
};

const run = (input: string, cwd: string[] = []) =>
  runCommand(input, { content, cwd, history: [], now: new Date(Date.UTC(2024, 0, 25, 18)) });
const text = (r: ReturnType<typeof run>) => r.lines.map((l) => l.text).join("\n");

describe("terminal", () => {
  it("lists commands with help", () => {
    expect(text(run("help"))).toContain("whoami");
  });

  it("opens the recruiter view in a new tab", () => {
    expect(run("recruiter").effects).toEqual([{ type: "openUrl", href: "/recruiter" }]);
  });

  it("navigates the virtual filesystem", () => {
    expect(text(run("ls"))).toContain("projects/");
    const cd = run("cd projects");
    expect(cd.cwd).toEqual(["projects"]);
    expect(promptPath(cd.cwd)).toBe("~/projects");
    expect(text(run("ls", cd.cwd))).toContain("moonos/");
    expect(run("cd ..", ["projects"]).cwd).toEqual([]);
    expect(run("cd ~", ["projects", "moonos"]).cwd).toEqual([]);
  });

  it("hides archived projects", () => {
    expect(text(run("ls projects"))).not.toContain("old-thing");
    expect(text(run("projects"))).not.toContain("old-thing");
  });

  it("cats notes and refuses directories", () => {
    expect(text(run("cat projects/moonos/README.txt"))).toContain("MoonOS");
    expect(run("cat projects").lines[0].tone).toBe("error");
  });

  it("opens projects, files and apps through effects", () => {
    expect(run("open moonos").effects[0]).toMatchObject({ type: "openProject", slug: "moonos" });
    expect(run("open projects/moonos").effects[0]).toMatchObject({ type: "openProject" });
    expect(run("open resume").effects[0]).toEqual({ type: "openApp", app: "cv" });
    expect(run("open projects/moonos/README.txt").effects[0]).toMatchObject({ type: "openItem" });
  });

  it("reports unknown commands", () => {
    const r = run("frobnicate");
    expect(r.lines[0]).toEqual({ text: "frobnicate: command not found. Type `help`.", tone: "error" });
  });

  it("has the hire-me easter egg", () => {
    const r = run("sudo hire-me");
    expect(text(r)).toContain("Access granted");
    expect(r.effects).toContainEqual({ type: "openApp", app: "mail" });
  });

  it("emits clear / exit effects", () => {
    expect(run("clear").effects).toEqual([{ type: "clear" }]);
    expect(run("exit").effects).toEqual([{ type: "exit" }]);
    expect(run("theme day").effects).toEqual([]);
  });

  it("completes commands and paths", () => {
    expect(complete("who", { content, cwd: [] })).toEqual(["whoami"]);
    expect(complete("cd pro", { content, cwd: [] })).toEqual(["projects/"]);
    expect(complete("cat projects/moo", { content, cwd: [] })).toEqual(["projects/moonos/"]);
  });
});
