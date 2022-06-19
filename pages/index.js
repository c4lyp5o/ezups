import Head from 'next/head';
import Footer from './components/Footer';
import Upload from './components/Upload';
import Header from './components/Header';
import Download from './components/Download';
import Test from './components/Test';

export default function Main() {
  return (
    <div className="text-center font-mono h-screen">
      <Head>
        <title>EZUPS</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Header />
      <div className="grid grid-cols-2">
        <div>
          <Upload />
        </div>
        <div>
          <Download />
        </div>
      </div>
      <Test />
      <Footer />
    </div>
  );
}
