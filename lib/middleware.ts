// src/middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ─── Simple in-memory rate limiter (use Upstash Redis in production) ─────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (entry.count >= limit) return false; // blocked

  entry.count++;
  return true; // allowed
}

// Clean stale entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, val] of rateLimitMap.entries()) {
      if (val.resetAt < now) rateLimitMap.delete(key);
    }
  }, 5 * 60 * 1000);
}

export default withAuth(
  function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    // ── Rate limiting for API routes ────────────────────────────────────────
    if (pathname.startsWith("/api/")) {
      // Chat endpoint: 30 requests/min per IP
      if (pathname.startsWith("/api/chat")) {
        if (!rateLimit(`chat:${ip}`, 30, 60_000)) {
          return NextResponse.json(
            { error: "Too many requests. Please slow down." },
            { status: 429, headers: { "Retry-After": "60" } }
          );
        }
      }

      // Upload endpoint: 10 uploads/min per IP
      if (pathname.startsWith("/api/sources")) {
        if (!rateLimit(`upload:${ip}`, 10, 60_000)) {
          return NextResponse.json(
            { error: "Upload rate limit exceeded." },
            { status: 429, headers: { "Retry-After": "60" } }
          );
        }
      }

      // General API: 200 requests/min per IP
      if (!rateLimit(`api:${ip}`, 200, 60_000)) {
        return NextResponse.json(
          { error: "Rate limit exceeded." },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        // Public routes — no auth needed
        const publicPaths = ["/", "/auth/signin", "/auth/signup", "/api/auth", "/api/health"];
        if (publicPaths.some((p) => pathname.startsWith(p))) return true;

        // Everything else needs a valid session
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/notebook/:path*",
    "/api/((?!auth|health).)*",
  ],
};