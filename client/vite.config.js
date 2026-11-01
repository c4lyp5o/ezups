import { readFileSync } from "node:fs";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

const branch = process.env.APP_BRANCH || "development";
const nodeEnv = process.env.NODE_ENV || "development";

// Footer: the running version and the source link, baked in at build time.
const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const APP_DEFINE = {
	__APP_VERSION__: JSON.stringify(pkg.version),
	__APP_REPO__: JSON.stringify("https://github.com/c4lyp5o/ezups"),
};

export default defineConfig({
	plugins: [react(), tailwindcss()],
	define: {
		...APP_DEFINE,
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
