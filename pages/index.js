import Head from 'next/head';
import Footer from './components/Footer';
import Upload from './components/Upload';
import Header from './components/Header';
import Download from './components/Download';

export default function Main() {
  function niceBytesYouHaveThere(size) {
    let b = 0,
      c = parseInt(size, 10) || 0;
    for (; 1024 <= c && ++b; ) c /= 1024;
    return (
      c.toFixed(10 > c && 0 < b ? 1 : 0) +
      ' ' +
      ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'][b]
    );
  }
  return (
    <div className='text-center font-mono h-screen'>
      <Head>
        <title>EZUPS</title>
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Header />
      <div className='grid grid-cols-2'>
        <div>
          <Upload niceBytesYouHaveThere={niceBytesYouHaveThere} />
        </div>
        <div>
          <Download niceBytesYouHaveThere={niceBytesYouHaveThere} />
        </div>
      </div>
      <Footer />
    </div>
  );
}
