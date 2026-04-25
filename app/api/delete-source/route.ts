// src/app/api/sources/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db/prisma";
import { requireAuth } from "../../../lib/auth/getSession";
import { deleteVectors } from "../../../lib/rag/vectorStore";

// DELETE /api/sources/:id
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const source = await prisma.source.findFirst({
    where: { id: params.id },
    include: { notebook: true },
  });

  if (!source) {
    return NextResponse.json({ error: "Source not found" }, { status: 404 });
  }

  // Verify ownership via notebook
  if (source.notebook.userId !== session!.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Remove from vector store
  if (source.vectorIds.length > 0) {
    await deleteVectors(source.vectorIds).catch(console.error);
  }

  await prisma.source.delete({ where: { id: params.id } });

  return NextResponse.json({ success: true });
}

// GET /api/sources/:id — get source details + content preview
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const source = await prisma.source.findFirst({
    where: { id: params.id },
    include: { notebook: { select: { userId: true } } },
  });

  if (!source) return NextResponse.json({ error: "Source not found" }, { status: 404 });
  if (source.notebook.userId !== session!.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Return source without full content (too large for listing)
  const { content, notebook, ...rest } = source;
  return NextResponse.json({
    source: {
      ...rest,
      contentPreview: content.slice(0, 500) + (content.length > 500 ? "..." : ""),
      contentLength: content.length,
    },
  });
}