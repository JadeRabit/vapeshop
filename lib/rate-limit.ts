type Bucket = { count: number; resetAt: number };

const globalForRateLimit = globalThis as unknown as {
  authRateBuckets?: Map<string, Bucket>;
};

const buckets = (globalForRateLimit.authRateBuckets ??= new Map<string, Bucket>());
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 10;

/**
 * Best-effort process-local limiter. Serverless instances do not share memory,
 * so production deployments must also use Vercel WAF/edge rate limiting.
 */
export function checkAuthRateLimit(identifier: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const now = Date.now();
  const current = buckets.get(identifier);

  if (!current || current.resetAt <= now) {
    buckets.set(identifier, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (current.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  }

  current.count += 1;
  return { allowed: true };
}

export function clearAuthRateLimit(identifier: string) {
  buckets.delete(identifier);
}
