// In-process replacement for the container cron jobs, so the image can run
// as the unprivileged `bun` user with no crond. Times are local to the
// process (the image sets TZ). Timers are unref()ed so tests and shutdown are
// never held open by a pending run.

const DAY = 24 * 60 * 60 * 1000;

/** Milliseconds from `now` to the next `hour`:00 local, optionally on `weekday` (0 = Sunday). */
export function msUntil(now, hour, weekday) {
	const next = new Date(now);
	next.setHours(hour, 0, 0, 0);
	if (weekday === undefined) {
		if (next <= now) next.setDate(next.getDate() + 1);
	} else {
		const ahead = (weekday - next.getDay() + 7) % 7;
		next.setDate(next.getDate() + ahead);
		if (next <= now) next.setDate(next.getDate() + 7);
	}
	return next - now;
}

/** Run `job` every day at `hour`:00 local, or once a week when `weekday` is given. */
export function schedule({ hour, weekday, name, job, log = console }) {
	const arm = () => {
		const timer = setTimeout(async () => {
			try {
				await job();
			} catch (error) {
				log.error(`[schedule] ${name} failed: ${error?.message || error}`);
			}
			arm();
		}, msUntil(new Date(), hour, weekday));
		timer.unref?.();
	};
	arm();
}

export const _test = { DAY };
