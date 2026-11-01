import { useCallback, useRef, useState } from "react";
import { AnimatePresence, motion, rise } from "../ez/motion";
import { btn, cx, inputCls, labelCls, Toggle } from "../ez/ui";
import Spinner from "./Spinner";

const UploadInput = ({ allInfo, setAllInfo, loading, handleSubmit }) => {
	const [showPassword, setShowPassword] = useState(false);
	const [dragging, setDragging] = useState(false);
	const fileInputRef = useRef(null);

	const setFile = useCallback((file) => setAllInfo((prev) => ({ ...prev, file })), [setAllInfo]);

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

	return (
		<div className="w-full space-y-4">
			{/* biome-ignore lint/a11y/useSemanticElements: a drop target that also opens the picker */}
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
				className={cx(
					"w-full cursor-pointer rounded-lg border border-dashed px-5 py-6 text-center transition-colors",
					dragging ? "border-accent bg-accent-dim" : "border-line-strong bg-inset hover:border-mute",
				)}
			>
				<input
					ref={fileInputRef}
					type="file"
					className="hidden"
					onChange={handleFileChange}
					disabled={loading}
					aria-label="Choose a file"
				/>
				<AnimatePresence mode="wait" initial={false}>
					{allInfo.file ? (
						<motion.p
							key="file"
							className="break-all text-[13px] text-ink"
							initial={{ opacity: 0, y: 6 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0 }}
							transition={rise}
						>
							{allInfo.file.name}
							<span className="font-mono text-mute"> · {(allInfo.file.size / 1024).toFixed(1)} KB</span>
						</motion.p>
					) : (
						<motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={rise}>
							<p className="text-[13px] text-ink">Drop a file here</p>
							<p className="mt-1 text-[12px] text-mute">or click to browse · up to 100 MB</p>
						</motion.div>
					)}
				</AnimatePresence>
			</div>

			<div>
				<label htmlFor="upload-password" className={labelCls}>
					Password <span className="font-normal">(optional)</span>
				</label>
				<div className="relative">
					<input
						id="upload-password"
						type={showPassword ? "text" : "password"}
						className={cx(inputCls, "pr-16")}
						placeholder="Lock this file"
						value={allInfo.password}
						onChange={handlePasswordChange}
						disabled={loading}
					/>
					<button
						type="button"
						onClick={() => setShowPassword((p) => !p)}
						className="absolute inset-y-0 right-0 px-3 text-[12px] text-mute hover:text-ink"
						aria-label={showPassword ? "Hide password" : "Show password"}
					>
						{showPassword ? "Hide" : "Show"}
					</button>
				</div>
			</div>

			<div className="flex items-center gap-3">
				<Toggle
					checked={allInfo.deleteAfterDownload}
					onChange={(v) => setAllInfo((prev) => ({ ...prev, deleteAfterDownload: v }))}
					label="Delete after download"
					disabled={loading}
				/>
				<span className="text-[13px] text-dim">Delete after download</span>
			</div>

			<div className="flex gap-2 pt-1">
				<button type="button" onClick={handleSubmit} disabled={loading} className={cx(btn.base, btn.primary, "flex-1")}>
					{loading ? <Spinner /> : null}
					{loading ? "Uploading…" : "Upload file"}
				</button>
				<button type="button" onClick={handleClear} disabled={loading} className={cx(btn.base, btn.ghost)}>
					Clear
				</button>
			</div>
		</div>
	);
};

export default UploadInput;
