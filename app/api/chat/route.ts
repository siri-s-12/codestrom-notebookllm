// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db/prisma";
import { requireAuth } from "../../../lib/auth/getSession";
import { retrieveContext, buildSystemPrompt, parseSuggestions } from "../../../lib/rag/pipeline";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);

// POST /api/chat — RAG-powered streaming chat
export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  let body: {
    notebookId: string;
    message: string;
    mode?: "STANDARD" | "SUMMARIZE" | "DEEP_RESEARCH";
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { notebookId, message, mode = "STANDARD" } = body;

  if (!notebookId || !message?.trim()) {
    return NextResponse.json({ error: "notebookId and message are required" }, { status: 400 });
  }

  // ── Verify notebook ownership ───────────────────────────────────────────
  const userId = (session?.user as { id?: string })?.id
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const notebook = await prisma.notebook.findFirst({
    where: { id: notebookId, userId },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        take: 20, // last 20 messages for context window
      },
    },
  }) as
    | ({
        messages: { id: string; role: string; content: string }[]
        title: string
      } & Record<string, unknown>)
    | null;

  if (!notebook) return NextResponse.json({ error: "Notebook not found" }, { status: 404 });

  // ── Save user message ───────────────────────────────────────────────────
  const userMessage = await prisma.message.create({
    data: {
      notebookId,
      role: "USER",
      content: message,
      mode,
    },
  });

  // ── Retrieve relevant context via RAG ───────────────────────────────────
  const relevantChunks = await retrieveContext(message, notebookId, mode === "DEEP_RESEARCH" ? 12 : 8);
  const systemPrompt = buildSystemPrompt(relevantChunks, mode);

  // ── Build conversation history for Gemini ──────────────────────────────────────────
  const history = notebook.messages
    .filter((m: { id: string }) => m.id !== userMessage.id)
    .map((m: { id: string; role: string; content: string }) => ({
      role: m.role === 'USER' ? 'user' : 'assistant',
      parts: [{ text: m.content }],
    }));

  // ── Stream response ─────────────────────────────────────────────────────
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let fullContent = "";

      try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const chat = model.startChat({
          history,
          generationConfig: {
            temperature: mode === "DEEP_RESEARCH" ? 0.3 : 0.7,
            maxOutputTokens: mode === "DEEP_RESEARCH" ? 4000 : mode === "SUMMARIZE" ? 2000 : 1500,
          },
        });

        // Send source metadata first
        const sourceMeta = {
          type: "sources",
          sources: relevantChunks.map((c: { sourceId: string; sourceName: string; score: number }) => ({
            sourceId: c.sourceId,
            sourceName: c.sourceName,
            score: c.score,
          })),
        };
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(sourceMeta)}\n\n`));

        const prompt = `${systemPrompt}\n\nUser: ${message}`;

        const result = await chat.sendMessageStream(prompt);

        for await (const chunk of result.stream) {
          const delta = chunk.text();
          if (delta) {
            fullContent += delta;
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ type: "delta", content: delta })}\n\n`)
            );
          }
        }

        // Parse suggestions out of the full response
        const { cleanContent, suggestions } = parseSuggestions(fullContent);

        // Save assistant message to DB
        const assistantMessage = await prisma.message.create({
          data: {
            notebookId,
            role: "ASSISTANT",
            content: cleanContent,
            mode,
            sources: JSON.stringify(relevantChunks),
            suggestions: JSON.stringify(suggestions),
          },
        });

        // Auto-rename notebook if it's the first message and still "Untitled"
        if (notebook.messages.length === 0 && notebook.title === "Untitled Notebook") {
          const generatedName = await generateNotebookName(message);
          if (generatedName) {
            await prisma.notebook.update({
              where: { id: notebookId },
              data: { title: generatedName },
            });
          }
        }

        // Update notebook timestamp
        await prisma.notebook.update({
          where: { id: notebookId },
          data: { updatedAt: new Date() },
        });

        // Send final metadata
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: "done",
              messageId: assistantMessage.id,
              userMessageId: userMessage.id,
              suggestions,
              cleanContent,
            })}\n\n`
          )
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "LLM error";
        console.error("[Chat stream error]", err);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "error", error: errorMsg })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ── Auto-generate notebook name from first message ──────────────────────────
async function generateNotebookName(firstMessage: string): Promise<string | null> {
  const trimmed = firstMessage.trim()
  if (!trimmed) return null

  const firstSentence = trimmed.split(/[.?!]/)[0]?.trim() || trimmed
  const words = firstSentence.split(/\s+/).slice(0, 5)
  const title = words.map((word) => word[0].toUpperCase() + word.slice(1)).join(" ")

  return title || "Research Notebook"
}