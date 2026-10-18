import { useState, useCallback } from "react";
import Spinner from "./Spinner";

const DownloadInput = ({ setAllInfo, allInfo, loading, handleSubmit }) => {
	const [showPassword, setShowPassword] = useState(false);

	const handleKeyChange = useCallback(
		(event) => {
			setAllInfo((prev) => ({ ...prev, key: event.target.value }));
		},
		[setAllInfo],
	);

	const handlePasswordChange = useCallback(
		(event) => {
			setAllInfo((prev) => ({ ...prev, password: event.target.value }));
		},
		[setAllInfo],
	);

	const handleClear = useCallback(() => {
		setAllInfo({ key: "", password: "" });
	}, [setAllInfo]);

	const handleShowPasswordToggle = () => setShowPassword((prev) => !prev);

	return (
		<div className="w-full space-y-3">
			<div>
				<label
					htmlFor="download-key"
					className="block text-xs font-medium text-stone-500 mb-1"
				>
					Key
				</label>
				<input
					id="download-key"
					type="text"
					className="w-full px-3 py-2 text-sm font-mono text-stone-800 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400/40 focus:border-accent-500 transition-shadow"
					placeholder="Paste your key"
					value={allInfo.key}
					onChange={handleKeyChange}
					onKeyDown={(event) => {
						if (event.key === "Enter") {
							event.preventDefault();
							handleSubmit();
						}
					}}
					disabled={loading}
				/>
			</div>

			<div>
				<label
					htmlFor="download-password"
					className="block text-xs font-medium text-stone-500 mb-1"
				>
					Password <span className="font-normal text-stone-400">(if set)</span>
				</label>
				<div className="relative">
					<input
						id="download-password"
						type={showPassword ? "text" : "password"}
						className="w-full px-3 py-2 pr-16 text-sm font-mono text-stone-800 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400/40 focus:border-accent-500 transition-shadow"
						placeholder="Enter password"
						value={allInfo.password}
						onChange={handlePasswordChange}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								event.preventDefault();
								handleSubmit();
							}
						}}
						disabled={loading}
					/>
					<button
						type="button"
						onClick={handleShowPasswordToggle}
						className="absolute inset-y-0 right-0 px-3 text-[11px] font-semibold tracking-wide text-stone-400 hover:text-accent-600 transition-colors"
						aria-label={showPassword ? "Hide password" : "Show password"}
					>
						{showPassword ? "HIDE" : "SHOW"}
					</button>
				</div>
			</div>

			<div className="flex gap-2 pt-1">
				<button
					type="button"
					onClick={handleSubmit}
					disabled={loading}
					className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent-600 hover:bg-accent-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{loading ? <Spinner /> : null}
					{loading ? "Fetching…" : "Get file"}
				</button>
				<button
					type="button"
					onClick={handleClear}
					disabled={loading}
					className="px-4 py-2.5 text-sm font-medium text-stone-600 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg transition-colors disabled:opacity-60"
				>
					Clear
				</button>
			</div>
		</div>
	);
};

export default DownloadInput;