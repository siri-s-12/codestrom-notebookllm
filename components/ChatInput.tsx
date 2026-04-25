// src/components/chat/ChatInput.tsx
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMode } from "../types";

interface Props {
  onSend: (message: string, mode: ChatMode) => void;
  onStop: () => void;
  onClear: () => void;
  isStreaming: boolean;
  disabled: boolean;
}

const MODES: { value: ChatMode; label: string; icon: string; desc: string }[] = [
  { value: "STANDARD", label: "Standard", icon: "💬", desc: "Clear, concise answers" },
  { value: "SUMMARIZE", label: "Summarize", icon: "📋", desc: "Structured summary" },
  { value: "DEEP_RESEARCH", label: "Deep Research", icon: "🔬", desc: "Exhaustive analysis" },
];

export function ChatInput({ onSend, onStop, onClear, isStreaming, disabled }: Props) {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ChatMode>("STANDARD");
  const [showModes, setShowModes] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [input]);

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isStreaming || disabled) return;
    onSend(trimmed, mode);
    setInput("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [input, isStreaming, disabled, onSend, mode]);

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  const selectedMode = MODES.find((m) => m.value === mode)!;

  return (
    <div className="border-t border-border bg-background/50 backdrop-blur-sm px-4 py-3 shrink-0">
      {/* Mode selector */}
      <div className="relative mb-2">
        <button
          onClick={() => setShowModes((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors border border-border/50"
        >
          <span>{selectedMode.icon}</span>
          {selectedMode.label}
          <svg
            className={`w-3 h-3 transition-transform ${showModes ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showModes && (
          <div className="absolute bottom-full left-0 mb-2 bg-card border border-border rounded-xl shadow-xl py-1 w-64 z-50">
            {MODES.map((m) => (
              <button
                key={m.value}
                onClick={() => { setMode(m.value); setShowModes(false); }}
                className={`w-full flex items-start gap-2.5 px-3 py-2.5 hover:bg-accent transition-colors ${
                  mode === m.value ? "bg-accent" : ""
                }`}
              >
                <span className="text-base mt-0.5">{m.icon}</span>
                <div className="text-left">
                  <div className="text-xs font-medium">{m.label}</div>
                  <div className="text-[10px] text-muted-foreground">{m.desc}</div>
                </div>
                {mode === m.value && (
                  <svg className="w-3.5 h-3.5 ml-auto mt-0.5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Input box */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your sources... (Shift+Enter for new line)"
            disabled={isStreaming || disabled}
            rows={1}
            className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 placeholder:text-muted-foreground/50 min-h-[48px] max-h-[200px]"
          />

          {/* Voice input button (UI only - placeholder for browser mic) */}
          <button
            className="absolute right-3 bottom-3 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
            title="Voice input (coming soon)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
        </div>

        {/* Send/Stop button */}
        {isStreaming ? (
          <button
            onClick={onStop}
            className="shrink-0 w-11 h-11 rounded-xl bg-destructive/80 text-destructive-foreground flex items-center justify-center hover:bg-destructive transition-colors"
            title="Stop generating"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!input.trim() || disabled}
            className="shrink-0 w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 disabled:opacity-40 transition-all active:scale-95"
            title="Send (Enter)"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px] text-muted-foreground/50">Enter to send · Shift+Enter for newline</p>
        <button
          onClick={onClear}
          disabled={isStreaming}
          className="text-[10px] text-muted-foreground/50 hover:text-muted-foreground transition-colors disabled:opacity-30"
        >
          Clear history
        </button>
      </div>
    </div>
  );
}