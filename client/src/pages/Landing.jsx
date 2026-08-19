import UploadFile from "../components/UploadFile";
import DownloadFile from "../components/DownloadFile";

const Landing = () => {
	return (
		<div className="min-h-screen flex flex-col">
			<header className="sticky top-0 z-10 bg-paper/85 backdrop-blur border-b border-stone-200/80">
				<div className="max-w-5xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
					<a
						href="/"
						className="font-mono text-sm tracking-tight text-ink"
						aria-label="EZUPS home"
					>
						ezups<span className="text-accent-600">.</span>
					</a>
					<span className="text-xs text-stone-400 font-mono hidden sm:inline">
						upload anything
					</span>
				</div>
			</header>

			<main className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-16">
				<section className="text-center mb-10 sm:mb-14">
					<h1 className="text-3xl sm:text-5xl font-semibold tracking-tight text-ink">
						Send it over.
						<span className="text-accent-600"> Grab it anywhere.</span>
					</h1>
					<p className="mt-4 text-stone-500 max-w-xl mx-auto leading-relaxed">
						Drop a file, protect it with a password, and hand out a key. No
						accounts, no tracking — the file is gone when you say so.
					</p>
				</section>

				<section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
					<div className="bg-white border border-stone-200 rounded-xl shadow-sm">
						<div className="px-6 pt-5 pb-4 border-b border-stone-100">
							<h2 className="text-sm font-semibold text-ink flex items-center gap-2">
								<span className="inline-block w-1.5 h-1.5 rounded-full bg-accent-600" />
								Upload a file
							</h2>
						</div>
						<div className="p-6">
							<UploadFile />
						</div>
					</div>

					<div className="bg-white border border-stone-200 rounded-xl shadow-sm">
						<div className="px-6 pt-5 pb-4 border-b border-stone-100">
							<h2 className="text-sm font-semibold text-ink flex items-center gap-2">
								<span className="inline-block w-1.5 h-1.5 rounded-full bg-stone-300" />
								Retrieve a file
							</h2>
						</div>
						<div className="p-6">
							<DownloadFile />
						</div>
					</div>
				</section>
			</main>

			<footer className="border-t border-stone-200/80">
				<div className="max-w-5xl mx-auto px-5 sm:px-8 py-6 flex items-center justify-between text-xs text-stone-400">
					<span className="font-mono">ezups v2.0.0</span>
					<span>self-hosted · no tracking</span>
				</div>
			</footer>
		</div>
	);
};

export default Landing;