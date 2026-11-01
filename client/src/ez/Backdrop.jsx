// Ambient three.js scene — the ez family's 3D signature, after ezdyndns's
// propagation view (frontend/public/ui.js): a wireframe icosahedron core in
// the ink colour, an accent heart, a ring of nodes on thin links and packets
// travelling out along them. Colours come from the --ez-viz-* tokens, so it
// re-tints with the theme.
//
// Rules carried over from both prototypes:
//   - three is imported lazily; without WebGL the page renders as before;
//   - reduced motion renders ONE still frame, no loop;
//   - the loop stops while the tab is hidden; DPR capped at 2 (1.5 on phones);
//   - it is decoration: aria-hidden, pointer-events none, never on a data
//     table screen — sign-in, empty/landing states and hero headers only.
import { useEffect, useRef } from "react";
import { cx } from "./lib";
import { useReducedMotion } from "./motion";

const css = (name) =>
	getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#888";

/** shift > 0 lowers the scene in its frame (room for text above it). */
export default function Backdrop({ className, nodes = 14, opacity = 1, density = 1, shift = 0 }) {
	const host = useRef(null);
	const reduce = useReducedMotion();

	useEffect(() => {
		const el = host.current;
		if (!el) return;
		let disposed = false;
		let cleanup = () => {};

		import("three")
			.then((THREE) => {
				if (disposed) return;
				let renderer;
				try {
					renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
				} catch {
					return; // no WebGL: the backdrop is decoration, skip it
				}
				const phone = Math.min(window.innerWidth, window.innerHeight) < 640;
				renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, phone ? 1.5 : 2));
				renderer.domElement.style.cssText =
					"position:absolute;inset:0;width:100%;height:100%;display:block";
				el.appendChild(renderer.domElement);

				const scene = new THREE.Scene();
				const camera = new THREE.PerspectiveCamera(32, 2, 0.1, 100);
				camera.position.set(0, 6.2, 10.5);
				camera.lookAt(0, -0.2 + shift, 0);

				const mats = [];
				const mat = (M, opts) => {
					const m = new M(opts);
					mats.push(m);
					return m;
				};
				const geos = [];
				const geo = (g) => {
					geos.push(g);
					return g;
				};

				const world = new THREE.Group();
				scene.add(world);

				const coreLine = mat(THREE.LineBasicMaterial, { transparent: true, opacity: 0.9 });
				const core = new THREE.LineSegments(
					geo(new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.62, 0))),
					coreLine,
				);
				const heartMat = mat(THREE.MeshBasicMaterial, {});
				const heart = new THREE.Mesh(geo(new THREE.SphereGeometry(0.16, 16, 12)), heartMat);
				scene.add(core, heart);

				const RADIUS = 4.2;
				const ringPts = [];
				for (let i = 0; i <= 96; i++) {
					const a = (i / 96) * Math.PI * 2;
					ringPts.push(Math.cos(a) * RADIUS, 0, Math.sin(a) * RADIUS);
				}
				const ringGeo = geo(new THREE.BufferGeometry());
				ringGeo.setAttribute("position", new THREE.Float32BufferAttribute(ringPts, 3));
				const ringMat = mat(THREE.LineBasicMaterial, { transparent: true, opacity: 0.7 });
				world.add(new THREE.Line(ringGeo, ringMat));

				const count = Math.max(4, Math.round(nodes * density));
				const nodeGeo = geo(new THREE.SphereGeometry(0.1, 12, 10));
				const nodeMat = mat(THREE.MeshBasicMaterial, {});
				const linkMat = mat(THREE.LineBasicMaterial, { transparent: true, opacity: 0.55 });
				const ends = [];
				for (let i = 0; i < count; i++) {
					const a = (i / count) * Math.PI * 2 + 0.2;
					const r = RADIUS * (0.72 + ((i * 37) % 10) / 36);
					const p = new THREE.Vector3(Math.cos(a) * r, ((i * 13) % 7) / 14 - 0.2, Math.sin(a) * r);
					const n = new THREE.Mesh(nodeGeo, nodeMat);
					n.position.copy(p);
					world.add(n);
					world.add(
						new THREE.Line(
							geo(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), p])),
							linkMat,
						),
					);
					ends.push(p);
				}

				const MAX = Math.min(24, count * 2);
				const pktGeo = geo(new THREE.BufferGeometry());
				const pos = new Float32Array(MAX * 3);
				pktGeo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
				const pktMat = mat(THREE.PointsMaterial, {
					size: 0.12,
					sizeAttenuation: true,
					transparent: true,
					opacity: 0.95,
				});
				world.add(new THREE.Points(pktGeo, pktMat));
				const packets = Array.from({ length: MAX }, (_, i) => ({
					to: i % count,
					t: (i * 0.137) % 1,
					v: 0.18 + ((i * 7) % 5) / 40,
				}));

				const paint = () => {
					coreLine.color.set(css("--color-ink"));
					heartMat.color.set(css("--ez-viz-accent"));
					ringMat.color.set(css("--ez-viz-line"));
					linkMat.color.set(css("--ez-viz-line"));
					nodeMat.color.set(css("--ez-viz-node"));
					pktMat.color.set(css("--ez-viz-accent"));
				};
				paint();
				window.addEventListener("ez-theme", paint);

				const size = () => {
					const w = el.clientWidth || 1;
					const h = el.clientHeight || 1;
					renderer.setSize(w, h, false);
					camera.aspect = w / h;
					camera.updateProjectionMatrix();
				};
				size();
				const ro = new ResizeObserver(size);
				ro.observe(el);

				const place = (dt) => {
					for (let i = 0; i < MAX; i++) {
						const k = packets[i];
						k.t += dt * k.v;
						if (k.t > 1) {
							k.t = 0;
							k.to = (k.to + 5) % count;
						}
						const e = ends[k.to];
						pos[i * 3] = e.x * k.t;
						pos[i * 3 + 1] = e.y * k.t;
						pos[i * 3 + 2] = e.z * k.t;
					}
					pktGeo.attributes.position.needsUpdate = true;
				};

				let raf = 0;
				let last = performance.now();
				const frame = (now) => {
					const dt = Math.min(0.05, (now - last) / 1000);
					last = now;
					world.rotation.y += dt * 0.08;
					core.rotation.y -= dt * 0.25;
					core.rotation.x += dt * 0.1;
					heart.scale.setScalar(1 + Math.sin(now / 900) * 0.08);
					place(dt);
					renderer.render(scene, camera);
					raf = requestAnimationFrame(frame);
				};
				const start = () => {
					if (!raf && !document.hidden) {
						last = performance.now();
						raf = requestAnimationFrame(frame);
					}
				};
				const stop = () => {
					cancelAnimationFrame(raf);
					raf = 0;
				};
				const vis = () => (document.hidden ? stop() : start());

				if (reduce) {
					place(0);
					renderer.render(scene, camera);
					window.addEventListener("ez-theme", () => renderer.render(scene, camera));
				} else {
					document.addEventListener("visibilitychange", vis);
					start();
				}

				cleanup = () => {
					stop();
					document.removeEventListener("visibilitychange", vis);
					window.removeEventListener("ez-theme", paint);
					ro.disconnect();
					for (const g of geos) g.dispose();
					for (const m of mats) m.dispose();
					renderer.dispose();
					renderer.domElement.remove();
				};
			})
			.catch(() => {});

		return () => {
			disposed = true;
			cleanup();
		};
	}, [reduce, nodes, density, shift]);

	return (
		<div
			ref={host}
			aria-hidden
			className={cx("pointer-events-none absolute inset-0 overflow-hidden", className)}
			style={{ opacity }}
		/>
	);
}
