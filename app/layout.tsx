import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "CORELLM", template: "%s | CORELLM" },
  description:
    "Notebook-style AI research assistant with RAG. Upload sources, chat with your documents, and conduct deep research.",
  keywords: ["AI", "RAG", "research", "notebook", "LLM", "documents"],
  authors: [{ name: "CORELLM" }],
  openGraph: {
    title: "CORELLM - AI Research Notebooks",
    description: "Chat with your documents. Deep research made easy.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>{children}</body>
    </html>
  );
}
