// src/components/chat/ChatMessage.tsx
"use client";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Message } from "../types";
import { formatDate, getSourceIcon } from "../lib/utils";
import { useState } from "react";

interface Props {
  message: Message;
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === "USER";
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isUser) {
    return (
      <div className="flex justify-end animate-fade-in">
        <div className="chat-message-user">
          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 animate-fade-in">
      {/* Mode badge */}
      {message.mode && message.mode !== "STANDARD" && (
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60 px-2 py-0.5 rounded-full border border-border/40 bg-muted/30">
            {message.mode === "SUMMARIZE" ? "📋 Summary" : "🔬 Deep Research"}
          </span>
        </div>
      )}

      {/* AI message */}
      <div className="chat-message-ai group relative">
        {/* CORELLM label */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white text-[10px] font-bold">
              C
            </div>
            <span className="text-xs font-medium text-muted-foreground">CORELLM</span>
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-[10px] text-muted-foreground/50">{formatDate(message.createdAt)}</span>
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title="Copy"
            >
              {copied ? (
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Markdown content */}
        <div className="prose-corellm text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ node, className, children, ...props }) {
                const match = /language-(\w+)/.exec(className || "");
                const inline = !match;
                return inline ? (
                  <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono" {...props}>
                    {children}
                  </code>
                ) : (
                  <SyntaxHighlighter
                    style={oneDark as Record<string, React.CSSProperties>}
                    language={match[1]}
                    PreTag="div"
                    className="!rounded-lg !text-xs !my-2"
                  >
                    {String(children).replace(/\n$/, "")}
                  </SyntaxHighlighter>
                );
              },
              // Override table for better styling
              table({ children }) {
                return (
                  <div className="overflow-x-auto my-2">
                    <table className="min-w-full text-xs border border-border rounded-lg overflow-hidden">
                      {children}
                    </table>
                  </div>
                );
              },
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>

        {/* Source citations */}
        {message.sources && Array.isArray(message.sources) && message.sources.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5 font-medium">
              Sources referenced
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(message.sources as Array<{ sourceId: string; sourceName: string; score: number }>)
                .slice(0, 5)
                .map((s, i) => (
                  <span key={i} className="source-badge">
                    {getSourceIcon("PDF")} {s.sourceName}
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}