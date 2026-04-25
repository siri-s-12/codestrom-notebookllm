// src/app/api/health/route.ts
import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db/prisma";

export const runtime = "nodejs";

// GET /api/health — system health check
export async function GET() {
  const checks: Record<string, { status: "ok" | "error"; message?: string }> = {};

  // Database check
  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: "ok" };
  } catch (err) {
    checks.database = { status: "error", message: err instanceof Error ? err.message : "DB error" };
  }

  // OpenAI check
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  checks.openai = hasOpenAI
    ? { status: "ok" }
    : { status: "error", message: "OPENAI_API_KEY not set" };

  // Vector store check
  const useLocal = process.env.USE_LOCAL_VECTOR_DB === "true";
  const hasPinecone = !!process.env.PINECONE_API_KEY;
  checks.vectorStore = useLocal
    ? { status: "ok", message: "local (in-memory)" }
    : hasPinecone
    ? { status: "ok", message: "pinecone" }
    : { status: "error", message: "No vector store configured" };

  const allOk = Object.values(checks).every((c) => c.status === "ok");

  return NextResponse.json(
    {
      status: allOk ? "healthy" : "degraded",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allOk ? 200 : 503 }
  );
}