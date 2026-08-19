const NotFound = () => {
	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-paper text-center px-4">
			<p className="font-mono text-[7rem] sm:text-[10rem] leading-none font-semibold text-stone-200 select-none">
				404
			</p>
			<h1 className="text-lg font-semibold text-ink -mt-6 sm:-mt-10">
				This page doesn't exist
			</h1>
			<p className="mt-2 text-sm text-stone-500 max-w-sm">
				The file you're looking for was never uploaded — or it's already
				been deleted.
			</p>
			<a
				href="/"
				className="mt-8 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent-700 border border-stone-200 bg-white rounded-lg hover:bg-stone-50 hover:border-stone-300 transition-colors duration-150"
			>
				← Back home
			</a>
		</div>
	);
};

export default NotFound;