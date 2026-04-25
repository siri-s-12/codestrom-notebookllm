import { NextRequest, NextResponse } from "next/server";
import { prisma } from "../../../lib/db/prisma";
import { requireAuth } from "../../../lib/auth/getSession";
import {
  parsePDF,
  parseURL,
  parseYouTube,
  parseAudio,
  parseText,
} from "../../../lib/rag/parsers";
import { ingestSource } from "../../../lib/rag/pipeline";
import { Buffer } from "buffer";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const userId = (session as { user?: { id?: string } })?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    let notebookId = "";
    let type = "";
    let name = "";
    let content = "";
    let url: string | undefined;
    let fileSize: number | undefined;
    let mimeType: string | undefined;

    // FILE UPLOAD
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();

      notebookId = (formData.get("notebookId") as string) || "";
      type = (formData.get("type") as string) || "";
      name = (formData.get("name") as string) || "Unnamed Source";

      const file = formData.get("file") as File | null;

      if (!file) {
        return NextResponse.json({ error: "No file" }, { status: 400 });
      }

      fileSize = file.size;
      mimeType = file.type;

      const buffer = Buffer.from(await file.arrayBuffer());

      if (type === "PDF") {
        content = (await parsePDF(buffer)) || "";
      } else if (type === "AUDIO") {
        content = (await parseAudio(buffer, file.name, file.type)) || "";
      } else {
        content = (await parseText(buffer.toString("utf-8"))) || "";
        type = "TEXT";
      }
    }

    // JSON INPUT
    else {
      const body = (await req.json()) as any;

      notebookId = body.notebookId || "";
      type = body.type || "";
      name = body.name || "Unnamed";
      url = body.url;

      if (type === "URL") {
        if (typeof url !== "string" || !url) {
          return NextResponse.json({ error: "URL is required" }, { status: 400 });
        }
        content = (await parseURL(url)) || "";
      } else if (type === "YOUTUBE") {
        if (typeof url !== "string" || !url) {
          return NextResponse.json({ error: "YouTube URL is required" }, { status: 400 });
        }
        content = (await parseYouTube(url)) || "";
      } else if (type === "TEXT") {
        content = (await parseText(body.content || "")) || "";
      } else {
        return NextResponse.json({ error: "Unsupported source type" }, { status: 400 });
      }
    }

    if (!notebookId) {
      return NextResponse.json({ error: "Missing notebookId" }, { status: 400 });
    }

    if (!content || content.length < 10) {
      return NextResponse.json({ error: "Content too short" }, { status: 422 });
    }

    const notebook = await prisma.notebook.findFirst({
      where: {
        id: notebookId,
        userId,
      },
    });

    if (!notebook) {
      return NextResponse.json({ error: "Notebook not found" }, { status: 404 });
    }

    const source = await prisma.source.create({
      data: {
        userId,
        notebookId,
        type,
        name,
        content,
        url,
        fileSize,
        mimeType,
      },
    });

    ingestSource(source.id).catch(console.error);

    return NextResponse.json({ source });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
