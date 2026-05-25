const rateMap = new Map<string, { count: number; time: number }>();

// Clean up stale entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateMap) {
    if (now - val.time > 120000) rateMap.delete(key);
  }
}, 300000);

export function checkRateLimit(
  key: string,
  maxRequests: number,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (entry && now - entry.time < windowMs) {
    entry.count++;
    if (entry.count > maxRequests) return false;
  } else {
    rateMap.set(key, { count: 1, time: now });
  }
  return true;
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || 'unknown';
  return request.headers.get('x-real-ip') || 'unknown';
}
