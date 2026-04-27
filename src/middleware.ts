import { NextResponse, type NextRequest } from "next/server";

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  
  // Skip middleware for admin routes - let them handle their own auth
  if (pathname.startsWith('/admin')) {
    return NextResponse.next();
  }
  
  // Skip middleware for API routes except admin API
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }
  
  const isApiRoute = pathname.startsWith("/api/");
  const url = new URL("/api/logger", request.url);
  const requestId = crypto.randomUUID();

  try {
    // Add timeout to prevent middleware hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    // 🔐 SECURITY: Only log safe, non-sensitive information
    const safeHeaders: Record<string, string> = {};
    const sensitiveHeaderKeys = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
    
    request.headers.forEach((value, key) => {
      if (!sensitiveHeaderKeys.includes(key.toLowerCase())) {
        safeHeaders[key] = value;
      } else {
        safeHeaders[key] = '[REDACTED]';
      }
    });

    await fetch(url.toString(), {
      method: "POST",
      signal: controller.signal,
      body: JSON.stringify({
        level: "info",
        requestId,
        request: {
          url: request.url,
          method: request.method,
          path: pathname,
          referrerPolicy: request.referrerPolicy,
          headers: safeHeaders,
          // 🔐 NEVER log cookies - they contain session tokens
          cookies: '[REDACTED]',
        },
      }),
    });
    
    clearTimeout(timeoutId);
  } catch (error) {
    // Silently fail logging to prevent cascading errors
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error("Error logging request:", error);
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", requestId);

  if (!isApiRoute) {
    response.cookies.set("x-request-id", requestId, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60,
      secure: request.url.startsWith("https"),
    });
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
