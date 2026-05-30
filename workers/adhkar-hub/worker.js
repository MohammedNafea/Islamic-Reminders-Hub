/**
 * Cloudflare Worker: مركز الأذكار - Secure Global Proxy
 * يعمل كـ HTTPS reverse proxy آمن لـ GitHub Pages
 * يدعم: UAE، السعودية، كل دول العالم، Huawei Petal Browser
 */

const ORIGIN = "https://mohammednafea.github.io/Islamic-Reminders-Hub";
const DOMAIN = "adhkar.thedarkgalaxy.com";

// Security headers - محسّنة لـ Petal Browser وكل المتصفحات
const SECURITY_HEADERS = {
  // HTTPS enforcement
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  
  // Security
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  
  // Permissions - مهم لـ Petal Browser
  "Permissions-Policy": [
    "geolocation=(self)",
    "camera=()",
    "microphone=()",
    "payment=()",
    "usb=()",
    "accelerometer=(self)",
    "gyroscope=(self)",
    "magnetometer=(self)",
    "orientation-sensor=(self)",
    "ambient-light-sensor=(self)"
  ].join(", "),
  
  // CORS - يسمح بتحميل الموارد الخارجية
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, Accept",
  
  // Cross-Origin
  "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  "Cross-Origin-Resource-Policy": "cross-origin",
  "Cross-Origin-Embedder-Policy": "unsafe-none",
  
  // Content Security Policy - متوازن للأمان والتوافق
  "Content-Security-Policy": [
    "default-src 'self' https: data: blob:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' https: data: blob:",
    "media-src 'self' https://everyayah.com https://cdn.islamic.network https://server8.mp3quran.net https://server7.mp3quran.net https://download.quranicaudio.com https://verse.mp3quran.net blob: data:",
    "connect-src 'self' https: wss: blob:",
    "worker-src 'self' blob:",
    "frame-src 'self' https:",
    "object-src 'none'",
    "base-uri 'self'",
    "upgrade-insecure-requests"
  ].join("; "),
  
  // Remove server info
  "Server": "Cloudflare",
  "X-Powered-By": "",
  
  // Cache control for HTML
  "Vary": "Accept-Encoding",
};

const CACHE_HEADERS = {
  // Assets - long cache
  js:   "public, max-age=31536000, immutable",
  css:  "public, max-age=31536000, immutable",
  png:  "public, max-age=31536000, immutable",
  jpg:  "public, max-age=31536000, immutable",
  svg:  "public, max-age=31536000, immutable",
  ico:  "public, max-age=86400",
  woff2:"public, max-age=31536000, immutable",
  mp3:  "public, max-age=2592000",
  // Dynamic
  html: "no-cache, no-store, must-revalidate",
  json: "no-cache",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        }
      });
    }
    
    // Force HTTPS redirect
    if (url.protocol === "http:") {
      return Response.redirect(`https://${url.host}${url.pathname}${url.search}`, 301);
    }

    // Build origin URL
    let originPath = url.pathname;
    
    // Remove domain prefix if proxied incorrectly
    if (originPath.startsWith(`/${DOMAIN}`)) {
      originPath = originPath.slice(DOMAIN.length + 1);
    }
    
    const originUrl = new URL(ORIGIN);
    originUrl.pathname = originPath || "/";
    originUrl.search = url.search;
    
    // Cache key
    const cacheKey = new Request(originUrl.toString(), { method: "GET" });
    const cache = caches.default;
    
    // Check cache for static assets
    const ext = originPath.split('.').pop()?.toLowerCase();
    const isCacheable = ['js','css','png','jpg','svg','ico','woff2','mp3','webp'].includes(ext || '');
    
    if (isCacheable) {
      const cached = await cache.match(cacheKey);
      if (cached) {
        const headers = new Headers(cached.headers);
        addSecurityHeaders(headers);
        return new Response(cached.body, { status: cached.status, headers });
      }
    }
    
    // Fetch from GitHub Pages origin
    let response;
    try {
      response = await fetch(originUrl.toString(), {
        method: request.method,
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; CloudflareWorker/1.0)",
          "Accept": request.headers.get("Accept") || "*/*",
          "Accept-Encoding": "gzip, br",
          "Host": "mohammednafea.github.io",
        },
        cf: {
          cacheTtl: isCacheable ? 86400 : 0,
          cacheEverything: isCacheable,
          // Use nearest PoP for UAE, Saudi Arabia, etc.
          resolveOverride: "mohammednafea.github.io",
        }
      });
    } catch (err) {
      return new Response(`<html dir="rtl"><body style="font-family:sans-serif;text-align:center;padding:2rem;background:#0a1f0a;color:#c8a84b">
        <h1>مركز الأذكار</h1>
        <p>جارٍ الاتصال... حاول مرة أخرى</p>
        <button onclick="location.reload()" style="background:#c8a84b;color:#0a1f0a;border:none;padding:.5rem 1rem;border-radius:.5rem;cursor:pointer">إعادة المحاولة</button>
      </body></html>`, {
        status: 503,
        headers: { "Content-Type": "text/html; charset=utf-8", "Retry-After": "5" }
      });
    }
    
    // Handle 404 - SPA fallback to index.html
    if (response.status === 404 && !ext) {
      const indexUrl = new URL(ORIGIN + "/index.html");
      const indexResponse = await fetch(indexUrl.toString(), {
        headers: { "Host": "mohammednafea.github.io" }
      });
      
      if (indexResponse.ok) {
        let html = await indexResponse.text();
        // Inject base tag for correct asset loading
        html = html.replace('<head>', `<head><base href="/">`);
        
        const headers = new Headers({
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        });
        addSecurityHeaders(headers);
        
        return new Response(html, { status: 200, headers });
      }
    }
    
    // Build response with security headers
    const headers = new Headers(response.headers);
    
    // Remove GitHub Pages/server headers
    headers.delete("server");
    headers.delete("x-github-request-id");
    headers.delete("x-served-by");
    headers.delete("x-fastly-request-id");
    headers.delete("via");
    headers.delete("age");
    
    addSecurityHeaders(headers);
    
    // Set cache for static assets
    if (isCacheable && response.ok) {
      headers.set("Cache-Control", CACHE_HEADERS[ext] || "public, max-age=86400");
    } else if (!isCacheable) {
      headers.set("Cache-Control", "no-cache, no-store, must-revalidate");
    }
    
    const newResponse = new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
    
    // Cache static assets
    if (isCacheable && response.ok) {
      ctx.waitUntil(cache.put(cacheKey, newResponse.clone()));
    }
    
    return newResponse;
  }
};

function addSecurityHeaders(headers) {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (value) headers.set(key, value);
    else headers.delete(key);
  }
}
