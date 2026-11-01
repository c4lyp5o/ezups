// ez UI primitives — ported from ezllm/web/src/components/ui.tsx.
// Hand-built with Tailwind against the ez tokens; no component library.
import { motion } from "motion/react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { cx } from "./lib";
import { AnimatePresence, DUR, EASE, SelectionLine, spring, useReducedMotion } from "./motion";

export { cx };

// ── numbers: never abbreviated, a missing value is a grey dash ──────────────
export const nfmt = (v) => (Number.isFinite(v) ? v.toLocaleString("en-US") : "–");
export function fmtMoney(n, sign = "$") {
	if (!Number.isFinite(n)) return "–";
	const s = Math.abs(n).toLocaleString("en-US", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
	return `${n < 0 ? "-" : ""}${sign}${s}`;
}
export function pctWhole(part, total) {
	if (!total) return "–";
	return `${Math.round((part / total) * 100)}%`;
}

// ── buttons: one filled primary per screen, the INK inverted, never the accent ─
export const btn = {
	base: "inline-flex h-[34px] items-center justify-center gap-2 rounded-full px-4 text-[13px] font-medium whitespace-nowrap transition-colors duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60",
	sm: "inline-flex h-7 items-center justify-center gap-1.5 rounded-full px-3 text-[12px] font-medium whitespace-nowrap transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
	primary: "border border-ink bg-ink text-bg hover:border-dim hover:bg-dim",
	ghost: "border border-line-strong bg-transparent text-ink hover:bg-hover",
	danger: "border border-bad/50 bg-transparent text-bad hover:bg-bad-dim",
	text: "inline-flex items-center gap-1 border-b border-transparent px-0.5 py-1 text-[13px] text-ink hover:border-accent",
	icon: "inline-grid h-[34px] w-[34px] place-items-center rounded-full border border-line-strong text-mute hover:bg-hover hover:text-ink disabled:opacity-60",
};

// ── form controls ────────────────────────────────────────────────────────
export const inputCls =
	"w-full rounded-lg border border-line bg-raised px-3 py-2 text-[13px] transition-colors placeholder:text-mute hover:border-line-strong focus:border-accent focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:opacity-60";
export const selectCls = `${inputCls} pr-8`;
export const labelCls = "mb-1.5 block text-[12px] font-medium text-mute";

// ── surfaces ─────────────────────────────────────────────────────────────
/** Panel: 6px radius, one 1px line, no shadow at rest. */
export const panel = "rounded-lg border border-line bg-surface";
export const panelPad = "rounded-lg border border-line bg-surface p-5";

export function Panel({ title, aside, children, className, bodyClass }) {
	return (
		<section className={cx(panel, className)}>
			{(title || aside) && (
				<header className="flex items-center gap-3 border-b border-line px-5 py-3">
					{title && <SectionLabel>{title}</SectionLabel>}
					{aside && <div className="ml-auto flex items-center gap-2">{aside}</div>}
				</header>
			)}
			<div className={cx("p-5", bodyClass)}>{children}</div>
		</section>
	);
}

/** A panel's title: sentence case, the text face — no tracked capitals. */
export function SectionLabel({ children, className }) {
	return <div className={cx("text-[13px] font-semibold text-ink", className)}>{children}</div>;
}

/** The screen header: 24px title, the subtitle beside it. */
export function PageHeader({ title, sub, aside, className }) {
	return (
		<div className={cx("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
			<h1 className="text-[24px] font-semibold tracking-[-0.01em] text-ink">{title}</h1>
			{sub && <p className="text-[14px] text-mute">{sub}</p>}
			{aside && (
				<div className="flex flex-wrap items-center gap-2 self-center sm:ml-auto">{aside}</div>
			)}
		</div>
	);
}

/** A labelled figure: lead 30px, others 22px, exact and tabular. */
export function Stat({ label, value, note, lead, tone }) {
	const toneCls = { ok: "text-ok", warn: "text-warn", bad: "text-bad" }[tone] ?? "text-ink";
	return (
		<div className="min-w-0">
			<div className="text-[12px] text-mute">{label}</div>
			<div
				className={cx(
					"mt-1 font-mono font-semibold leading-tight",
					lead ? "text-[30px]" : "text-[22px]",
					toneCls,
				)}
			>
				{value ?? <span className="text-mute">–</span>}
			</div>
			{note && <div className="mt-1 text-[12px] text-mute">{note}</div>}
		</div>
	);
}

// ── chips: pale pairs, never saturated fills ─────────────────────────────
const chipTones = {
	neutral: "bg-raised text-dim",
	accent: "bg-accent-dim text-accent",
	ok: "bg-ok-dim text-ok",
	warn: "bg-warn-dim text-warn",
	bad: "bg-bad-dim text-bad",
};
export function Chip({ tone = "neutral", children, className, title }) {
	return (
		<span
			title={title}
			className={cx(
				"inline-flex flex-none items-center gap-1 whitespace-nowrap rounded-full px-2 py-[3px] text-[12px] font-medium leading-none",
				chipTones[tone] ?? chipTones.neutral,
				className,
			)}
		>
			{children}
		</span>
	);
}

/** A status dot: shape + word, never colour alone. */
export function Dot({ tone = "neutral", live }) {
	const bg =
		{ ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", accent: "bg-accent" }[tone] ?? "bg-mute";
	return (
		<span
			aria-hidden
			className={cx(
				"inline-block h-1.5 w-1.5 flex-none rounded-full",
				bg,
				live && "animate-pulse-soft",
			)}
		/>
	);
}

// ── loading ──────────────────────────────────────────────────────────────
/** A flat block at the value's real size. No sweep, no gradient. */
export function Skeleton({ className }) {
	return <div aria-hidden className={cx("rounded bg-shade", className)} />;
}
export function SkeletonRows({ rows = 5, cols = 4 }) {
	return (
		<div className="space-y-3.5">
			{Array.from({ length: rows }, (_, i) => (
				// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder
				<div key={i} className="flex items-center gap-4">
					{Array.from({ length: cols }, (_, j) => (
						<Skeleton
							// biome-ignore lint/suspicious/noArrayIndexKey: static placeholder
							key={j}
							className={cx("h-4", j === 0 ? "w-28" : j === cols - 1 ? "ml-auto w-10" : "w-20")}
						/>
					))}
				</div>
			))}
		</div>
	);
}
export function Spinner({ className }) {
	return (
		<svg
			className={cx("animate-spin", className ?? "h-3.5 w-3.5")}
			viewBox="0 0 24 24"
			fill="none"
			aria-hidden
		>
			<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
			<path
				className="opacity-90"
				d="M22 12A10 10 0 0 0 12 2"
				stroke="currentColor"
				strokeWidth="3"
				strokeLinecap="round"
			/>
		</svg>
	);
}
/** Never a blank stage: an indeterminate bar with words, never a fake percent. */
export function Loading({ label = "Loading…", className }) {
	const reduce = useReducedMotion();
	return (
		<div className={cx("flex w-full flex-col items-center gap-2.5 py-10", className)} role="status">
			<div className="relative h-[3px] w-[min(260px,70%)] overflow-hidden rounded-full bg-line">
				{reduce ? (
					<div className="absolute inset-0 bg-accent opacity-50" />
				) : (
					<motion.div
						className="absolute inset-y-0 left-0 w-[38%] rounded-full bg-accent"
						animate={{ x: ["-100%", "265%"] }}
						transition={{ duration: 1.15, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY }}
					/>
				)}
			</div>
			<span className="text-[13px] text-dim">{label}</span>
		</div>
	);
}

// ── empty state: the frame stays, one sentence in a dashed box ───────────
export function EmptyState({ title, hint, action, className }) {
	return (
		<div
			className={cx(
				"flex flex-col items-start gap-1 rounded border border-dashed border-line-strong px-4 py-3",
				className,
			)}
		>
			<p className="text-[13px] text-dim">{title}</p>
			{hint && <p className="max-w-prose text-[12px] leading-relaxed text-mute">{hint}</p>}
			{action && <div className="mt-3">{action}</div>}
		</div>
	);
}

// ── toggle: the semantic green when on, never the accent ─────────────────
export function Toggle({ checked, onChange, label, disabled }) {
	const reduce = useReducedMotion();
	return (
		<button
			type="button"
			role="switch"
			aria-checked={checked}
			aria-label={label}
			disabled={disabled}
			onClick={() => !disabled && onChange(!checked)}
			className={cx(
				"relative h-[18px] w-8 shrink-0 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60",
				checked ? "bg-ok" : "bg-line-strong",
			)}
		>
			<motion.span
				className="absolute top-[3px] left-[3px] h-3 w-3 rounded-full bg-white"
				animate={{ x: reduce ? (checked ? 14 : 0) : checked ? 14 : 0 }}
				transition={reduce ? { duration: 0 } : spring}
			/>
		</button>
	);
}

// ── segmented / tabs: the 1px accent line, sliding; no filled pills ─────
export function Segmented({ options, value, onChange, label, size = "md", className }) {
	const lineId = `seg-${useId()}`;
	return (
		// biome-ignore lint/a11y/useSemanticElements: a fieldset would bring its own box
		<div
			role="group"
			aria-label={label}
			className={cx("inline-flex flex-wrap items-center gap-1", className)}
		>
			{options.map((o) => {
				const key = typeof o === "string" ? o : o.key;
				const text = typeof o === "string" ? o : o.label;
				const on = key === value;
				return (
					<button
						key={key}
						type="button"
						title={o.title}
						aria-pressed={on}
						onClick={() => onChange(key)}
						className={cx(
							"rounded font-medium transition-colors hover:bg-hover",
							size === "sm" ? "px-1.5 py-0.5 text-[12px]" : "px-2 py-1 text-[13px]",
							on ? "text-ink" : "text-mute hover:text-ink",
						)}
					>
						<span className="relative inline-block pb-px">
							{text}
							{on && <SelectionLine layoutId={lineId} />}
						</span>
					</button>
				);
			})}
		</div>
	);
}

/** Underlined tabs on a rule (screen sub-navigation). */
export function Tabs({ tabs, value, onChange, label, className }) {
	const lineId = `tabs-${useId()}`;
	return (
		<nav
			className={cx("flex gap-1 overflow-x-auto border-b border-line", className)}
			aria-label={label}
		>
			{tabs.map((t) => {
				const key = typeof t === "string" ? t : t.key;
				const text = typeof t === "string" ? t : t.label;
				const on = key === value;
				return (
					<button
						key={key}
						type="button"
						aria-current={on ? "page" : undefined}
						onClick={() => onChange(key)}
						className="relative -mb-px whitespace-nowrap px-3 py-2 text-[13px] transition-colors hover:bg-transparent"
					>
						<span className={cx("relative z-10", on ? "text-ink" : "text-mute hover:text-ink")}>
							{text}
						</span>
						{on && <SelectionLine layoutId={lineId} className="inset-x-3" />}
					</button>
				);
			})}
		</nav>
	);
}

// ── modal: Enter submits, Escape/backdrop close unless busy ──────────────
export function Modal({ open, onClose, title, subtitle, children, footer, wide, busy, onSubmit }) {
	const ref = useRef(null);
	const requestClose = useCallback(() => {
		if (!busy) onClose();
	}, [busy, onClose]);
	// Focus + scroll lock belong to the closed → open transition only.
	useEffect(() => {
		if (!open) return;
		const prev = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		const opener = document.activeElement;
		const field = ref.current?.querySelector("input:not([type=hidden]),select,textarea");
		(field ?? ref.current)?.focus();
		return () => {
			document.body.style.overflow = prev;
			opener?.focus?.();
		};
	}, [open]);
	useEffect(() => {
		if (!open) return;
		const onKey = (e) => {
			if (e.key === "Escape") requestClose();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [open, requestClose]);

	const Body = onSubmit ? "form" : "div";
	return (
		<AnimatePresence>
			{open && (
				<motion.div
					className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-6"
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					exit={{ opacity: 0 }}
					transition={{ duration: DUR.fast }}
				>
					{/* biome-ignore lint/a11y/noStaticElementInteractions: backdrop click closes */}
					{/* biome-ignore lint/a11y/useKeyWithClickEvents: Escape is handled on document */}
					<div className="absolute inset-0 bg-overlay" onClick={requestClose} />
					<motion.div
						ref={ref}
						role="dialog"
						aria-modal="true"
						aria-label={title}
						tabIndex={-1}
						className={cx(
							"relative flex max-h-[90dvh] w-full flex-col rounded-t-xl border border-line bg-surface shadow-[0_12px_28px_rgba(0,0,0,.2)] sm:rounded-xl",
							wide ? "sm:max-w-3xl" : "sm:max-w-lg",
						)}
						initial={{ opacity: 0, y: 12, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: DUR.fast } }}
						transition={{ duration: DUR.base, ease: EASE }}
					>
						<Body
							className="flex min-h-0 flex-1 flex-col"
							onSubmit={
								onSubmit
									? (e) => {
											e.preventDefault();
											if (!busy) onSubmit();
										}
									: undefined
							}
						>
							<header className="flex items-start gap-3 border-b border-line px-5 py-4">
								<div className="min-w-0">
									<h2 className="text-[15px] font-semibold text-ink">{title}</h2>
									{subtitle && <p className="mt-0.5 text-[12px] text-mute">{subtitle}</p>}
								</div>
								<button
									type="button"
									aria-label="Close"
									onClick={requestClose}
									disabled={busy}
									className="ml-auto rounded-md p-1 text-mute hover:bg-hover hover:text-ink"
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
										<path d="M5 5l10 10M15 5L5 15" />
									</svg>
								</button>
							</header>
							<div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
							{footer && (
								<footer className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3">
									{typeof footer === "function" ? footer(requestClose) : footer}
								</footer>
							)}
						</Body>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	);
}

export function Kbd({ children }) {
	return (
		<kbd className="rounded border border-line bg-raised px-1.5 py-0.5 text-[11px] text-mute">
			{children}
		</kbd>
	);
}

/** Dismissable notice — "say what happened". tone: ok | bad | warn | neutral. */
export function Notice({ tone = "neutral", children, onClose, className }) {
	const border =
		{ ok: "border-l-ok", bad: "border-l-bad", warn: "border-l-warn" }[tone] ??
		"border-l-line-strong";
	return (
		<div
			role={tone === "bad" ? "alert" : "status"}
			className={cx(
				"flex items-start gap-3 rounded-lg border border-line border-l-2 bg-surface px-4 py-3 text-[13px] text-ink shadow-[0_12px_28px_rgba(0,0,0,.2)]",
				border,
				className,
			)}
		>
			<div className="min-w-0 flex-1">{children}</div>
			{onClose && (
				<button
					type="button"
					onClick={onClose}
					aria-label="Dismiss"
					className="text-mute hover:text-ink"
				>
					<svg
						viewBox="0 0 20 20"
						className="h-3.5 w-3.5"
						fill="none"
						stroke="currentColor"
						strokeWidth="1.8"
						strokeLinecap="round"
						aria-hidden
					>
						<path d="M5 5l10 10M15 5L5 15" />
					</svg>
				</button>
			)}
		</div>
	);
}

/** Stack of notices, top-right, sliding in. items: [{id, tone, text}] */
export function Toaster({ items, onDismiss }) {
	return (
		<div className="pointer-events-none fixed top-4 right-4 z-[60] flex w-[min(380px,calc(100vw-2rem))] flex-col gap-2">
			<AnimatePresence initial={false}>
				{items.map((t) => (
					<motion.div
						key={t.id}
						layout
						className="pointer-events-auto"
						initial={{ opacity: 0, y: -8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, x: 16, transition: { duration: DUR.fast } }}
						transition={spring}
					>
						<Notice tone={t.tone} onClose={() => onDismiss(t.id)}>
							{t.text}
						</Notice>
					</motion.div>
				))}
			</AnimatePresence>
		</div>
	);
}

/** Simple hook for Toaster. */
export function useToasts(ttl = 4000) {
	const [items, setItems] = useState([]);
	const dismiss = useCallback((id) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
	const push = useCallback(
		(text, tone = "neutral") => {
			const id = Math.random().toString(36).slice(2);
			setItems((xs) => [...xs.slice(-3), { id, text, tone }]);
			if (ttl) setTimeout(() => dismiss(id), ttl);
			return id;
		},
		[ttl, dismiss],
	);
	return { items, push, dismiss };
}
