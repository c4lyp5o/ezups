import { useState } from "react";
import { toast } from "react-toastify";
import UploadInput from "./UploadInput";

const UploadFile = () => {
	const [allInfo, setAllInfo] = useState({
		file: null,
		password: "",
		deleteAfterDownload: false,
		key: "",
		filename: "",
		size: 0,
	});
	const [loading, setLoading] = useState(false);
	const [copied, setCopied] = useState(false);

	const handleSubmit = async () => {
		if (!allInfo.file) return toast.error("No file selected");
		if (allInfo.file.size > 100 * 1024 * 1024)
			return toast.error("File too big (max 100MB)");

		setAllInfo((prev) => ({ ...prev, key: "" }));
		setLoading(true);

		try {
			const formData = new FormData();
			formData.append("file", allInfo.file);
			formData.append("password", allInfo.password);
			formData.append("deleteAfterDownload", allInfo.deleteAfterDownload);

			const response = await fetch("/api/v1/upload", {
				method: "POST",
				body: formData,
			});

			if (!response.ok) {
				let message = `HTTP error! status: ${response.status}`;
				try {
					const errorData = await response.json();
					if (errorData?.message) message = errorData.message;
				} catch {
					/* non-JSON error body */
				}
				throw new Error(message);
			}

			const data = await response.json();
			setAllInfo((prev) => ({
				...prev,
				key: data.key,
				filename: data.filename,
				size: data.size,
			}));
			setCopied(false);
			toast.success("File uploaded");
		} catch (error) {
			toast.error(error.message || "Something went wrong!");
		} finally {
			setLoading(false);
		}
	};

	const handleCopyKey = async () => {
		try {
			await navigator.clipboard.writeText(allInfo.key);
			setCopied(true);
			toast.success("Key copied");
		} catch {
			toast.error("Could not copy key");
		}
	};

	return (
		<>
			<UploadInput
				allInfo={allInfo}
				setAllInfo={setAllInfo}
				loading={loading}
				handleSubmit={handleSubmit}
			/>
			{allInfo.key && (
				<div className="mt-4 border-t border-stone-100 pt-4" aria-live="polite">
					<h3 className="text-xs font-semibold tracking-wide text-stone-400 uppercase mb-2">
						Share your key
					</h3>
					<div className="flex items-center gap-2">
						<input
							readOnly
							value={allInfo.key}
							aria-label="Upload key"
							className="flex-1 min-w-0 px-3 py-2 text-sm font-mono text-stone-800 bg-stone-50 border border-stone-300 rounded-lg focus:outline-none"
						/>
						<button
							type="button"
							onClick={handleCopyKey}
							className="px-3 py-2 text-sm font-medium text-accent-700 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
						>
							{copied ? "Copied" : "Copy"}
						</button>
					</div>
					<p className="mt-2 text-xs text-stone-500">
						{allInfo.filename} · {(allInfo.size / 1024).toFixed(1)} KB
					</p>
				</div>
			)}
		</>
	);
};

export default UploadFile;