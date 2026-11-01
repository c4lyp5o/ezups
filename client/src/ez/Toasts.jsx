import { useEffect, useState } from "react";
import { subscribeToasts } from "./toast";
import { Toaster } from "./ui";

/** Mount once near the root. ttl in ms. */
export default function Toasts({ ttl = 3500 }) {
	const [items, setItems] = useState([]);
	useEffect(
		() =>
			subscribeToasts((t) => {
				setItems((xs) => [...xs.slice(-3), t]);
				setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), ttl);
			}),
		[ttl],
	);
	return <Toaster items={items} onDismiss={(id) => setItems((xs) => xs.filter((x) => x.id !== id))} />;
}
