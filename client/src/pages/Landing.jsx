import DownloadFile from "../components/DownloadFile";
import UploadFile from "../components/UploadFile";
import Backdrop from "../ez/Backdrop";
import { Brand, Shell } from "../ez/Shell";
import { Stagger, StaggerItem } from "../ez/motion";
import { cx, panel, SectionLabel } from "../ez/ui";

function Card({ title, hint, children }) {
	return (
		<StaggerItem className={cx(panel, "flex flex-col")}>
			<header className="flex items-baseline gap-3 border-b border-line px-5 py-3">
				<SectionLabel>{title}</SectionLabel>
				<span className="text-[12px] text-mute">{hint}</span>
			</header>
			<div className="p-5">{children}</div>
		</StaggerItem>
	);
}

const Landing = () => (
	<Shell brand={<Brand name="ezups" glyph="up" scope="Self-hosted file sharing" />} width="max-w-[1080px]">
		<div className="flex min-h-[calc(100dvh-7.5rem)] flex-col">
			<section className="relative isolate mb-8 min-h-[150px] pt-6 pb-8">
				<Backdrop className="-z-10 left-auto hidden w-[45%] md:block" opacity={0.5} nodes={14} />
				<h1 className="text-[24px] font-semibold tracking-[-0.01em] text-ink">Send it over. Grab it anywhere.</h1>
				<p className="mt-1 max-w-md text-[14px] text-mute">
					Upload a file, share its key. Optional password, optional self-destruct after one download.
				</p>
			</section>

			<Stagger className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2">
				<Card title="Upload a file" hint="Up to 100 MB">
					<UploadFile />
				</Card>
				<Card title="Retrieve a file" hint="With the key you were given">
					<DownloadFile />
				</Card>
			</Stagger>

			<footer className="mt-auto flex items-center justify-between border-t border-line pt-5 text-[12px] text-mute">
				<span>
					ezups <span className="font-mono">v2.0.0</span>
				</span>
				<span>Self-hosted · no tracking</span>
			</footer>
		</div>
	</Shell>
);

export default Landing;
