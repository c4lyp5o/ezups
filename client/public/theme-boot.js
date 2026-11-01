// ez theme bootstrap — a classic (non-module) script so it runs before first
// paint; external so a strict CSP (script-src 'self') allows it.
// One rule: a stored choice wins, otherwise DARK.
(function () {
	try {
		var t = localStorage.getItem("ez.theme") === "light" ? "light" : "dark";
		var r = document.documentElement;
		r.classList.toggle("dark", t === "dark");
		r.classList.toggle("light", t === "light");
		var m = document.querySelector('meta[name="theme-color"]');
		if (m) m.setAttribute("content", t === "dark" ? "#171719" : "#f9fafb");
	} catch (e) {
		/* class="dark" is already on <html> */
	}
})();
