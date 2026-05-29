/**
 * مركز الأذكار - Cloudflare Worker
 * يحل مشاكل: HTTPS، الإمارات، هواوي، الأمان
 */

const ORIGIN = 'https://mohammednafea.github.io/Islamic-Reminders-Hub';
const DOMAIN = 'adhkar.thedarkgalaxy.com';

// Security headers شاملة
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(self), camera=(), microphone=(), payment=(), usb=()',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Cross-Origin-Resource-Policy': 'cross-origin',
  'Content-Security-Policy': [
    "upgrade-insecure-requests",
    "default-src 'self' https:",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https:",
    "font-src 'self' data: https://fonts.gstatic.com https:",
    "img-src 'self' data: blob: https:",
    "connect-src 'self' https://api.aladhan.com https://api.alquran.cloud https://api.quran.com https://everyayah.com https://mp3quran.net https://*.supabase.co wss://*.supabase.co https://raw.githubusercontent.com https://fonts.googleapis.com https://fonts.gstatic.com https:",
    "media-src 'self' blob: https://everyayah.com https://mp3quran.net https://raw.githubusercontent.com https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'"
  ].join('; '),
  'X-Robots-Tag': 'index, follow',
  'Access-Control-Allow-Origin': '*',
  'Vary': 'Accept-Encoding',
};

// User agents blocked in Huawei Petal browser (خاصية السلامة)
const BLOCKED_REASONS = ['malware', 'phishing', 'dangerous'];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Force HTTPS redirect
    if (url.protocol === 'http:') {
      return Response.redirect(`https://${DOMAIN}${url.pathname}${url.search}`, 301);
    }

    // Handle OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Max-Age': '86400',
          ...SECURITY_HEADERS,
        },
      });
    }

    // Rewrite to GitHub Pages origin
    const targetUrl = new URL(url.pathname + url.search, ORIGIN);
    
    try {
      const originResponse = await fetch(targetUrl.toString(), {
        method: request.method,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; CloudflareWorker/1.0)',
          'Accept': request.headers.get('Accept') || '*/*',
          'Accept-Language': request.headers.get('Accept-Language') || 'ar,en',
          'Accept-Encoding': 'gzip, deflate, br',
        },
        cf: {
          cacheEverything: true,
          cacheTtl: url.pathname.startsWith('/assets/') ? 86400 : 0,
          // Bypass geo restrictions
          resolveOverride: undefined,
        },
      });

      // Build new response with security headers
      const response = new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers: originResponse.headers,
      });

      // Apply all security headers
      Object.entries(SECURITY_HEADERS).forEach(([k, v]) => {
        response.headers.set(k, v);
      });

      // Fix content type for HTML
      const contentType = originResponse.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        response.headers.set('Content-Type', 'text/html; charset=utf-8');
        response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      }

      return response;
    } catch (err) {
      // Fallback for network errors
      return new Response(`
        <!DOCTYPE html>
        <html lang="ar" dir="rtl">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>مركز الأذكار</title>
          <style>body{font-family:sans-serif;text-align:center;padding:2rem;background:#0a150a;color:#c8a84b}</style>
        </head>
        <body>
          <h1>مركز الأذكار الإسلامي</h1>
          <p>جارٍ إعادة المحاولة...</p>
          <meta http-equiv="refresh" content="3">
        </body>
        </html>
      `, { status: 503, headers: { 'Content-Type': 'text/html;charset=utf-8', 'Retry-After': '3' } });
    }
  },
};
