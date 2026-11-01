// App shell — ported from ezllm/web/src/App.tsx: a labelled 224px sidebar on
// desktop, a 48px top bar + sliding drawer on mobile, the screen's h1 at every
// width, and each screen arriving with an 8px rise. Router-agnostic: pass
// `nav` items with { key, label, icon?, href?, onSelect? } and the active key.
import { useCallback, useEffect, useState } from "react";
import { cx } from "./lib";
import {
	AnimatePresence,
	DUR,
	EASE,
	motion,
	SelectionLine,
	spring,
	useReducedMotion,
} from "./motion";
import { ThemeToggle } from "./theme";

/** The app mark: a 22px rounded square in the ground colour with the accent glyph. */
export function Mark({ glyph = "ez", className }) {
	return (
		<span
			aria-hidden
			className={cx(
				"inline-grid h-[22px] w-[22px] flex-none place-items-center rounded-[6px] border border-line-strong bg-surface text-[10px] font-semibold tracking-tight text-accent",
				className,
			)}
		>
			{glyph}
		</span>
	);
}

export function Brand({ name, glyph, scope }) {
	return (
		<div className="flex min-w-0 items-center gap-2.5">
			<Mark glyph={glyph} />
			<span className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{name}</span>
			{scope && (
				<span className="truncate border-l border-line-strong pl-3 text-[12px] text-mute">
					{scope}
				</span>
			)}
		</div>
	);
}

/* Build-time constants from vite.config.js `define`; guarded so tests and
   tools that skip the define still render. */
const APP_VERSION = typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : "";
const APP_REPO = typeof __APP_REPO__ !== "undefined" ? __APP_REPO__ : "";

/** Page footer, ezhost style: the running version, a dot, the repo link. */
export function Footer({ version = APP_VERSION, repo = APP_REPO, className }) {
	return (
		<footer
			className={cx(
				"flex items-center justify-center gap-2 border-t border-line py-5 text-[13px] text-mute",
				className,
			)}
		>
			{version && <span className="font-mono">v{version}</span>}
			{version && repo && <span aria-hidden>·</span>}
			{repo && (
				<a
					href={repo}
					target="_blank"
					rel="noopener noreferrer"
					title="Source on GitHub"
					className="rounded p-1 transition-colors hover:text-ink"
				>
					<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
						<path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.18-3.09-.12-.29-.51-1.46.11-3.04 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.58.23 2.75.11 3.04.74.81 1.18 1.83 1.18 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
					</svg>
					<span className="sr-only">Source on GitHub</span>
				</a>
			)}
		</footer>
	);
}

function NavList({ nav, active, onNavigate, renderLink }) {
	return (
		<nav className="flex flex-col gap-0.5 px-3" aria-label="Main">
			{nav.map((item) => {
				const on = item.key === active;
				const inner = (
					<>
						{item.icon && (
							<span
								className={cx(
									"flex h-4 w-4 items-center justify-center",
									on ? "text-ink" : "text-mute",
								)}
							>
								{item.icon}
							</span>
						)}
						<span className="relative inline-block pb-px">
							{item.label}
							{on && <SelectionLine layoutId="ez-nav-line" />}
						</span>
						{item.badge != null && (
							<span className="ml-auto font-mono text-[12px] text-mute">{item.badge}</span>
						)}
					</>
				);
				const cls = cx(
					"flex items-center gap-2.5 rounded-lg px-3 py-1.5 text-[13px] transition-colors hover:bg-hover",
					on ? "font-medium text-ink" : "text-mute hover:text-ink",
				);
				if (renderLink) return <div key={item.key}>{renderLink(item, cls, inner, onNavigate)}</div>;
				if (item.href)
					return (
						<a
							key={item.key}
							href={item.href}
							className={cls}
							aria-current={on ? "page" : undefined}
							onClick={onNavigate}
						>
							{inner}
						</a>
					);
				return (
					<button
						key={item.key}
						type="button"
						className={cx(cls, "w-full text-left")}
						aria-current={on ? "page" : undefined}
						onClick={() => {
							item.onSelect?.();
							onNavigate?.();
						}}
					>
						{inner}
					</button>
				);
			})}
		</nav>
	);
}

function SidebarContent({ brand, nav, active, onNavigate, footer, renderLink }) {
	return (
		<div className="flex h-full flex-col">
			<div className="flex h-14 items-center px-6">{brand}</div>
			<div className="min-h-0 flex-1 overflow-y-auto py-2">
				<NavList nav={nav} active={active} onNavigate={onNavigate} renderLink={renderLink} />
			</div>
			<div className="space-y-1 border-t border-line px-3 py-3">
				{footer}
				<ThemeToggle />
			</div>
		</div>
	);
}

/**
 * <Shell brand={<Brand name="ezconv" glyph="cv" />} nav={[...]} active="home"
 *        title="Convert" sub="…" aside={…} screenKey={route}>…</Shell>
 * Without `nav`, renders a single-column topbar layout (ezdyndns style).
 */
export function Shell({
	brand,
	nav,
	active,
	title,
	sub,
	aside,
	footer,
	screenKey,
	children,
	renderLink,
	topbarActions,
	width = "max-w-[1400px]",
}) {
	const [drawer, setDrawer] = useState(false);
	const reduce = useReducedMotion();
	const close = useCallback(() => setDrawer(false), []);
	useEffect(() => {
		if (!drawer) return;
		const onKey = (e) => e.key === "Escape" && setDrawer(false);
		document.addEventListener("keydown", onKey);
		document.body.classList.add("overflow-hidden");
		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.classList.remove("overflow-hidden");
		};
	}, [drawer]);

	const header = title && (
		<div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
			<h1 className="text-[24px] font-semibold tracking-[-0.01em] text-ink">{title}</h1>
			{sub && <p className="text-[14px] text-mute">{sub}</p>}
			{aside && (
				<div className="flex flex-wrap items-center gap-2 self-center sm:ml-auto">{aside}</div>
			)}
		</div>
	);
	const screen = (
		<AnimatePresence mode="wait">
			<motion.div
				key={screenKey ?? "screen"}
				className={title ? "mt-5" : undefined}
				initial={reduce ? false : { opacity: 0, y: 8 }}
				animate={{ opacity: 1, y: 0 }}
				exit={
					reduce ? undefined : { opacity: 0, y: -6, transition: { duration: DUR.fast, ease: EASE } }
				}
				transition={{ duration: 0.32, ease: EASE }}
			>
				{children}
			</motion.div>
		</AnimatePresence>
	);

	if (!nav) {
		return (
			<div className="flex min-h-dvh flex-col">
				<header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-line bg-bg px-4 sm:px-8">
					{brand}
					<div className="flex items-center gap-2">
						{topbarActions}
						<ThemeToggle compact />
					</div>
				</header>
				<main className={cx("mx-auto w-full flex-1 px-4 pt-7 pb-16 sm:px-8", width)}>
					{header}
					{screen}
				</main>
				<Footer />
			</div>
		);
	}

	return (
		<div className="flex min-h-dvh">
			<header className="fixed inset-x-0 top-0 z-30 flex h-12 items-center gap-3 border-b border-line bg-bg px-4 lg:hidden">
				<button
					type="button"
					aria-label="Open menu"
					onClick={() => setDrawer(true)}
					className="rounded-md border border-line p-1.5 text-dim hover:bg-hover hover:text-ink"
				>
					<svg
						viewBox="0 0 20 20"
						className="h-4 w-4"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
						strokeLinecap="round"
						aria-hidden
					>
						<path d="M3 5.5h14M3 10h14M3 14.5h14" />
					</svg>
				</button>
				{brand}
				<div className="ml-auto flex items-center gap-2">{topbarActions}</div>
			</header>

			<aside className="fixed top-0 bottom-0 left-0 z-30 hidden w-56 flex-col border-r border-line bg-bg lg:flex">
				<SidebarContent
					brand={brand}
					nav={nav}
					active={active}
					footer={footer}
					renderLink={renderLink}
				/>
			</aside>

			<AnimatePresence>
				{drawer && (
					<motion.div
						className="fixed inset-0 z-50 lg:hidden"
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: DUR.fast }}
					>
						{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop */}
						{/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape handled on document */}
						<div className="absolute inset-0 bg-overlay" onClick={close} />
						<motion.aside
							className="absolute top-0 bottom-0 left-0 w-64 border-r border-line bg-bg"
							initial={{ x: "-100%" }}
							animate={{ x: 0 }}
							exit={{ x: "-100%" }}
							transition={spring}
						>
							<SidebarContent
								brand={brand}
								nav={nav}
								active={active}
								onNavigate={close}
								footer={footer}
								renderLink={renderLink}
							/>
						</motion.aside>
					</motion.div>
				)}
			</AnimatePresence>

			<div className="flex min-w-0 flex-1 flex-col lg:ml-56">
				<main className="min-w-0 flex-1 px-4 pt-16 pb-16 lg:px-8 lg:pt-7">
					{topbarActions && (
						<div className="mb-4 hidden justify-end gap-2 lg:flex">{topbarActions}</div>
					)}
					{header}
					{screen}
				</main>
				<Footer />
			</div>
		</div>
	);
}
