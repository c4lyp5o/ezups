import Backdrop from "../ez/Backdrop";
import { Screen } from "../ez/motion";
import { ThemeToggle } from "../ez/theme";
import { btn, cx } from "../ez/ui";

const NotFound = () => (
	<div className="relative isolate flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-bg px-4 text-center">
		<Backdrop className="-z-10" opacity={0.18} nodes={8} shift={2.4} />
		<Screen className="flex flex-col items-center">
			<p className="select-none font-mono text-[96px] leading-none font-semibold text-line-strong sm:text-[140px]">404</p>
			<h1 className="mt-4 text-[24px] font-semibold tracking-[-0.01em] text-ink">This page doesn't exist</h1>
			<p className="mt-2 max-w-sm text-[13px] text-mute">
				The file you're looking for was never uploaded, or it has already been deleted.
			</p>
			<a href="/" className={cx(btn.base, btn.primary, "mt-8")}>
				Back home
			</a>
			<ThemeToggle compact className="mt-6" />
		</Screen>
	</div>
);

export default NotFound;
