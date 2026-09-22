import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Simple in-memory rate limiter (for production, use Redis/Upstash)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIp = req.headers.get("x-real-ip");
  return forwarded?.split(",")[0]?.trim() || realIp || "unknown";
}

function isRateLimited(ip: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }

  if (entry.count >= limit) {
    return true;
  }

  entry.count++;
  return false;
}

// Security headers
const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' http://localhost:3001 ws://localhost:3001",
    "frame-ancestors 'none'",
  ].join("; "),
};

export function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // Apply security headers
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.headers.set(key, value);
  });

  // Rate limiting for API routes
  if (req.nextUrl.pathname.startsWith("/api/")) {
    const ip = getClientIp(req);
    const isApiQuotes = req.nextUrl.pathname === "/api/quotes";
    const isBacktest = req.nextUrl.pathname.startsWith("/api/backtest");
    const isMarketData = req.nextUrl.pathname === "/api/market-data";
    const isOptions = req.nextUrl.pathname.startsWith("/api/options");

    // Stricter limits for heavier endpoints
    let limit = 60;
    let windowMs = 60_000; // 1 minute

    if (isBacktest) {
      limit = 10;
      windowMs = 60_000;
    } else if (isOptions) {
      limit = 30;
      windowMs = 60_000;
    } else if (isMarketData) {
      limit = 20;
      windowMs = 60_000;
    } else if (isApiQuotes) {
      limit = 120;
      windowMs = 60_000;
    }

    if (isRateLimited(ip, limit, windowMs)) {
      return new NextResponse(
        JSON.stringify({ error: "Rate limit exceeded. Please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(Math.ceil(windowMs / 1000)),
            ...securityHeaders,
          },
        }
      );
    }

    // Add rate limit headers
    const entry = rateLimitMap.get(ip);
    if (entry) {
      res.headers.set("X-RateLimit-Limit", String(limit));
      res.headers.set("X-RateLimit-Remaining", String(Math.max(0, limit - entry.count)));
      res.headers.set("X-RateLimit-Reset", String(Math.ceil(entry.resetAt / 1000)));
    }
  }

  return res;
}

export const config = {
  matcher: [
    "/api/:path*",
  ],
};