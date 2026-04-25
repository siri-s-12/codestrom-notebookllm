// src/components/notebook/SourcesPanel.tsx
"use client";
import { useState, useRef } from "react";
import { useSources } from "../hooks/useSources";
import { getSourceIcon, getSourceColor, formatFileSize, isYouTubeUrl, isValidUrl } from "../lib/utils";

interface Props {
  sources: ReturnType<typeof useSources>;
  notebookId: string;
}

type AddMode = "file" | "url" | "youtube" | "text" | null;

export function SourcesPanel({ sources, notebookId }: Props) {
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [urlInput, setUrlInput] = useState("");
  const [textInput, setTextInput] = useState("");
  const [textName, setTextName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      try { await sources.uploadFile(file); }
      catch { /* error shown via sources.error */ }
    }
    if (fileRef.current) fileRef.current.value = "";
    setAddMode(null);
  }

  async function handleAddUrl() {
    if (!urlInput.trim() || !isValidUrl(urlInput)) return;
    const isYT = isYouTubeUrl(urlInput);
    try {
      await sources.addURL(urlInput, isYT ? "YOUTUBE" : "URL");
      setUrlInput("");
      setAddMode(null);
    } catch {}
  }

  async function handleAddText() {
    if (!textInput.trim()) return;
    try {
      await sources.addText(textInput, textName || "Pasted Text");
      setTextInput("");
      setTextName("");
      setAddMode(null);
    } catch {}
  }

  return (
    <div className="flex flex-col h-full bg-card/20">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/50">
        <h3 className="text-sm font-semibold">Sources</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {sources.sources.length} source{sources.sources.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Add source buttons */}
      <div className="p-3 border-b border-border/30 space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { mode: "file" as AddMode, icon: "📄", label: "File" },
            { mode: "url" as AddMode, icon: "🌐", label: "Website" },
            { mode: "youtube" as AddMode, icon: "▶️", label: "YouTube" },
            { mode: "text" as AddMode, icon: "📝", label: "Paste text" },
          ].map((btn) => (
            <button
              key={btn.mode}
              onClick={() => {
                setAddMode(addMode === btn.mode ? null : btn.mode);
                if (btn.mode === "file") fileRef.current?.click();
              }}
              disabled={sources.uploading}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors border disabled:opacity-50
                ${addMode === btn.mode
                  ? "bg-accent text-accent-foreground border-border"
                  : "border-border/50 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
            >
              <span>{btn.icon}</span>
              {btn.label}
            </button>
          ))}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,.txt,.md,.doc,.docx,audio/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />

        {/* URL/YouTube input */}
        {(addMode === "url" || addMode === "youtube") && (
          <div className="space-y-2">
            <input
              autoFocus
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder={addMode === "youtube" ? "https://youtube.com/watch?v=..." : "https://example.com"}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
            />
            <button
              onClick={handleAddUrl}
              disabled={sources.uploading || !urlInput.trim()}
              className="w-full rounded-lg bg-primary text-primary-foreground py-1.5 text-xs font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
            >
              {sources.uploading ? sources.uploadProgress || "Processing..." : "Add Source"}
            </button>
          </div>
        )}

        {/* Text paste input */}
        {addMode === "text" && (
          <div className="space-y-2">
            <input
              type="text"
              value={textName}
              onChange={(e) => setTextName(e.target.value)}
              placeholder="Source name (optional)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <textarea
              autoFocus
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Paste your text here..."
              rows={5}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs resize-none focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <button
              onClick={handleAddText}
              disabled={sources.uploading || !textInput.trim()}
              className="w-full rounded-lg bg-primary text-primary-foreground py-1.5 text-xs font-medium disabled:opacity-50 transition-opacity hover:opacity-90"
            >
              {sources.uploading ? "Processing..." : "Add Text"}
            </button>
          </div>
        )}

        {/* Upload progress */}
        {sources.uploading && addMode === null && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
            <span className="w-3 h-3 border border-border border-t-primary rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">{sources.uploadProgress || "Processing..."}</span>
          </div>
        )}

        {/* Error */}
        {sources.error && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-xs text-destructive">
            {sources.error}
          </div>
        )}
      </div>

      {/* Sources list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {sources.sources.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-muted-foreground">No sources yet.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Add files, URLs, or text above.</p>
          </div>
        ) : (
          sources.sources.map((source) => (
            <div
              key={source.id}
              className="group flex items-start gap-2.5 rounded-lg border border-border/50 bg-card/50 p-2.5 hover:bg-card transition-colors"
            >
              <span className="text-base leading-none mt-0.5 shrink-0">{getSourceIcon(source.type)}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium truncate">{source.name}</div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`source-badge text-[10px] px-1.5 py-0.5 ${getSourceColor(source.type)}`}>
                    {source.type}
                  </span>
                  {source.fileSize && (
                    <span className="text-[10px] text-muted-foreground/60">
                      {formatFileSize(source.fileSize)}
                    </span>
                  )}
                </div>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400/70 hover:text-blue-400 truncate block mt-0.5 transition-colors"
                  >
                    {source.url}
                  </a>
                )}
              </div>
              <button
                onClick={() => sources.deleteSource(source.id)}
                className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-all shrink-0"
                title="Remove source"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}