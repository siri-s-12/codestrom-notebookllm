// src/app/api/notebooks/[id]/export/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db/prisma";
import { requireAuth } from "../../../lib/auth/getSession";

export const runtime = "nodejs";

// GET /api/notebooks/:id/export?format=json|markdown
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const format = searchParams.get("format") || "markdown";

  const notebook = await prisma.notebook.findFirst({
    where: { id: params.id, userId: session!.user.id },
    include: {
      sources: { orderBy: { createdAt: "asc" } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!notebook) return NextResponse.json({ error: "Notebook not found" }, { status: 404 });

  if (format === "json") {
    const exportData = {
      notebook: {
        id: notebook.id,
        name: notebook.name,
        description: notebook.description,
        createdAt: notebook.createdAt,
        exportedAt: new Date(),
      },
      sources: notebook.sources.map((s) => ({
        name: s.name,
        type: s.type,
        url: s.url,
        contentLength: s.content.length,
        createdAt: s.createdAt,
      })),
      conversation: notebook.messages.map((m) => ({
        role: m.role,
        content: m.content,
        mode: m.mode,
        timestamp: m.createdAt,
        suggestions: m.suggestions,
      })),
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="${notebook.name.replace(/[^a-z0-9]/gi, "_")}.json"`,
      },
    });
  }

  // Markdown export
  const lines: string[] = [
    `# ${notebook.name}`,
    notebook.description ? `\n> ${notebook.description}` : "",
    `\n*Exported from CORELLM on ${new Date().toLocaleDateString()}*`,
    "\n---\n",
    "## Sources\n",
    ...notebook.sources.map(
      (s) => `- **${s.name}** (${s.type})${s.url ? ` — [Link](${s.url})` : ""}`
    ),
    "\n---\n",
    "## Conversation\n",
    ...notebook.messages.map((m) => {
      const prefix = m.role === "USER" ? "### 🧑 You" : `### 🤖 CORELLM${m.mode !== "STANDARD" ? ` *(${m.mode})*` : ""}`;
      const timestamp = new Date(m.createdAt).toLocaleString();
      return `${prefix}\n*${timestamp}*\n\n${m.content}\n`;
    }),
  ];

  const markdown = lines.filter((l) => l !== "").join("\n");

  return new NextResponse(markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${notebook.name.replace(/[^a-z0-9]/gi, "_")}.md"`,
    },
  });
}