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
      <div className='align-middle items-center content-center justify-center'>
        <div className='flex flex-col items-center justify-center'>
          <div className='border-solid border-2 border-sky-500 w-fit p-2'>
            <h3 className='text-red-600'>New feature!</h3>
            <p>
              <strong>Delete after download option is LIVE!</strong>
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
