// src/hooks/useNotebooks.ts
"use client";
import { useState, useEffect, useCallback } from "react";
import { Notebook } from "../types";

export function useNotebooks() {
  const [notebooks, setNotebooks] = useState<Notebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotebooks = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notebooks");
      if (!res.ok) throw new Error("Failed to fetch notebooks");
      const data = await res.json();
      setNotebooks(data.notebooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotebooks();
  }, [fetchNotebooks]);

  const createNotebook = useCallback(async (name?: string, description?: string) => {
    const res = await fetch("/api/notebooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error("Failed to create notebook");
    const data = await res.json();
    setNotebooks((prev) => [data.notebook, ...prev]);
    return data.notebook as Notebook;
  }, []);

  const deleteNotebook = useCallback(async (id: string) => {
    const res = await fetch(`/api/notebooks/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("Failed to delete notebook");
    setNotebooks((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const renameNotebook = useCallback(async (id: string, name: string) => {
    const res = await fetch(`/api/notebooks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) throw new Error("Failed to rename notebook");
    const data = await res.json();
    setNotebooks((prev) =>
      prev.map((n) => (n.id === id ? { ...n, name: data.notebook.name } : n))
    );
    return data.notebook;
  }, []);

  return { notebooks, loading, error, fetchNotebooks, createNotebook, deleteNotebook, renameNotebook };
}