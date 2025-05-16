import UploadFile from "../components/UploadFile";
import DownloadFile from "../components/DownloadFile";

const Landing = () => {
	return (
		<>
			<title>EZUPS</title>
			<meta name="description" content="Upload download anything!" />
			<meta name="keywords" content="upload, download, ezups, filebay" />
			<meta name="author" content="c4lyp5o" />
			<meta name="viewport" content="width=device-width, initial-scale=1.0" />
			<link rel="icon" href="/favicon.ico" />
			<div className="flex flex-col h-screen">
				<header className="bg-gray-800 text-white text-center py-4 shadow-md">
					<h1 className="text-xl font-bold">
						EZUPS 2.0 - upload download anything!
					</h1>
				</header>
				<div className="grid grid-cols-1 sm:grid-cols-2 flex-1">
					<div className="border-t border-gray-300 overflow-hidden bg-gray-900 p-4 sm:p-8 sm:border-t-0 sm:border-l">
						<UploadFile />
					</div>
					<div className="border-t border-gray-300 overflow-hidden bg-gray-900 p-4 sm:p-8 sm:border-t-0 sm:border-l">
						<DownloadFile />
					</div>
				</div>
			</div>
		</>
	);
};

export default Landing;
