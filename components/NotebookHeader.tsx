// src/components/notebook/NotebookHeader.tsx
"use client";
import { useState } from "react";
import { Notebook } from "../types";
import { useRouter } from "next/navigation";

interface Props {
  notebook: Notebook;
  onRename: (name: string) => void;
  onToggleSources: () => void;
  showSources: boolean;
  notebookId: string;
}

export function NotebookHeader({ notebook, onRename, onToggleSources, showSources, notebookId }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [nameValue, setNameValue] = useState(notebook.name);
  const [exporting, setExporting] = useState(false);

  async function handleRename() {
    if (nameValue.trim() && nameValue !== notebook.name) {
      onRename(nameValue.trim());
    }
    setEditing(false);
  }

  async function handleExport(format: "markdown" | "json") {
    setExporting(true);
    try {
      const res = await fetch(`/api/notebooks/${notebookId}/export?format=${format}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${notebook.name.replace(/[^a-z0-9]/gi, "_")}.${format === "json" ? "json" : "md"}`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }

  async function handleGenerateSummary() {
    router.push(`/dashboard/notebook/${notebookId}?mode=SUMMARIZE&auto=1`);
  }

  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card/30 shrink-0">
      {/* Notebook name */}
      <div className="flex items-center gap-2 min-w-0">
        {editing ? (
          <input
            autoFocus
            value={nameValue}
            onChange={(e) => setNameValue(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRename();
              if (e.key === "Escape") { setEditing(false); setNameValue(notebook.name); }
            }}
            className="text-sm font-semibold bg-background border border-ring rounded-md px-2 py-1 focus:outline-none w-64"
          />
        ) : (
          <button
            onClick={() => { setEditing(true); setNameValue(notebook.name); }}
            className="text-sm font-semibold hover:text-muted-foreground transition-colors truncate max-w-xs text-left"
            title="Click to rename"
          >
            {notebook.name}
          </button>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {/* Summary button */}
        <button
          onClick={handleGenerateSummary}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border border-border/50"
          title="Generate AI summary"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Summarize
        </button>

        {/* Export menu */}
        <div className="relative group">
          <button
            disabled={exporting}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border border-border/50 disabled:opacity-50"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
          <div className="absolute right-0 top-full mt-1 w-36 bg-card border border-border rounded-lg shadow-lg py-1 hidden group-hover:block z-50">
            <button onClick={() => handleExport("markdown")} className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors">
              📝 Markdown
            </button>
            <button onClick={() => handleExport("json")} className="w-full text-left px-3 py-1.5 text-xs hover:bg-accent transition-colors">
              🗂️ JSON
            </button>
          </div>
        </div>

        {/* Toggle sources panel */}
        <button
          onClick={onToggleSources}
          className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors border ${
            showSources
              ? "bg-accent text-accent-foreground border-border"
              : "text-muted-foreground border-border/50 hover:bg-accent hover:text-accent-foreground"
          }`}
          title="Toggle sources panel"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Sources
        </button>
      </div>
    </header>
  );
}