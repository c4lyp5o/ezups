import { useState } from "react";
import { toast } from "react-toastify";
import axios from "axios";

import UploadInput from "./UploadInput";

const UploadFile = () => {
	const [allInfo, setAllInfo] = useState({
		file: null,
		password: "",
		deleteAfterDownload: false,
	});
	const [uploadProgress, setUploadProgress] = useState(0);
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!allInfo.file) return toast.error("No file selected");
		if (allInfo.file.size > 100 * 1024 * 1024)
			return toast.error("File too big (max 100MB)");

		setAllInfo((prev) => ({ ...prev, key: "" }));
		setLoading(true);
		setUploadProgress(0);

		try {
			const formData = new FormData();
			formData.append("file", allInfo.file);
			formData.append("password", allInfo.password);
			formData.append("deleteAfterDownload", allInfo.deleteAfterDownload);

			const response = await axios.post("/api/v1/upload", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
				onUploadProgress: (progressEvent) => {
					const percent = Math.round(
						(progressEvent.loaded * 100) / progressEvent.total,
					);
					setUploadProgress(percent);
				},
			});

			const { key, password = "" } = response.data;
			setAllInfo((prev) => ({ ...prev, key, password }));
			toast.success("File uploaded");
		} catch (error) {
			toast.error("Something went wrong!");
		} finally {
			setLoading(false);
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
			{loading && (
				<div
					className="flex flex-col items-center justify-center p-3 bg-white border border-blue-300 rounded-lg shadow-lg w-11/12 mx-auto mt-3"
					aria-live="polite"
				>
					<span className="mb-2 text-blue-700 font-medium">
						Uploading: {uploadProgress}%
					</span>
					<div className="w-full max-w-md h-4 bg-gray-200 rounded-full overflow-hidden">
						<div
							className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300"
							style={{ width: `${uploadProgress}%` }}
							aria-valuenow={uploadProgress}
							aria-valuemin={0}
							aria-valuemax={100}
							role="progressbar"
							tabIndex={0}
						/>
					</div>
				</div>
			)}
			{allInfo?.key && (
				<div
					className="flex flex-col items-center justify-center p-3 bg-white border border-blue-300 rounded-lg shadow-lg w-11/12 mx-auto mt-3"
					aria-live="polite"
				>
					<h2 className="text-lg font-semibold text-blue-700 mb-2">
						Your Upload Credentials
					</h2>
					<div
						className={
							allInfo.password
								? "grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md"
								: "flex flex-col items-center w-full max-w-md"
						}
					>
						<div className="flex flex-col items-start mb-1">
							<span className="text-gray-600 text-sm mb-1" id="key-label">
								Key:
							</span>
							<div className="flex items-center space-x-2 w-full">
								<span
									className="font-mono text-base bg-gray-200 px-2 py-1 rounded select-all"
									data-testid="key-value"
									aria-labelledby="key-label"
								>
									{allInfo.key}
								</span>
								<button
									type="button"
									className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
									onClick={() => navigator.clipboard.writeText(allInfo.key)}
									aria-label="Copy key to clipboard"
								>
									Copy
								</button>
							</div>
						</div>
						{allInfo?.password && (
							<div className="flex flex-col items-start mb-1">
								<span
									className="text-gray-600 text-sm mb-1"
									id="password-label"
								>
									Password:
								</span>
								<div className="flex items-center space-x-2 w-full">
									<span
										className="font-mono text-base bg-gray-200 px-2 py-1 rounded select-all"
										data-testid="password-value"
										aria-labelledby="password-label"
									>
										{allInfo.password}
									</span>
									<button
										type="button"
										className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-200 rounded hover:bg-blue-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-150"
										onClick={() =>
											navigator.clipboard.writeText(allInfo.password)
										}
										aria-label="Copy password to clipboard"
									>
										Copy
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</>
	);
};

export default UploadFile;
