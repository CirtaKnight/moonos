import { describe, expect, it } from "vitest";
import { buildTree, isViewable, languageOf } from "./sourceTree";

describe("buildTree", () => {
  it("nests paths with folders first, alphabetically", () => {
    const tree = buildTree([
      { name: "/README.md", size: 10 },
      { name: "/src/os/OS.tsx", size: 20 },
      { name: "/src/app/page.tsx", size: 5 },
      { name: "/package.json", size: 3 },
    ]);
    expect(tree.map((n) => n.name)).toEqual(["src", "package.json", "README.md"]);
    const src = tree[0];
    expect(src.children!.map((n) => n.path)).toEqual(["src/app", "src/os"]);
    expect(src.children![1].children![0]).toEqual({ name: "OS.tsx", path: "src/os/OS.tsx", type: "file", size: 20 });
  });
});

describe("file helpers", () => {
  it("maps extensions to languages", () => {
    expect(languageOf("a/b.tsx")).toBe("typescript");
    expect(languageOf("README.md")).toBe("markdown");
    expect(languageOf("LICENSE")).toBe("plaintext");
  });
  it("skips binaries and huge files", () => {
    expect(isViewable("icon.png")).toBe(false);
    expect(isViewable("big.ts", 500_000)).toBe(false);
    expect(isViewable("ok.ts", 1000)).toBe(true);
  });
});
