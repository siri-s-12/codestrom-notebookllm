// src/app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db/prisma";
import { requireAuth } from "../../../lib/auth/getSession";

// GET /api/search?q=query — semantic search across all notebooks
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] });
  }

  // Text search across notebooks, sources, and messages
  const [notebooks, messages] = await Promise.all([
    prisma.notebook.findMany({
      where: {
        userId: session!.user.id,
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      take: limit,
      select: {
        id: true,
        name: true,
        description: true,
        updatedAt: true,
        _count: { select: { sources: true, messages: true } },
      },
    }),
    prisma.message.findMany({
      where: {
        notebook: { userId: session!.user.id },
        content: { contains: query, mode: "insensitive" },
        role: "ASSISTANT",
      },
      take: limit,
      select: {
        id: true,
        content: true,
        createdAt: true,
        notebookId: true,
        notebook: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const results = {
    notebooks: notebooks.map((n) => ({
      type: "notebook",
      id: n.id,
      title: n.name,
      description: n.description,
      updatedAt: n.updatedAt,
      meta: `${n._count.sources} sources · ${n._count.messages} messages`,
    })),
    messages: messages.slice(0, 10).map((m) => ({
      type: "message",
      id: m.id,
      notebookId: m.notebookId,
      notebookName: m.notebook.name,
      excerpt: m.content.slice(0, 200) + (m.content.length > 200 ? "..." : ""),
      createdAt: m.createdAt,
    })),
  };

  return NextResponse.json({ results, query });
}