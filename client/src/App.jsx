import { BrowserRouter, Route, Routes } from "react-router";
import ErrorBoundary from "./components/ErrorBoundary";
import Toasts from "./ez/Toasts";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";

const App = () => (
	<ErrorBoundary>
		<Toasts />
		<BrowserRouter>
			<Routes>
				<Route index element={<Landing />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	</ErrorBoundary>
);

export default App;
