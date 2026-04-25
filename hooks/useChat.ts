// src/hooks/useChat.ts
"use client";
import { useState, useCallback, useRef } from "react";
import { Message, ChatMode, SourceChunk } from "../types";

interface StreamEvent {
  type: "sources" | "delta" | "done" | "error";
  content?: string;
  sources?: { sourceId: string; sourceName: string; score: number }[];
  messageId?: string;
  userMessageId?: string;
  suggestions?: string[];
  cleanContent?: string;
  error?: string;
}

interface UseChatOptions {
  notebookId: string;
  onNotebookRenamed?: (name: string) => void;
}

export function useChat({ notebookId, onNotebookRenamed }: UseChatOptions) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [streamingSources, setStreamingSources] = useState<SourceChunk[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadHistory = useCallback(async () => {
    const res = await fetch(`/api/chat/history?notebookId=${notebookId}`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data.messages || []);
      // Set latest suggestions from last assistant message
      const lastAI = [...(data.messages || [])].reverse().find((m: Message) => m.role === "ASSISTANT");
      if (lastAI?.suggestions?.length) setSuggestions(lastAI.suggestions);
    }
  }, [notebookId]);

  const sendMessage = useCallback(
    async (content: string, mode: ChatMode = "STANDARD") => {
      if (isStreaming || !content.trim()) return;

      setError(null);
      setIsStreaming(true);
      setStreamingContent("");
      setStreamingSources([]);

      // Optimistic user message
      const tempUserMsg: Message = {
        id: `temp-${Date.now()}`,
        notebookId,
        role: "USER",
        content,
        mode,
        createdAt: new Date(),
        suggestions: [],
      };
      setMessages((prev) => [...prev, tempUserMsg]);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notebookId, message: content, mode }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: "Request failed" }));
          throw new Error(err.error || "Chat request failed");
        }

        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) throw new Error("No response body");

        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));

              if (event.type === "sources" && event.sources) {
                setStreamingSources(
                  event.sources.map((s) => ({
                    sourceId: s.sourceId,
                    sourceName: s.sourceName,
                    content: "",
                    score: s.score,
                  }))
                );
              } else if (event.type === "delta" && event.content) {
                setStreamingContent((prev) => prev + event.content);
              } else if (event.type === "done") {
                const finalMsg: Message = {
                  id: event.messageId!,
                  notebookId,
                  role: "ASSISTANT",
                  content: event.cleanContent || streamingContent,
                  mode,
                  sources: streamingSources,
                  suggestions: event.suggestions || [],
                  createdAt: new Date(),
                };
                // Update user message ID from temp to real
                setMessages((prev) =>
                  prev
                    .filter((m) => m.id !== tempUserMsg.id)
                    .concat([
                      { ...tempUserMsg, id: event.userMessageId || tempUserMsg.id },
                      finalMsg,
                    ])
                );
                setSuggestions(event.suggestions || []);
                setStreamingContent("");
                setStreamingSources([]);
              } else if (event.type === "error") {
                throw new Error(event.error || "Stream error");
              }
            } catch (parseErr) {
              // Ignore malformed SSE lines
            }
          }
        }
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        const msg = err instanceof Error ? err.message : "An error occurred";
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      } finally {
        setIsStreaming(false);
        setStreamingContent("");
      }
    },
    [isStreaming, notebookId, streamingContent, streamingSources]
  );

  const stopStream = useCallback(() => {
    abortRef.current?.abort();
    setIsStreaming(false);
    setStreamingContent("");
  }, []);

  const clearHistory = useCallback(async () => {
    await fetch(`/api/chat/history?notebookId=${notebookId}`, { method: "DELETE" });
    setMessages([]);
    setSuggestions([]);
  }, [notebookId]);

  return {
    messages,
    isStreaming,
    streamingContent,
    streamingSources,
    suggestions,
    error,
    loadHistory,
    sendMessage,
    stopStream,
    clearHistory,
  };
}
