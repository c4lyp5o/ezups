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
        <meta charset='UTF-8' />
        <meta name='description' content='NextJS Head component' />
        <meta
          name='keywords'
          content='EZUPS, file, upload, download, storage'
        />
        <meta name='author' content='c4lyp5o' />
        <meta name='viewport' content='width=device-width, initial-scale=1.0' />
      </Head>
      <Header />
      <main className='flex flex-col items-center justify-center w-full h-screen bg-black'>
        <div className='m-4 text-white font-mono'>
          <h1 className='text-6xl font-bold'>EZUPS</h1>
          <p className='text-2xl'>upload anything</p>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-5 items-center justify-center w-full md:w-3/4 h-full'>
          <Upload niceBytesYouHaveThere={niceBytesYouHaveThere} />
          <Download niceBytesYouHaveThere={niceBytesYouHaveThere} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
