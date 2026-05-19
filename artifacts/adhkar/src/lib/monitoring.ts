/**
 * Monitoring and Error Tracking Utility (Sentry/Analytics integration wrapper)
 * 
 * Provides automated logging, performance tracing, and error reporting for production deployments
 * on Cloudflare Pages / Vercel.
 */

interface MonitoringConfig {
  dsn?: string;
  environment?: string;
  release?: string;
}

class MonitoringService {
  private initialized = false;
  private config: MonitoringConfig = {};

  public init(config: MonitoringConfig) {
    if (this.initialized) return;
    this.config = {
      environment: import.meta.env.MODE || 'production',
      release: 'islamic-reminders-hub@1.0.0',
      ...config,
    };
    this.initialized = true;

    // Attach global error handlers
    if (typeof window !== 'undefined') {
      window.addEventListener('error', (event) => this.captureException(event.error || event.message));
      window.addEventListener('unhandledrejection', (event) => this.captureException(event.reason));
    }

    console.log(`[Monitoring] Initialized in ${this.config.environment} mode.`);
  }

  public captureException(error: unknown, context?: Record<string, unknown>) {
    console.error('[Monitoring: Exception]', error, context);
    // In a fully configured Sentry environment, Sentry.captureException(error, { extra: context }) would be invoked here.
  }

  public captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
    console.log(`[Monitoring: ${level.toUpperCase()}]`, message);
    // Sentry.captureMessage(message, level);
  }

  public measurePerformance(name: string, fn: () => void) {
    const start = performance.now();
    try {
      fn();
    } finally {
      const duration = performance.now() - start;
      if (duration > 500) { // Log slow operations > 500ms
        this.captureMessage(`Performance warning: ${name} took ${duration.toFixed(2)}ms`, 'warning');
      }
    }
  }
}

export const monitoring = new MonitoringService();
