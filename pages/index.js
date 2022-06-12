import Head from "next/head";
import Footer from "./components/Footer";
import Upload from "./components/Upload";
import Header from "./components/Header";

export default function Main() {
  return (
    <div className="text-center font-mono h-screen">
      <Head>
        <title>EZUPS</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <Upload />
      <Footer />
    </div>
  );
}
