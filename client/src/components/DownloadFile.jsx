import { useState } from "react";
import { toast } from "react-toastify";
import DownloadInput from "./DownloadInput";

const DownloadFile = () => {
	const [allInfo, setAllInfo] = useState({
		key: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);

	const handleSubmit = async () => {
		if (!allInfo.key.trim()) return toast.error("Please enter a key");

		setLoading(true);

		try {
			const response = await fetch(
				`/api/v1/download?key=${encodeURIComponent(
					allInfo.key.trim(),
				)}&password=${encodeURIComponent(allInfo.password)}`,
				{ method: "GET" },
			);

			if (!response.ok) {
				throw new Error("No file found using the key provided!");
			}

			const blob = await response.blob();
			let filename = "downloaded_file";
			const disposition = response.headers.get("content-disposition");
			if (disposition?.includes("filename=")) {
				filename = disposition
					.split("filename=")[1]
					.replace(/"/g, "")
					.trim();
			}

			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = filename;
			document.body.appendChild(a);
			a.click();
			a.remove();
			window.URL.revokeObjectURL(url);
			toast.success("File downloaded!");
		} catch (error) {
			toast.error(error.message || "No file found using the key provided!");
		} finally {
			setLoading(false);
		}
	};

	return (
		<DownloadInput
			allInfo={allInfo}
			setAllInfo={setAllInfo}
			loading={loading}
			handleSubmit={handleSubmit}
		/>
	);
};

export default DownloadFile;