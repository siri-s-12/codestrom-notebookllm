// src/app/api/notebooks/[id]/suggestions/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db/prisma";
import { requireAuth } from "../../../lib/auth/getSession";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 30;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET /api/notebooks/:id/suggestions — generate smart questions for notebook
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const notebook = await prisma.notebook.findFirst({
    where: { id: params.id, userId: session!.user.id },
    include: {
      sources: { select: { name: true, type: true, content: true }, take: 5 },
      messages: { orderBy: { createdAt: "desc" }, take: 6 },
    },
  });

  if (!notebook) return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
  if (notebook.sources.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  // Build context snippet
  const sourcesSummary = notebook.sources
    .map((s) => `- ${s.name} (${s.type}): ${s.content.slice(0, 400)}...`)
    .join("\n");

  const recentMessages = notebook.messages
    .reverse()
    .map((m) => `${m.role}: ${m.content.slice(0, 200)}`)
    .join("\n");

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.8,
      max_tokens: 500,
      messages: [
        {
          role: "system",
          content: `Generate 5 insightful, specific questions a researcher would want to ask about these sources. 
Return ONLY a JSON array of strings. No explanation, no markdown, just the JSON array.
Make questions specific, thought-provoking, and varied (analytical, comparative, applied, critical).`,
        },
        {
          role: "user",
          content: `Notebook: "${notebook.name}"\n\nSources:\n${sourcesSummary}\n\n${
            recentMessages ? `Recent conversation:\n${recentMessages}` : ""
          }\n\nGenerate 5 follow-up questions.`,
        },
      ],
    });

    const raw = response.choices[0]?.message?.content?.trim() || "[]";
    const cleaned = raw.replace(/```json|```/g, "").trim();
    const suggestions = JSON.parse(cleaned);

    return NextResponse.json({
      suggestions: Array.isArray(suggestions) ? suggestions.slice(0, 5) : [],
    });
  } catch (err) {
    console.error("[Suggestions error]", err);
    return NextResponse.json({ suggestions: [] });
  }
}