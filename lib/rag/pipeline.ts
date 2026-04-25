import { prisma } from '../db/prisma'

export interface RelevantChunk {
  content: string
  sourceId: string
  sourceName: string
  score: number
}

export async function ingestSource(sourceId: string) {
  const source = await prisma.source.findUnique({
    where: { id: sourceId }
  })

  if (!source || !source.content) return

  try {
    const content = source.content || ""
    // Split into chunks (simple implementation)
    const chunks = content.split('\n\n').filter((chunk: string) => chunk.trim())

    for (const chunk of chunks) {
      await prisma.chunk.create({
        data: {
          sourceId,
          content: chunk.trim(),
          metadata: JSON.stringify({})
        }
      })
    }

    await prisma.source.update({
      where: { id: sourceId },
      data: { status: 'completed' }
    })
  } catch (error) {
    console.error('Error ingesting source:', error)
    await prisma.source.update({
      where: { id: sourceId },
      data: { status: 'failed' }
    })
  }
}

export async function retrieveContext(query: string, notebookId: string, limit: number = 8): Promise<RelevantChunk[]> {
  // Simple text search - in real app, use vector search
  const chunks = (await prisma.chunk.findMany({
    where: {
      source: {
        notebookId
      },
      content: {
        contains: query
      }
    },
    include: {
      source: true
    },
    take: limit
  })) as Array<{ content: string; sourceId: string; source: { name: string } }>

  return chunks.map((chunk) => ({
    content: chunk.content,
    sourceId: chunk.sourceId,
    sourceName: chunk.source.name,
    score: 1 // placeholder
  }))
}

export function buildSystemPrompt(chunks: any[], mode: string) {
  const context = chunks.map(c => `[${c.sourceName}]: ${c.content}`).join('\n\n')

  const basePrompt = `You are a helpful AI assistant. Use the following context to answer questions accurately.

Context:
${context}

Instructions:
- Be helpful and accurate
- Cite sources when relevant
- If you don't know something, say so`

  if (mode === 'SUMMARIZE') {
    return basePrompt + '\n- Provide concise summaries'
  } else if (mode === 'DEEP_RESEARCH') {
    return basePrompt + '\n- Provide detailed, comprehensive answers'
  }

  return basePrompt
}

export function parseSuggestions(content: string) {
  return {
    cleanContent: content,
    suggestions: [] as string[],
  }
}