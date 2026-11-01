import { useCallback, useState } from "react";
import { btn, cx, inputCls, labelCls } from "../ez/ui";
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

	const onEnter = (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			handleSubmit();
		}
	};

	return (
		<div className="w-full space-y-4">
			<div>
				<label htmlFor="download-key" className={labelCls}>
					Key
				</label>
				<input
					id="download-key"
					type="text"
					className={cx(inputCls, "font-code")}
					placeholder="Paste your key"
					value={allInfo.key}
					onChange={handleKeyChange}
					onKeyDown={onEnter}
					disabled={loading}
				/>
			</div>

			<div>
				<label htmlFor="download-password" className={labelCls}>
					Password <span className="font-normal">(if one was set)</span>
				</label>
				<div className="relative">
					<input
						id="download-password"
						type={showPassword ? "text" : "password"}
						className={cx(inputCls, "pr-16")}
						placeholder="Enter password"
						value={allInfo.password}
						onChange={handlePasswordChange}
						onKeyDown={onEnter}
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

			<div className="flex gap-2 pt-1">
				<button type="button" onClick={handleSubmit} disabled={loading} className={cx(btn.base, btn.ghost, "flex-1")}>
					{loading ? <Spinner /> : null}
					{loading ? "Fetching…" : "Get file"}
				</button>
				<button type="button" onClick={handleClear} disabled={loading} className={cx(btn.base, btn.ghost)}>
					Clear
				</button>
			</div>
		</div>
	);
};

export default DownloadInput;
