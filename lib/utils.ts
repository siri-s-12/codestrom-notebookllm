// src/lib/utils/index.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + "...";
}

export function isYouTubeUrl(url: string): boolean {
  return /(?:youtube\.com|youtu\.be)/i.test(url);
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getSourceIcon(type: string): string {
  const icons: Record<string, string> = {
    PDF: "📄",
    TEXT: "📝",
    URL: "🌐",
    YOUTUBE: "▶️",
    AUDIO: "🎵",
    IMAGE: "🖼️",
  };
  return icons[type] || "📄";
}

export function getSourceColor(type: string): string {
  const colors: Record<string, string> = {
    PDF: "text-red-400 bg-red-400/10 border-red-400/20",
    TEXT: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    URL: "text-green-400 bg-green-400/10 border-green-400/20",
    YOUTUBE: "text-rose-400 bg-rose-400/10 border-rose-400/20",
    AUDIO: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    IMAGE: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  };
  return colors[type] || "text-muted-foreground bg-muted border-border";
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}