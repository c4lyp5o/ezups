import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router";
import { ToastContainer } from "react-toastify";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import BranchBadge from "./components/BranchBadge";

const App = () => {
	const [theme, setTheme] = useState(() => {
		try {
			return localStorage.getItem("theme") || "dark";
		} catch {
			return "dark";
		}
	});

	useEffect(() => {
		document.documentElement.classList.toggle("dark", theme === "dark");
		try {
			localStorage.setItem("theme", theme);
		} catch {
			/* ignore */
		}
	}, [theme]);

	const toggleTheme = () =>
		setTheme((prev) => (prev === "dark" ? "light" : "dark"));

	return (
		<>
			<ToastContainer
				position="top-right"
				autoClose={3000}
				hideProgressBar={false}
				newestOnTop={false}
				closeOnClick
				rtl={false}
				pauseOnFocusLoss
				draggable
				pauseOnHover
				theme={theme === "dark" ? "dark" : "light"}
			/>
			<BranchBadge />
			<BrowserRouter>
				<Routes>
					<Route
						index
						element={<Landing theme={theme} onToggleTheme={toggleTheme} />}
					/>
					<Route
						path="*"
						element={<NotFound theme={theme} onToggleTheme={toggleTheme} />}
					/>
				</Routes>
			</BrowserRouter>
		</>
	);
};

export default App;