import { useState } from "react";
import { toast } from "../ez/toast";
import { Bar, Collapse } from "../ez/motion";
import { btn, Chip, cx, inputCls, SectionLabel } from "../ez/ui";
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
	const [progress, setProgress] = useState(0);
	const [copied, setCopied] = useState(false);

	const handleSubmit = async () => {
		if (!allInfo.file) return toast.error("No file selected");
		if (allInfo.file.size > 100 * 1024 * 1024)
			return toast.error("File too big (max 100MB)");

		setAllInfo((prev) => ({ ...prev, key: "" }));
		setProgress(0);
		setLoading(true);

		try {
			const formData = new FormData();
			formData.append("file", allInfo.file);
			formData.append("password", allInfo.password);
			formData.append("deleteAfterDownload", allInfo.deleteAfterDownload);

			const xhr = new XMLHttpRequest();
			const result = await new Promise((resolve, reject) => {
				xhr.open("POST", "/api/v1/upload");
				xhr.upload.onprogress = (event) => {
					if (event.lengthComputable) {
						setProgress(Math.round((event.loaded / event.total) * 100));
					}
				};
				xhr.onload = () => {
					if (xhr.status >= 200 && xhr.status < 300) {
						try {
							resolve(JSON.parse(xhr.responseText));
						} catch {
							reject(new Error("Invalid server response"));
						}
					} else {
						let message = `HTTP error! status: ${xhr.status}`;
						try {
							const errorData = JSON.parse(xhr.responseText);
							if (errorData?.message) message = errorData.message;
						} catch {
							/* non-JSON error body */
						}
						reject(new Error(message));
					}
				};
				xhr.onerror = () =>
					reject(new Error("Network error during upload"));
				xhr.send(formData);
			});

			setAllInfo((prev) => ({
				...prev,
				key: result.key,
				filename: result.filename,
				size: result.size,
			}));
			setCopied(false);
			toast.success("File uploaded");
		} catch (error) {
			toast.error(error.message || "Something went wrong!");
		} finally {
			setLoading(false);
			setProgress(0);
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
			<UploadInput allInfo={allInfo} setAllInfo={setAllInfo} loading={loading} handleSubmit={handleSubmit} />
			<Collapse open={loading}>
				<div className="pt-4" aria-live="polite">
					<div className="mb-1.5 flex justify-between text-[12px]">
						<span className="text-mute">Uploading</span>
						<span className="font-mono text-ink">{progress}%</span>
					</div>
					<Bar value={progress / 100} />
				</div>
			</Collapse>
			<Collapse open={!!allInfo.key}>
				<div className="mt-5 border-t border-line pt-4" aria-live="polite">
					<div className="mb-2 flex items-center gap-2">
						<SectionLabel>Share your key</SectionLabel>
						<Chip tone="ok" className="ml-auto">
							Uploaded
						</Chip>
					</div>
					<div className="flex items-center gap-2">
						<input
							readOnly
							value={allInfo.key}
							aria-label="Upload key"
							onFocus={(e) => e.target.select()}
							className={cx(inputCls, "min-w-0 flex-1 font-code text-accent")}
						/>
						<button type="button" onClick={handleCopyKey} className={cx(btn.base, btn.ghost)}>
							{copied ? "Copied" : "Copy"}
						</button>
					</div>
					<p className="mt-2 text-[12px] text-mute">
						{allInfo.filename} · <span className="font-mono">{(allInfo.size / 1024).toFixed(1)} KB</span>
					</p>
				</div>
			</Collapse>
		</>
	);
};

export default UploadFile;
