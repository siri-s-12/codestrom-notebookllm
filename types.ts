export type SourceType = "PDF" | "TEXT" | "URL" | "YOUTUBE" | "AUDIO" | "IMAGE";

export type ChatMode = "STANDARD" | "SUMMARIZE" | "DEEP_RESEARCH";

export interface SourceChunk {
  sourceId: string;
  sourceName: string;
  content: string;
  score: number;
}

export interface Source {
  id: string;
  notebookId: string;
  name: string;
  type: SourceType | string;
  content?: string | null;
  url?: string | null;
  filePath?: string | null;
  fileSize?: number | null;
  mimeType?: string | null;
  vectorIds?: string | string[];
  status?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface Message {
  id: string;
  notebookId?: string | null;
  role: "USER" | "ASSISTANT" | "SYSTEM" | string;
  content: string;
  mode?: ChatMode | string | null;
  sources?: SourceChunk[] | string | null;
  suggestions?: string[];
  createdAt: string | Date;
}

export interface Notebook {
  id: string;
  userId?: string;
  name: string;
  title?: string;
  description?: string | null;
  sources?: Source[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
