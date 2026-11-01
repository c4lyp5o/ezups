import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { MotionRoot } from "./ez/motion";

createRoot(document.getElementById("root")).render(
	<StrictMode>
		<MotionRoot>
			<App />
		</MotionRoot>
	</StrictMode>,
);
