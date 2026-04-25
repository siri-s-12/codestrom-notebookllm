// src/app/api/user/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db/prisma";
import { requireAuth } from "../../../lib/auth/getSession";

// GET /api/user — get current user profile
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  const user = await prisma.user.findUnique({
    where: { id: session!.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      createdAt: true,
      _count: { select: { notebooks: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
  return NextResponse.json({ user });
}

// PATCH /api/user — update name or image
export async function PATCH(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const body = await req.json().catch(() => ({}));
  const { name, image } = body;

  const updated = await prisma.user.update({
    where: { id: session!.user.id },
    data: {
      ...(name && { name }),
      ...(image && { image }),
    },
    select: { id: true, email: true, name: true, image: true },
  });

  return NextResponse.json({ user: updated });
}

// DELETE /api/user — delete account and all data
export async function DELETE() {
  const { session, error } = await requireAuth();
  if (error) return error;

  // Cascade deletes notebooks, sources, messages via Prisma relations
  await prisma.user.delete({ where: { id: session!.user.id } });
  return NextResponse.json({ success: true });
}