// Tiny toast bus with react-toastify's call shape: toast.success / toast.error
// / toast.info. <Toasts /> renders them with the kit's Notice (motion slide-in).
const listeners = new Set();
let seq = 0;
function emit(text, tone) {
	const id = ++seq;
	for (const fn of listeners) fn({ id, text: String(text), tone });
	return id;
}
export const toast = Object.assign((t) => emit(t, "neutral"), {
	success: (t) => emit(t, "ok"),
	error: (t) => emit(t, "bad"),
	warn: (t) => emit(t, "warn"),
	warning: (t) => emit(t, "warn"),
	info: (t) => emit(t, "neutral"),
});
export function subscribeToasts(fn) {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
