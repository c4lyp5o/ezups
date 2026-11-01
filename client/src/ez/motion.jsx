// ez motion layer (motion.dev) — ported from ezllm/web/src/components/motion.tsx.
// Every animation goes through here so that:
//   1. reduced motion is honoured: each primitive renders the settled state
//      with no animation at all (MotionConfig alone would still run fades);
//   2. durations come from one place;
//   3. nothing replays on a poll — entrances run once per mount.
// Rules: transform + opacity only, 300–450ms, expo-out. Table rows fade, never
// translate. A StaggerItem needs a Stagger parent. Never initial={false} on a
// page-level AnimatePresence.
import {
	AnimatePresence,
	MotionConfig,
	motion,
	useMotionValue,
	useMotionValueEvent,
	useSpring,
} from "motion/react";
import { useEffect, useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { cx } from "./lib";

export const DUR = { fast: 0.14, base: 0.22, slow: 0.36 };
export const EASE = [0.22, 1, 0.36, 1];
export const rise = { duration: DUR.base, ease: EASE };
export const spring = { type: "spring", stiffness: 420, damping: 34, mass: 0.8 };
const ENTER = { duration: 0.42, ease: EASE };

const QUERY = "(prefers-reduced-motion: reduce)";
function subscribeMotion(fn) {
	if (typeof window === "undefined" || !window.matchMedia) return () => {};
	const q = window.matchMedia(QUERY);
	q.addEventListener("change", fn);
	return () => q.removeEventListener("change", fn);
}
const readMotion = () =>
	(typeof window !== "undefined" && window.matchMedia?.(QUERY).matches) || false;

/** True when the OS asks for less motion. */
export function useReducedMotion() {
	return useSyncExternalStore(subscribeMotion, readMotion, () => false);
}

/** Mount once at the root (main.jsx). */
export function MotionRoot({ children }) {
	const reduce = useReducedMotion();
	return <MotionConfig reducedMotion={reduce ? "always" : "never"}>{children}</MotionConfig>;
}

/** A block that rises into place the first time it scrolls into view. */
export function Reveal({ children, delay = 0, className, y = 12 }) {
	const reduce = useReducedMotion();
	if (reduce) return <div className={className}>{children}</div>;
	return (
		<motion.div
			className={className}
			initial={{ opacity: 0, y }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-40px" }}
			transition={{ ...ENTER, delay }}
		>
			{children}
		</motion.div>
	);
}

/** Staggered group; children must be DIRECT <StaggerItem>s. */
export function Stagger({ children, className, step = 0.06, as = "div" }) {
	const reduce = useReducedMotion();
	const Plain = as;
	if (reduce) return <Plain className={className}>{children}</Plain>;
	const Comp = motion[as];
	return (
		<Comp
			className={className}
			initial="hidden"
			animate="show"
			variants={{ show: { transition: { staggerChildren: step, delayChildren: 0.02 } } }}
		>
			{children}
		</Comp>
	);
}

export const staggerItem = {
	hidden: { opacity: 0, y: 12 },
	show: { opacity: 1, y: 0, transition: ENTER },
};
/** Table rows: opacity only (a transform on <tr> detaches it from its columns). */
export const staggerRow = { hidden: { opacity: 0 }, show: { opacity: 1, transition: ENTER } };

/** `min-w-0` is load-bearing: a grid/flex child defaults to min-width:auto. */
export function StaggerItem({ children, className, as = "div" }) {
	const reduce = useReducedMotion();
	const Plain = as;
	if (reduce) return <Plain className={cx("min-w-0", className)}>{children}</Plain>;
	const Comp = motion[as];
	return (
		<Comp className={cx("min-w-0", className)} variants={as === "tr" ? staggerRow : staggerItem}>
			{children}
		</Comp>
	);
}

/** The screen's arrival: an 8px rise, keyed by the caller on the route/view. */
export function Screen({ children, className }) {
	const reduce = useReducedMotion();
	if (reduce) return <div className={className}>{children}</div>;
	return (
		<motion.div
			className={className}
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			exit={{ opacity: 0, y: -6, transition: { duration: DUR.fast, ease: EASE } }}
			transition={{ duration: 0.32, ease: EASE }}
		>
			{children}
		</motion.div>
	);
}

/** The one selection mark: a 1px accent line as wide as its label that SLIDES
 *  between choices (shared layoutId). Render inside a `relative` label. */
export function SelectionLine({ layoutId, className }) {
	return (
		<motion.span
			layoutId={layoutId}
			aria-hidden
			className={cx("pointer-events-none absolute inset-x-0 -bottom-px h-px bg-accent", className)}
			transition={spring}
		/>
	);
}

/** Live rows enter from the top and collapse on exit. Stable keys only. */
export function SlideRow({ children, className, as = "div", ...rest }) {
	const reduce = useReducedMotion();
	if (reduce) {
		const Plain = as;
		return (
			<Plain className={className} {...rest}>
				{children}
			</Plain>
		);
	}
	const Comp = motion[as];
	const row = as === "tr";
	return (
		<Comp
			className={className}
			layout={row ? undefined : "position"}
			initial={row ? { opacity: 0 } : { opacity: 0, y: -8 }}
			animate={row ? { opacity: 1 } : { opacity: 1, y: 0 }}
			exit={row ? { opacity: 0 } : { opacity: 0, height: 0, marginTop: 0, marginBottom: 0 }}
			transition={spring}
			{...rest}
		>
			{children}
		</Comp>
	);
}

/** Count-up for large totals (>= 10,000). Exact small counts never tween. */
export function CountUp({
	value,
	format = (n) => Math.round(n).toLocaleString("en-US"),
	className,
}) {
	const ref = useRef(null);
	const reduce = useReducedMotion();
	const tween = Number.isFinite(value) && Math.abs(value) >= 10_000 && !reduce;
	const spring$ = useSpring(tween ? 0 : value, { stiffness: 120, damping: 22, mass: 0.6 });
	const text = useMotionValue(format(value));
	const fmt = useRef(format);
	useLayoutEffect(() => {
		fmt.current = format;
	});

	useEffect(() => {
		if (!tween) {
			text.set(fmt.current(value));
			return;
		}
		spring$.set(value);
	}, [value, tween, spring$, text]);

	useMotionValueEvent(spring$, "change", (latest) => text.set(fmt.current(latest)));
	useMotionValueEvent(text, "change", (latest) => {
		if (ref.current && ref.current.textContent !== latest) ref.current.textContent = latest;
	});
	// biome-ignore lint/correctness/useExhaustiveDependencies: first paint only
	useEffect(() => {
		if (ref.current) ref.current.textContent = fmt.current(value);
	}, []);
	return <span ref={ref} className={className} />;
}

/** A user-opened panel: animates HEIGHT so the page never snaps. */
export function Collapse({ open, children, className }) {
	const reduce = useReducedMotion();
	if (reduce) return open ? <div className={className}>{children}</div> : null;
	return (
		<AnimatePresence initial={false}>
			{open && (
				<motion.div
					key="collapse"
					className={className}
					initial={{ height: 0, opacity: 0 }}
					animate={{ height: "auto", opacity: 1 }}
					exit={{ height: 0, opacity: 0 }}
					transition={{ duration: DUR.base, ease: EASE }}
					style={{ overflow: "hidden" }}
				>
					{children}
				</motion.div>
			)}
		</AnimatePresence>
	);
}

/** Reorderable row: slides to its new position (order is meaning). */
export function ReorderItem({ children, className }) {
	const reduce = useReducedMotion();
	if (reduce) return <div className={className}>{children}</div>;
	return (
		<motion.div className={className} layout transition={spring}>
			{children}
		</motion.div>
	);
}

/** A bar that draws in from the left (progress, meters). value 0..1. */
export function Bar({ value, className, tone = "accent" }) {
	const reduce = useReducedMotion();
	const pct = Math.max(0, Math.min(1, Number(value) || 0));
	const bg =
		{ accent: "bg-accent", ok: "bg-ok", warn: "bg-warn", bad: "bg-bad", ink: "bg-dim" }[tone] ??
		"bg-accent";
	return (
		<div className={cx("h-1 w-full overflow-hidden rounded-full bg-line", className)}>
			<motion.div
				className={cx("h-full origin-left rounded-full", bg)}
				initial={reduce ? false : { scaleX: 0 }}
				animate={{ scaleX: pct }}
				transition={reduce ? { duration: 0 } : { duration: DUR.slow, ease: EASE }}
			/>
		</div>
	);
}

export { AnimatePresence, motion };
