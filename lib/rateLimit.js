// Simple in-memory fixed-window rate limiter. Per-process only: use a shared
// store (e.g. Redis) if the app runs on multiple instances.
const buckets = new Map();

export function rateLimit(key, { limit = 10, windowMs = 60_000 } = {}) {
    const now = Date.now();

    if (buckets.size > 10_000) {
        for (const [k, v] of buckets) if (v.reset <= now) buckets.delete(k);
    }

    let bucket = buckets.get(key);
    if (!bucket || bucket.reset <= now) {
        bucket = { count: 0, reset: now + windowMs };
        buckets.set(key, bucket);
    }

    bucket.count += 1;
    return {
        ok: bucket.count <= limit,
        retryAfter: Math.ceil((bucket.reset - now) / 1000),
    };
}

export function getClientIp(req) {
    const headers = req?.headers;
    const get = (name) => (typeof headers?.get === "function" ? headers.get(name) : headers?.[name]);
    return (get("x-forwarded-for") || "").split(",")[0].trim() || get("x-real-ip") || "unknown";
}
