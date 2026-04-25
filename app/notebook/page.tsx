// src/app/dashboard/notebook/[id]/page.tsx
"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ChatPanel } from "../../components/ChatPanel";
import { SourcesPanel } from "../../components/SourcesPanel";
import { NotebookHeader } from "../../components/NotebookHeader";
import { useChat } from "../../hooks/useChat";
import { useSources } from "../../hooks/useSources";
import { Notebook } from "../../types";

export default function NotebookPage() {
  const params = useParams();
  const notebookId = params.id as string;

  const [notebook, setNotebook] = useState<Notebook | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSources, setShowSources] = useState(true);

  const chat = useChat({ notebookId });
  const sources = useSources(notebookId);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/notebooks/${notebookId}`);
        if (!res.ok) return;
        const data = await res.json();
        setNotebook(data.notebook);
        sources.setSources(data.notebook.sources || []);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [notebookId]);

  useEffect(() => {
    chat.loadHistory();
  }, [notebookId]);

  const handleRename = async (name: string) => {
    const res = await fetch(`/api/notebooks/${notebookId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (res.ok) {
      const data = await res.json();
      setNotebook((prev: Notebook | null) => prev ? { ...prev, name: data.notebook.name } : prev);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="w-6 h-6 border-2 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!notebook) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Notebook not found.
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <NotebookHeader
        notebook={notebook}
        onRename={handleRename}
        onToggleSources={() => setShowSources((v) => !v)}
        showSources={showSources}
        notebookId={notebookId}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className={`flex-1 flex flex-col overflow-hidden ${showSources ? "border-r border-border" : ""}`}>
          <ChatPanel chat={chat} notebookId={notebookId} />
        </div>

        {/* Sources panel */}
        {showSources && (
          <div className="w-80 shrink-0 overflow-y-auto">
            <SourcesPanel sources={sources} notebookId={notebookId} />
          </div>
        )}
      </div>
    </div>
  );
}
