// src/components/chat/ChatPanel.tsx
"use client";
import { useEffect, useRef } from "react";
import { useChat } from "../hooks/useChat";
import { ChatMessage } from "./ChatMessages";
import { ChatInput } from "./ChatInput";
import { StreamingMessage } from "./StreamingMessage";

interface Props {
  chat: ReturnType<typeof useChat>;
  notebookId: string;
}

export function ChatPanel({ chat, notebookId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat.messages, chat.streamingContent]);

  const handleSuggestClick = (suggestion: string) => {
    chat.sendMessage(suggestion);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {chat.messages.length === 0 && !chat.isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 border border-violet-500/20 flex items-center justify-center mb-4">
              <span className="text-2xl">🧠</span>
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready to research</h3>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              Add sources using the panel on the right, then ask me anything about them.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {[
                "Summarize all sources",
                "What are the key themes?",
                "Compare the main arguments",
                "What questions does this raise?",
              ].map((q) => (
                <button
                  key={q}
                  onClick={() => chat.sendMessage(q)}
                  className="rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors hover:border-border"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {chat.messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}

            {/* Streaming message */}
            {chat.isStreaming && (
              <StreamingMessage
                content={chat.streamingContent}
                sources={chat.streamingSources}
              />
            )}

            {/* Error */}
            {chat.error && (
              <div className="rounded-xl bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
                {chat.error}
              </div>
            )}

            {/* Suggestions */}
            {!chat.isStreaming && chat.suggestions.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium px-1">Suggested questions</p>
                <div className="flex flex-wrap gap-2">
                  {chat.suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestClick(s)}
                      className="rounded-xl border border-border/50 bg-card/50 px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors text-left hover:border-border"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        onSend={chat.sendMessage}
        onStop={chat.stopStream}
        onClear={chat.clearHistory}
        isStreaming={chat.isStreaming}
        disabled={false}
      />
    </div>
  );
}
