type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const entries = new Map<string, RateLimitEntry>();

export function allowRateLimitedRequest(
  key: string,
  limit = 8,
  windowMs = 10 * 60 * 1000,
): boolean {
  const now = Date.now();
  const current = entries.get(key);

  if (!current || current.resetAt <= now) {
    entries.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (current.count >= limit) return false;
  current.count += 1;
  return true;
}
