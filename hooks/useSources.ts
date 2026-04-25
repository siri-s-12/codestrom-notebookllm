// src/hooks/useSources.ts
"use client";
import { useState, useCallback } from "react";
import { Source, SourceType } from "../types";

export function useSources(notebookId: string) {
  const [sources, setSources] = useState<Source[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (file: File, type?: SourceType) => {
      setUploading(true);
      setError(null);
      setUploadProgress(`Processing ${file.name}...`);

      try {
        const formData = new FormData();
        formData.append("notebookId", notebookId);
        formData.append("file", file);
        formData.append("name", file.name);
        formData.append(
          "type",
          type || (file.type === "application/pdf" ? "PDF" : file.type.startsWith("audio/") ? "AUDIO" : "TEXT")
        );

        const res = await fetch("/api/sources", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }
        const data = await res.json();
        setSources((prev) => [...prev, data.source]);
        setUploadProgress("Indexing content...");
        // Wait a moment for ingestion to start
        await new Promise((r) => setTimeout(r, 1000));
        return data.source as Source;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        setError(msg);
        throw err;
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    },
    [notebookId]
  );

  const addURL = useCallback(
    async (url: string, type: "URL" | "YOUTUBE" = "URL", name?: string) => {
      setUploading(true);
      setError(null);
      setUploadProgress(`Fetching ${type === "YOUTUBE" ? "YouTube transcript" : "webpage"}...`);

      try {
        const res = await fetch("/api/sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notebookId, type, url, name }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to add source");
        }
        const data = await res.json();
        setSources((prev) => [...prev, data.source]);
        return data.source as Source;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to add source";
        setError(msg);
        throw err;
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    },
    [notebookId]
  );

  const addText = useCallback(
    async (content: string, name?: string) => {
      setUploading(true);
      setError(null);

      try {
        const res = await fetch("/api/sources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notebookId, type: "TEXT", content, name: name || "Pasted Text" }),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Failed to add text");
        }
        const data = await res.json();
        setSources((prev) => [...prev, data.source]);
        return data.source as Source;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Failed to add text";
        setError(msg);
        throw err;
      } finally {
        setUploading(false);
      }
    },
    [notebookId]
  );

  const deleteSource = useCallback(async (sourceId: string) => {
    const res = await fetch(`/api/sources/${sourceId}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete source");
    setSources((prev) => prev.filter((s) => s.id !== sourceId));
  }, []);

  const setSourcesToState = useCallback((newSources: Source[]) => {
    setSources(newSources);
  }, []);

  return {
    sources,
    uploading,
    uploadProgress,
    error,
    uploadFile,
    addURL,
    addText,
    deleteSource,
    setSources: setSourcesToState,
  };
}