import { useState, useCallback } from "react";

const DownloadInput = ({ setAllInfo, allInfo, loading, handleSubmit }) => {
	const [showPassword, setShowPassword] = useState(false);

	const handleKeyChange = useCallback(
		(event) => {
			setAllInfo((prev) => ({
				...prev,
				key: event.target.value,
			}));
		},
		[setAllInfo],
	);

	const handlePasswordChange = useCallback(
		(event) => {
			setAllInfo((prev) => ({
				...prev,
				password: event.target.value,
			}));
		},
		[setAllInfo],
	);

	const handleClear = useCallback(() => {
		setAllInfo({ key: "", password: "" });
	}, [setAllInfo]);

	const handleShowPasswordToggle = () => setShowPassword((prev) => !prev);

	return (
		<div className="flex flex-col items-center justify-center p-3 bg-gray-100 border border-gray-300 rounded-lg shadow-md w-11/12 mx-auto">
			<h2 className="text-lg font-semibold text-blue-700 mb-2">Download</h2>
			<input
				type="text"
				className="w-full p-1 text-base text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-12 mb-2"
				placeholder="Key"
				value={allInfo.key}
				onChange={handleKeyChange}
				aria-label="Key"
			/>
			<div className="relative w-full">
				<input
					type={showPassword ? "text" : "password"}
					className="w-full p-1 text-base text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 pr-12"
					value={allInfo.password}
					onChange={handlePasswordChange}
					placeholder="Password (optional)"
					aria-label="Password (optional)"
					autoComplete="off"
					disabled={loading}
				/>
				<button
					type="button"
					className="absolute right-2 top-1/2 transform -translate-y-1/2 text-xs text-gray-600 bg-gray-200 rounded px-2 py-1 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
					onClick={handleShowPasswordToggle}
					disabled={loading || allInfo.password === ""}
					tabIndex={-1}
					aria-pressed={showPassword}
					aria-label={showPassword ? "Hide password" : "Show password"}
				>
					{showPassword ? "Hide" : "Show"}
				</button>
			</div>
			<div className="flex space-x-2 w-full mt-4">
				<button
					type="button"
					className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50"
					onClick={handleSubmit}
					disabled={loading}
					aria-label="Download file"
					aria-disabled={loading}
				>
					{loading ? "Downloading..." : "Download"}
				</button>
				<button
					type="button"
					className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-150"
					onClick={handleClear}
					aria-label="Clear form"
				>
					Clear
				</button>
			</div>
		</div>
	);
};

export default DownloadInput;
