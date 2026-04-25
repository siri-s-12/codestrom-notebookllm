// src/components/chat/StreamingMessage.tsx
"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { SourceChunk } from "../types";

interface Props {
  content: string;
  sources: SourceChunk[];
}

export function StreamingMessage({ content, sources }: Props) {
  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      <div className="chat-message-ai">
        {/* Header */}
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
            C
          </div>
          <span className="text-xs font-medium text-muted-foreground">CORELLM</span>
          <span className="flex gap-0.5 ml-1">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </span>
        </div>

        {/* Streaming content */}
        <div className="prose-corellm text-sm">
          {content ? (
            <>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
              </ReactMarkdown>
              <span className="streaming-cursor" />
            </>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span className="w-3 h-3 border border-border border-t-primary rounded-full animate-spin" />
              Searching sources and generating response...
            </div>
          )}
        </div>

        {/* Sources being used */}
        {sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5 font-medium">
              Drawing from
            </p>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((s, i) => (
                <span key={i} className="source-badge text-[10px] animate-fade-in">
                  {s.sourceName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}