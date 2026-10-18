import { useState, useRef, useCallback } from "react";
import Spinner from "./Spinner";

const UploadInput = ({ allInfo, setAllInfo, loading, handleSubmit }) => {
	const [showPassword, setShowPassword] = useState(false);
	const [dragging, setDragging] = useState(false);
	const fileInputRef = useRef(null);

	const setFile = useCallback(
		(file) => setAllInfo((prev) => ({ ...prev, file })),
		[setAllInfo],
	);

	const handleDrop = (event) => {
		event.preventDefault();
		event.stopPropagation();
		setDragging(false);
		if (event.dataTransfer.files?.[0]) setFile(event.dataTransfer.files[0]);
	};

	const handleDragOver = (event) => {
		event.preventDefault();
		event.stopPropagation();
		setDragging(true);
	};

	const handleDragLeave = (event) => {
		event.preventDefault();
		event.stopPropagation();
		setDragging(false);
	};

	const handleFileChange = useCallback(
		(event) => {
			if (event.target.files?.[0]) setFile(event.target.files[0]);
		},
		[setFile],
	);

	const handlePasswordChange = useCallback(
		(event) => {
			setAllInfo((prev) => ({ ...prev, password: event.target.value }));
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
			filename: "",
			size: 0,
		});
		if (fileInputRef.current) fileInputRef.current.value = "";
	}, [setAllInfo]);

	const handleShowPasswordToggle = () => setShowPassword((prev) => !prev);

	return (
		<div className="w-full space-y-3">
			<div
				role="button"
				tabIndex={0}
				onClick={() => fileInputRef.current?.click()}
				onDrop={handleDrop}
				onDragOver={handleDragOver}
				onDragLeave={handleDragLeave}
				onKeyDown={(event) => {
					if (event.key === "Enter" || event.key === " ") {
						event.preventDefault();
						fileInputRef.current?.click();
					}
				}}
				className={`w-full border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors ${
					dragging
						? "border-accent-500 bg-accent-50"
						: "border-stone-200 hover:border-stone-300 bg-stone-50/50"
				}`}
			>
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					onChange={handleFileChange}
					disabled={loading}
					aria-label="Choose a file"
				/>
				{allInfo.file ? (
					<p className="text-sm font-mono text-stone-800 break-all">
						{allInfo.file.name}
						<span className="text-stone-400">
							{" "}
							· {(allInfo.file.size / 1024).toFixed(1)} KB
						</span>
					</p>
				) : (
					<>
						<p className="text-sm font-medium text-stone-600">
							Drop a file here
						</p>
						<p className="mt-1 text-xs text-stone-400">
							or click to browse · max 100MB
						</p>
					</>
				)}
			</div>

			<div>
				<label
					htmlFor="upload-password"
					className="block text-xs font-medium text-stone-500 mb-1"
				>
					Password <span className="font-normal text-stone-400">(optional)</span>
				</label>
				<div className="relative">
					<input
						id="upload-password"
						type={showPassword ? "text" : "password"}
						className="w-full px-3 py-2 pr-16 text-sm font-mono text-stone-800 bg-white border border-stone-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-400/40 focus:border-accent-500 transition-shadow"
						placeholder="Lock this file"
						value={allInfo.password}
						onChange={handlePasswordChange}
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

			<label className="flex items-center gap-2 text-sm text-stone-600 select-none cursor-pointer">
				<input
					type="checkbox"
					checked={allInfo.deleteAfterDownload}
					onChange={handleDeleteAfterDownload}
					disabled={loading}
					className="w-4 h-4 rounded accent-accent-600"
				/>
				Delete after download
			</label>

			<div className="flex gap-2 pt-1">
				<button
					type="button"
					onClick={handleSubmit}
					disabled={loading}
					className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-accent-600 hover:bg-accent-700 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{loading ? <Spinner /> : null}
					{loading ? "Uploading…" : "Upload file"}
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

export default UploadInput;