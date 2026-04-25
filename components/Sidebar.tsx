// src/components/sidebar/Sidebar.tsx
"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { useNotebooks } from "../hooks/useNotebooks";
import { formatDate, truncate } from "../lib/utils";
import { Notebook } from "../types";

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null; id?: string };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { notebooks, loading, createNotebook, deleteNotebook, renameNotebook } = useNotebooks();
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [collapsed, setCollapsed] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      const nb = await createNotebook();
      router.push(`/dashboard/notebook/${nb.id}`);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Delete this notebook and all its data?")) return;
    await deleteNotebook(id);
    if (pathname.includes(id)) router.push("/dashboard");
  }

  async function handleRename(id: string) {
    if (renameValue.trim()) await renameNotebook(id, renameValue.trim());
    setRenamingId(null);
  }

  function startRename(e: React.MouseEvent, nb: Notebook) {
    e.preventDefault();
    e.stopPropagation();
    setRenamingId(nb.id);
    setRenameValue(nb.name);
  }

  if (collapsed) {
    return (
      <aside className="w-12 border-r border-border flex flex-col items-center py-4 gap-4 bg-card/50">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title="Expand sidebar"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <button
          onClick={handleCreate}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title="New Notebook"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-border flex flex-col bg-card/30 shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border/50">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-base tracking-tight hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold">
            C
          </div>
          CORELLM
        </Link>
        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* New notebook button */}
      <div className="px-3 py-3">
        <button
          onClick={handleCreate}
          disabled={creating}
          className="w-full flex items-center gap-2 rounded-lg border border-dashed border-border/70 px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground hover:border-solid transition-all disabled:opacity-50"
        >
          {creating ? (
            <span className="w-3.5 h-3.5 border border-border border-t-muted-foreground rounded-full animate-spin" />
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          )}
          New Notebook
        </button>
      </div>

      {/* Notebooks list */}
      <div className="flex-1 overflow-y-auto px-3 space-y-0.5 pb-4">
        {loading ? (
          <div className="space-y-1.5 pt-1">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-9 rounded-lg shimmer" />
            ))}
          </div>
        ) : notebooks.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8 px-4">
            No notebooks yet. Create one to get started.
          </p>
        ) : (
          notebooks.map((nb) => {
            const isActive = pathname.includes(nb.id);
            const isRenaming = renamingId === nb.id;

            return (
              <div key={nb.id} className="group relative">
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(nb.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRename(nb.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    className="w-full rounded-lg border border-ring bg-accent px-3 py-2 text-sm focus:outline-none"
                  />
                ) : (
                  <Link
                    href={`/dashboard/notebook/${nb.id}`}
                    className={`sidebar-item w-full ${isActive ? "active" : ""}`}
                  >
                    <span className="text-base leading-none shrink-0">📓</span>
                    <div className="flex-1 min-w-0">
                      <div className="truncate text-sm font-medium">{truncate(nb.name, 28)}</div>
                      <div className="text-xs text-muted-foreground/70 mt-0.5">
                        {(nb as unknown as { _count?: { sources: number; messages: number } })._count?.sources ?? 0} sources · {formatDate(nb.updatedAt)}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                      <button
                        onClick={(e) => startRename(e, nb)}
                        className="p-1 rounded hover:bg-background/50 text-muted-foreground hover:text-foreground transition-colors"
                        title="Rename"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, nb.id)}
                        className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </Link>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* User footer */}
      <div className="border-t border-border/50 px-3 py-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{user.name || "User"}</div>
            <div className="text-xs text-muted-foreground truncate">{user.email}</div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
            title="Sign out"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}