import { useState, useRef, useCallback } from "react";

const UploadInput = ({ allInfo, setAllInfo, loading, handleSubmit }) => {
	const [showPassword, setShowPassword] = useState(false);
	const fileInputRef = useRef(null);

	const handleDrop = (event) => {
		event.preventDefault();
		event.stopPropagation();
		if (event.dataTransfer.files?.[0]) {
			setAllInfo((prev) => ({ ...prev, file: event.dataTransfer.files[0] }));
		}
	};

	const handleDragOver = (event) => {
		event.preventDefault();
		event.stopPropagation();
	};

	const handleFileChange = useCallback(
		(event) => {
			if (event.target.files?.[0]) {
				setAllInfo((prev) => ({ ...prev, file: event.target.files[0] }));
			}
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

	const handleDeleteAfterDownload = useCallback(
		(event) => {
			setAllInfo((prev) => ({
				...prev,
				deleteAfterDownload: event.target.checked,
			}));
		},
		[setAllInfo],
	);

	const handleClear = useCallback(() => {
		setAllInfo({
			file: null,
			password: "",
			deleteAfterDownload: false,
			key: "",
		});
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, [setAllInfo]);

	const handleShowPasswordToggle = () => setShowPassword((prev) => !prev);

	return (
		<div className="flex flex-col items-center justify-center p-3 bg-gray-100 border border-gray-300 rounded-lg shadow-md w-11/12 mx-auto">
			<h2 className="text-lg font-semibold text-blue-700 mb-2">Upload</h2>
			<button
				type="button"
				className={`w-full h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer mb-2 transition-colors duration-150 ${
					allInfo.file
						? "border-blue-500 bg-blue-50"
						: "border-gray-300 bg-white"
				}`}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onClick={() => fileInputRef.current?.click()}
				aria-label="Drop file here or click to select"
				style={{ outline: "none" }}
			>
				{allInfo.file ? (
					<span className="text-gray-700 font-medium">{allInfo.file.name}</span>
				) : (
					<span className="text-gray-500">
						Drop file here or click to select
					</span>
				)}
				<input
					type="file"
					ref={fileInputRef}
					className="hidden"
					onChange={handleFileChange}
					aria-label="File input"
					multiple={false}
				/>
			</button>
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
			<div className="flex items-center mt-4 mb-4">
				<input
					type="checkbox"
					className="mr-2 h-5 w-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
					onChange={handleDeleteAfterDownload}
					checked={allInfo.deleteAfterDownload}
					aria-checked={allInfo.deleteAfterDownload}
					aria-label="Delete After Download"
				/>
				<label htmlFor="deleteAfterDownload" className="text-gray-700">
					Delete after download
				</label>
			</div>
			<div className="flex space-x-2 w-full">
				<button
					type="button"
					className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-150 disabled:opacity-50"
					onClick={handleSubmit}
					disabled={loading}
					aria-label="Upload File"
					aria-disabled={loading}
				>
					{loading ? "Uploading..." : "Upload"}
				</button>
				<button
					type="button"
					className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-150"
					onClick={handleClear}
					aria-label="Clear File"
				>
					Clear
				</button>
			</div>
		</div>
	);
};

export default UploadInput;
