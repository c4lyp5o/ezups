// Restrict an endpoint to requests originating on the same machine
// (127.0.0.1 / ::1). Used for healthcheck + purge.
export function localAuth({ request, server, set }) {
	const ip = (server?.requestIP?.(request)?.address || "").replace("::ffff:", "");
	if (ip === "127.0.0.1" || ip === "::1") return;
	set.status = 403;
	return { message: "Forbidden" };
}