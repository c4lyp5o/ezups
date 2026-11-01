import React from "react";

class ErrorBoundary extends React.Component {
	constructor(props) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError() {
		return { hasError: true };
	}

	componentDidCatch(error, info) {
		console.error("UI error:", error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 text-center">
					<p className="select-none font-mono text-[96px] leading-none font-semibold text-line-strong sm:text-[140px]">
						!
					</p>
					<h1 className="mt-4 text-[24px] font-semibold tracking-[-0.01em] text-ink">
						Something went wrong
					</h1>
					<p className="mt-2 max-w-sm text-[13px] text-mute">
						Reload the page to try again.
					</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="mt-8 inline-flex h-[34px] items-center justify-center gap-2 rounded-full border border-ink bg-ink px-4 text-[13px] font-medium text-bg hover:border-dim hover:bg-dim"
					>
						Reload
					</button>
				</div>
			);
		}
		return this.props.children;
	}
}

export default ErrorBoundary;