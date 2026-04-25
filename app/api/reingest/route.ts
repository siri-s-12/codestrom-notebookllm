// src/app/api/sources/[id]/reingest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db/prisma";
import { requireAuth } from "../../../lib/auth/getSession";
import { ingestSource } from "../../../lib/rag/pipeline";

// POST /api/sources/:id/reingest — manually trigger re-ingestion
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
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

  try {
    await ingestSource(source.id);
    const updated = await prisma.source.findUnique({ where: { id: source.id } });
    return NextResponse.json({ success: true, vectorIds: updated?.vectorIds || [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Ingestion failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}