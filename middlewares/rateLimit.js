import { RATE_LIMIT } from "../config.js";

const hits = new Map();

function clientIp(request, server) {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) return forwarded.split(",")[0].trim();
	const real = request.headers.get("x-real-ip");
	if (real) return real.trim();
	return server?.requestIP?.(request)?.address || "unknown";
}

// Bun-native, dependency-free sliding-window limiter. Replaces express-rate-limit.
export function rateLimit({ request, server, set }) {
	const now = Date.now();
	const ip = clientIp(request, server);
	const entry = hits.get(ip);

	if (!entry || now >= entry.resetAt) {
		hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
		// Opportunistic sweep so the map can't grow without bound.
		if (hits.size > 10_000) {
			for (const [k, v] of hits) {
				if (now >= v.resetAt) hits.delete(k);
			}
		}
		return;
	}

	entry.count += 1;
	if (entry.count > RATE_LIMIT.limit) {
		set.status = 429;
		return { message: "Too many requests from this IP, please try again after a minute" };
	}
}