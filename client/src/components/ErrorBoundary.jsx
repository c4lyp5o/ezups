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
				<div className="min-h-screen flex flex-col items-center justify-center bg-paper text-center px-4">
					<p className="font-mono text-[7rem] sm:text-[10rem] leading-none font-semibold text-stone-200 select-none">
						!
					</p>
					<h1 className="text-lg font-semibold text-ink -mt-6 sm:-mt-10">
						Something went wrong
					</h1>
					<p className="mt-2 text-sm text-stone-500 max-w-sm">
						Reload the page to try again.
					</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="mt-8 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent-700 border border-stone-200 bg-white rounded-lg hover:bg-stone-50 transition-colors"
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