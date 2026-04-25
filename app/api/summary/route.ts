// src/app/api/notebooks/[id]/summary/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db/prisma";
import { requireAuth } from "../../../lib/auth/getSession";
import OpenAI from "openai";

export const runtime = "nodejs";
export const maxDuration = 60;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/notebooks/:id/summary — generate AI summary of all sources
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { session, error } = await requireAuth();
  if (error) return error;

  const notebook = await prisma.notebook.findFirst({
    where: { id: params.id, userId: session!.user.id },
    include: { sources: { select: { id: true, name: true, type: true, content: true } } },
  });

  if (!notebook) return NextResponse.json({ error: "Notebook not found" }, { status: 404 });

  if (notebook.sources.length === 0) {
    return NextResponse.json({ error: "No sources to summarize" }, { status: 422 });
  }

  // Compile source text (truncate each to 3000 chars to stay within context)
  const sourcesText = notebook.sources
    .map((s) => `## ${s.name} (${s.type})\n${s.content.slice(0, 3000)}`)
    .join("\n\n---\n\n");

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const openaiStream = await openai.chat.completions.create({
          model: process.env.OPENAI_CHAT_MODEL || "gpt-4o",
          stream: true,
          temperature: 0.4,
          max_tokens: 2500,
          messages: [
            {
              role: "system",
              content: `You are an expert research summarizer. Create a comprehensive summary of the provided source materials for a notebook called "${notebook.name}".

Structure your summary with:
1. **Overview** — What this notebook covers
2. **Key Sources** — Brief description of each source  
3. **Main Themes** — Core topics and ideas across all sources
4. **Key Insights** — The most important findings or arguments
5. **Connections** — How the sources relate to each other
6. **Gaps & Questions** — What's missing or unclear

Use markdown formatting. Be thorough but concise.`,
            },
            {
              role: "user",
              content: `Summarize these sources:\n\n${sourcesText}`,
            },
          ],
        });

        let fullContent = "";
        for await (const chunk of openaiStream) {
          const delta = chunk.choices[0]?.delta?.content || "";
          if (delta) {
            fullContent += delta;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`)
            );
          }
        }

        // Save as a system message in chat history
        await prisma.message.create({
          data: {
            notebookId: params.id,
            role: "ASSISTANT",
            content: fullContent,
            mode: "SUMMARIZE",
          },
        });

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`)
        );
      } catch (err) {
        console.error("[Summary error]", err);
        const msg = err instanceof Error ? err.message : "Summary generation failed";
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: msg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}