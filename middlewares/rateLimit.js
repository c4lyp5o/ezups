import { RATE_LIMIT } from "../config.js";

const hits = new Map();
let lastSweep = 0;

// Resolve the caller's IP. Exactly one trusted proxy (traefik) sits in front of
// this app, and it APPENDS the socket address to X-Forwarded-For -- so the LAST
// hop is the only entry a client cannot forge. Reading the FIRST entry (what
// this did before) meant any client could send its own X-Forwarded-For and get
// a fresh bucket per request, which defeated the limiter and left the
// six-character share keys open to enumeration.
export function clientIp(request, server) {
	const forwarded = request.headers.get("x-forwarded-for");
	if (forwarded) {
		const hops = forwarded
			.split(",")
			.map((hop) => hop.trim())
			.filter(Boolean);
		if (hops.length > 0) return hops[hops.length - 1];
	}
	const real = request.headers.get("x-real-ip");
	if (real) return real.trim();
	return server?.requestIP?.(request)?.address || "unknown";
}

// Bun-native, dependency-free sliding-window limiter. Replaces express-rate-limit.
export function rateLimit({ request, server, set }) {
	const now = Date.now();
	const ip = clientIp(request, server);

	// Sweep at most once a second. Doing it on every request made the limiter
	// O(live IPs) per request, which is exactly the wrong shape under attack.
	if (now - lastSweep >= 1000) {
		lastSweep = now;
		for (const [k, v] of hits) {
			if (now >= v.resetAt) hits.delete(k);
		}
	}

	const entry = hits.get(ip);

	if (!entry || now >= entry.resetAt) {
		hits.set(ip, { count: 1, resetAt: now + RATE_LIMIT.windowMs });
		return;
	}

	entry.count += 1;
	if (entry.count > RATE_LIMIT.limit) {
		set.status = 429;
		return { message: "Too many requests from this IP, please try again after a minute" };
	}
}
