"use client";

import { ArrowUpRight, ChevronRight, FileCode2, Folder, FolderOpen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { highlight, type LanguageName } from "sugar-high";
import { MoonPhaseLoader } from "../components/MoonPhaseLoader";
import { useContent } from "../content/ContentProvider";
import { githubUser, SOURCE_REPO } from "../lib/links";
import { buildTree, isViewable, languageOf, type TreeNode } from "../lib/sourceTree";
import type { AppProps } from "./types";
import { EmptyState } from "./ui";

/** jsDelivr mirrors public GitHub repos with no API rate limit (cached ~12h per branch). */
const listUrl = (repo: string) => `https://data.jsdelivr.com/v1/packages/gh/${repo}@main?structure=flat`;
const fileUrl = (repo: string, path: string) => `https://cdn.jsdelivr.net/gh/${repo}@main/${path}`;

type FileState = { path: string; status: "loading" } | { path: string; status: "ready"; html: string; lines: number } | { path: string; status: "error"; message: string };

/** Read-only explorer for MoonOS's own source code. */
export function Source(_props: AppProps) {
  void _props;
  const content = useContent();
  const repo = `${githubUser(content)}/${SOURCE_REPO}`;
  const [tree, setTree] = useState<TreeNode[] | null>(null);
  const [treeError, setTreeError] = useState(false);
  const [open, setOpen] = useState<Set<string>>(() => new Set(["src", "src/os"]));
  const [file, setFile] = useState<FileState | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    fetch(listUrl(repo), { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { files?: { name: string; size: number }[] }) => setTree(buildTree(d.files ?? [])))
      .catch((e) => {
        if (e?.name !== "AbortError") setTreeError(true);
      });
    return () => ctrl.abort();
  }, [repo]);

  async function view(node: TreeNode) {
    if (!isViewable(node.path, node.size)) {
      setFile({ path: node.path, status: "error", message: "Binary or very large file — open it on GitHub instead." });
      return;
    }
    setFile({ path: node.path, status: "loading" });
    try {
      const res = await fetch(fileUrl(repo, node.path));
      if (!res.ok) throw new Error(String(res.status));
      const text = await res.text();
      setFile({ path: node.path, status: "ready", html: highlight(text, { lang: languageOf(node.path) as LanguageName }), lines: text.split("\n").length });
    } catch {
      setFile({ path: node.path, status: "error", message: "Couldn't load this file. Try again in a moment." });
    }
  }

  // Open the README first.
  useEffect(() => {
    if (!tree || file) return;
    const readme = tree.find((n) => n.type === "file" && /^readme\.md$/i.test(n.name));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- kicks off an async load once the tree arrives
    if (readme) void view(readme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree]);

  const toggle = (path: string) =>
    setOpen((s) => {
      const n = new Set(s);
      if (n.has(path)) n.delete(path);
      else n.add(path);
      return n;
    });

  const crumbs = useMemo(() => (file ? file.path.split("/") : []), [file]);

  if (treeError) {
    return <EmptyState title="Source unavailable">The code mirror couldn&apos;t be reached. It lives at github.com/{repo}.</EmptyState>;
  }

  return (
    <div className="flex h-full">
      <nav aria-label="Files" className="scroll-area w-56 shrink-0 border-r border-line bg-surface-2 py-2 text-[13px]">
        {!tree ? (
          <div className="grid h-full place-items-center">
            <MoonPhaseLoader size={12} />
          </div>
        ) : (
          <Tree nodes={tree} depth={0} open={open} toggle={toggle} active={file?.path} onView={view} />
        )}
      </nav>
      <section className="flex min-w-0 flex-1 flex-col bg-[#05070d]">
        <header className="flex shrink-0 items-center gap-2 border-b border-white/10 px-3 py-2 font-mono text-xs text-[#8c94a8]">
          <span className="truncate">
            {repo}
            {crumbs.map((c, i) => (
              <span key={i}>
                <span className="mx-1 text-[#4b5366]">/</span>
                <span className={i === crumbs.length - 1 ? "text-[#e9ecf3]" : ""}>{c}</span>
              </span>
            ))}
          </span>
          <a
            href={file ? `https://github.com/${repo}/blob/main/${file.path}` : `https://github.com/${repo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-[#bccbeb] hover:bg-white/10"
          >
            GitHub <ArrowUpRight size={12} />
          </a>
        </header>
        <div className="scroll-area selectable min-h-0 flex-1">
          {!file || file.status === "loading" ? (
            <div className="grid h-full place-items-center">
              <MoonPhaseLoader size={12} />
            </div>
          ) : file.status === "error" ? (
            <p className="p-6 text-sm text-[#8c94a8]">{file.message}</p>
          ) : (
            <pre className="moon-code py-3 font-mono text-[12.5px] leading-[1.6]">
              <code dangerouslySetInnerHTML={{ __html: file.html }} />
            </pre>
          )}
        </div>
      </section>
    </div>
  );
}

function Tree({
  nodes,
  depth,
  open,
  toggle,
  active,
  onView,
}: {
  nodes: TreeNode[];
  depth: number;
  open: Set<string>;
  toggle: (p: string) => void;
  active?: string;
  onView: (n: TreeNode) => void;
}) {
  return (
    <ul>
      {nodes.map((n) => {
        const isOpen = open.has(n.path);
        return (
          <li key={n.path}>
            <button
              type="button"
              onClick={() => (n.type === "dir" ? toggle(n.path) : onView(n))}
              aria-expanded={n.type === "dir" ? isOpen : undefined}
              className={`flex w-full items-center gap-1.5 py-1 pr-2 text-left transition-colors hover:bg-surface-hover ${
                active === n.path ? "bg-accent/15 text-fg" : "text-muted"
              }`}
              style={{ paddingLeft: 8 + depth * 12 }}
            >
              {n.type === "dir" ? (
                <>
                  <ChevronRight size={12} className={`shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                  {isOpen ? <FolderOpen size={14} className="shrink-0 text-accent" /> : <Folder size={14} className="shrink-0 text-accent" />}
                </>
              ) : (
                <FileCode2 size={14} className="ml-[18px] shrink-0 text-faint" />
              )}
              <span className="truncate">{n.name}</span>
            </button>
            {n.type === "dir" && isOpen && n.children && (
              <Tree nodes={n.children} depth={depth + 1} open={open} toggle={toggle} active={active} onView={onView} />
            )}
          </li>
        );
      })}
    </ul>
  );
}
