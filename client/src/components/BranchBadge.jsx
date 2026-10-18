// Deployment indicator: which branch this bundle was built from.
const BranchBadge = () => {
	const branch = __APP_BRANCH__;
	const isMaster = branch === "master";
	const detail = `branch: ${branch} · NODE_ENV: ${__APP_NODE_ENV__}`;
	return (
		<div
			title={detail}
			data-branch={branch}
			className={[
				"fixed bottom-3 right-3 z-50 select-none rounded-full border px-2.5 py-1",
				"text-[11px] font-medium tabular-nums backdrop-blur-sm",
				isMaster
					? "border-stone-200 bg-white/80 text-stone-600 dark:border-stone-700 dark:bg-stone-900/80 dark:text-stone-300"
					: "border-amber-500/40 bg-amber-50/90 text-amber-800 dark:border-amber-400/30 dark:bg-amber-950/70 dark:text-amber-300",
			].join(" ")}
		>
			{branch}
		</div>
	);
};

export default BranchBadge;