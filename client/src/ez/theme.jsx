// Theme state — ported from ezllm/web/src/utils/theme.ts + ThemeToggle.tsx.
// ONE rule: a stored choice wins, otherwise DARK. No prefers-color-scheme
// branch. The class is applied before first paint by the inline script in
// index.html (see THEME_BOOT below); this module mirrors it afterwards.
import { useCallback, useState } from "react";
import { cx } from "./lib";

const KEY = "ez.theme";
let transient = "dark";

export function readTheme() {
	try {
		return localStorage.getItem(KEY) === "light" ? "light" : "dark";
	} catch {
		return transient;
	}
}
export function applyTheme(t) {
	const root = document.documentElement;
	root.classList.toggle("dark", t === "dark");
	root.classList.toggle("light", t === "light");
	const meta = document.querySelector('meta[name="theme-color"]');
	if (meta) meta.setAttribute("content", t === "dark" ? "#171719" : "#f9fafb");
	window.dispatchEvent(new Event("ez-theme"));
}
export function setTheme(t) {
	transient = t;
	applyTheme(t);
	try {
		localStorage.setItem(KEY, t);
	} catch {
		/* the class still applies */
	}
}
export function useTheme() {
	const [theme, set] = useState(readTheme);
	const change = useCallback((t) => {
		setTheme(t);
		set(t);
	}, []);
	return [theme, change];
}

/** Sidebar/topbar switch. `compact` renders the icon only. */
export function ThemeToggle({ compact, className }) {
	const [theme, setT] = useTheme();
	const next = theme === "dark" ? "light" : "dark";
	return (
		<button
			type="button"
			role="switch"
			aria-checked={theme === "dark"}
			aria-label={`Theme: ${theme}. Switch to ${next} mode`}
			title={`Switch to ${next} mode`}
			onClick={() => setT(next)}
			className={cx(
				compact
					? "inline-grid h-[34px] w-[34px] place-items-center rounded-full border border-line-strong text-mute hover:bg-hover hover:text-ink"
					: "group flex w-full items-center gap-2.5 rounded-lg px-3 py-1.5 text-left transition-colors hover:bg-hover",
				className,
			)}
		>
			<span className="relative flex h-4 w-4 shrink-0 items-center justify-center" aria-hidden>
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					className={cx(
						"absolute h-3.5 w-3.5 transition-all duration-200",
						theme === "dark" ? "scale-100 opacity-100" : "scale-75 opacity-0",
					)}
					fill="none"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
				>
					<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
				</svg>
				<svg
					aria-hidden="true"
					viewBox="0 0 24 24"
					className={cx(
						"absolute h-3.5 w-3.5 transition-all duration-200",
						theme === "light" ? "scale-100 opacity-100" : "scale-75 opacity-0",
					)}
					fill="none"
					stroke="currentColor"
					strokeWidth="1.8"
					strokeLinecap="round"
				>
					<circle cx="12" cy="12" r="4" />
					<path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5M17.5 17.5 19 19M19 5l-1.5 1.5M6.5 17.5 5 19" />
				</svg>
			</span>
			{!compact && (
				<>
					<span className="text-[12px] text-mute transition-colors group-hover:text-ink">
						{theme === "dark" ? "Dark" : "Light"} mode
					</span>
					<span className="ml-auto text-[11px] text-mute/70">switch to {next}</span>
				</>
			)}
		</button>
	);
}
