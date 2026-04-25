// src/app/dashboard/page.tsx
"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useNotebooks } from "../../hooks/useNotebooks";

export default function DashboardPage() {
  const router = useRouter();
  const { createNotebook } = useNotebooks();
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    setCreating(true);
    try {
      const notebook = await createNotebook("Untitled Notebook");
      router.push(`/dashboard/notebook/${notebook.id}`);
    } catch {
      setCreating(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center h-full text-center p-8">
      <div className="max-w-md space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-3xl mx-auto">
          C
        </div>
        <div>
          <h2 className="text-2xl font-bold mb-2">Select or create a notebook</h2>
          <p className="text-muted-foreground text-sm">
            Choose a notebook from the sidebar, or start a new one to begin researching with AI.
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {creating ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Creating...
            </>
          ) : (
            <>+ New Notebook</>
          )}
        </button>

        <div className="grid grid-cols-3 gap-3 pt-4">
          {["📄 Upload PDFs", "▶️ YouTube", "🌐 Websites"].map((f) => (
            <div key={f} className="glass-card rounded-lg p-3 text-xs text-muted-foreground">
              {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}