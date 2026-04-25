// src/app/api/chat/history/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db/prisma";
import { requireAuth } from "../../../lib/auth/getSession";

// GET /api/chat/history?notebookId=xxx&cursor=xxx&limit=50
export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const notebookId = searchParams.get("notebookId");
  const cursor = searchParams.get("cursor");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);

  if (!notebookId) {
    return NextResponse.json({ error: "notebookId is required" }, { status: 400 });
  }

  // Verify ownership
  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId: session!.user.id },
  });
  if (!notebook) return NextResponse.json({ error: "Notebook not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { notebookId },
    orderBy: { createdAt: "asc" },
    take: limit,
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1,
    }),
  });

  const total = await prisma.message.count({ where: { notebookId } });
  const hasMore = messages.length === limit;
  const nextCursor = hasMore ? messages[messages.length - 1].id : null;

  return NextResponse.json({ messages, total, nextCursor, hasMore });
}

// DELETE /api/chat/history?notebookId=xxx — clear chat history
export async function DELETE(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(req.url);
  const notebookId = searchParams.get("notebookId");

  if (!notebookId) return NextResponse.json({ error: "notebookId is required" }, { status: 400 });

  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId: session!.user.id },
  });
  if (!notebook) return NextResponse.json({ error: "Notebook not found" }, { status: 404 });

  const deleted = await prisma.message.deleteMany({ where: { notebookId } });

  return NextResponse.json({ success: true, deleted: deleted.count });
}