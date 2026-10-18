import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

const branch = process.env.APP_BRANCH || "development";
const nodeEnv = process.env.NODE_ENV || "development";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	define: {
		__APP_BRANCH__: JSON.stringify(branch),
		__APP_NODE_ENV__: JSON.stringify(nodeEnv),
	},
	build: {
		outDir: "../public",
		emptyOutDir: true,
	},
	server: {
		port: 3000,
		proxy: {
			"/api": {
				target: "http://localhost:5000",
				changeOrigin: true,
				secure: false,
			},
		},
	},
});
