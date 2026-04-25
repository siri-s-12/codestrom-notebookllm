// src/app/page.tsx
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Navigation */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">C</div>
          <span className="font-bold text-lg tracking-tight">CORELLM</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/auth/signin" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Sign in
          </Link>
          <Link href="/auth/signup" className="text-sm bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium">
            Get Started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/50 bg-muted/50 px-4 py-1.5 text-xs text-muted-foreground mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          Powered by RAG + GPT-4o
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 max-w-4xl">
          Research smarter with{" "}
          <span className="gradient-text">AI notebooks</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mb-10">
          Upload PDFs, YouTube videos, websites, and audio. Chat with your sources using RAG-powered AI.
          Get deep insights, summaries, and follow-up questions automatically.
        </p>

        <div className="flex items-center gap-4">
          <Link href="/auth/signup" className="bg-primary text-primary-foreground px-8 py-3.5 rounded-xl font-semibold text-base hover:opacity-90 transition-all hover:scale-[1.02] active:scale-[0.98]">
            Start for free →
          </Link>
          <Link href="/auth/signin" className="text-muted-foreground hover:text-foreground transition-colors text-base">
            Sign in
          </Link>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl w-full">
          {[
            { icon: "📄", label: "PDFs" },
            { icon: "▶️", label: "YouTube" },
            { icon: "🌐", label: "Websites" },
            { icon: "🎵", label: "Audio" },
          ].map((f) => (
            <div key={f.label} className="glass-card rounded-xl p-4 flex flex-col items-center gap-2">
              <span className="text-2xl">{f.icon}</span>
              <span className="text-sm font-medium">{f.label}</span>
            </div>
          ))}
        </div>

        {/* Features list */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl w-full text-left">
          {[
            { title: "RAG-Powered Chat", desc: "Ask questions and get answers grounded in your sources with citations." },
            { title: "Deep Research Mode", desc: "Generate exhaustive, research-grade analyses across all your sources." },
            { title: "Auto Suggestions", desc: "Get 3-5 intelligent follow-up questions after every response." },
            { title: "Streaming Responses", desc: "See answers as they're generated in real time." },
            { title: "Persistent Notebooks", desc: "Save conversations and sources. Pick up right where you left off." },
            { title: "Multi-Source RAG", desc: "Cross-reference PDFs, videos, and websites in a single query." },
          ].map((f) => (
            <div key={f.title} className="glass-card rounded-xl p-5">
              <h3 className="font-semibold mb-1.5">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} CORELLM. Built with Next.js, OpenAI, and Pinecone.
      </footer>
    </main>
  );
}