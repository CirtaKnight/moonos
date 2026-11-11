export interface TreeNode {
  name: string;
  path: string;
  type: "dir" | "file";
  size?: number;
  children?: TreeNode[];
}

/** Build a sorted tree (folders first) from flat paths like "/src/app/page.tsx". */
export function buildTree(files: { name: string; size?: number }[]): TreeNode[] {
  const root: TreeNode = { name: "", path: "", type: "dir", children: [] };
  for (const f of files) {
    const parts = f.name.replace(/^\/+/, "").split("/").filter(Boolean);
    let node = root;
    parts.forEach((part, i) => {
      const path = parts.slice(0, i + 1).join("/");
      const isFile = i === parts.length - 1;
      let child = node.children!.find((c) => c.name === part);
      if (!child) {
        child = isFile ? { name: part, path, type: "file", size: f.size } : { name: part, path, type: "dir", children: [] };
        node.children!.push(child);
      }
      node = child;
    });
  }
  const sort = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => (a.type === b.type ? a.name.localeCompare(b.name) : a.type === "dir" ? -1 : 1));
    nodes.forEach((n) => n.children && sort(n.children));
  };
  sort(root.children!);
  return root.children!;
}

const LANG: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  js: "javascript",
  mjs: "javascript",
  jsx: "javascript",
  json: "json",
  css: "css",
  md: "markdown",
  yml: "yaml",
  yaml: "yaml",
  toml: "toml",
  sh: "shell",
  html: "html",
  svg: "html",
};

export function languageOf(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return LANG[ext] ?? "plaintext";
}

/** Binary / huge files aren't worth rendering as text. */
export function isViewable(path: string, size = 0) {
  return !/\.(png|jpe?g|gif|webp|ico|woff2?|ttf|zip|pdf|mp4|mp3)$/i.test(path) && size <= 200_000;
}
