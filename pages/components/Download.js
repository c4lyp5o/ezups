import { useState, useRef } from 'react';
import axios from 'axios';

export default function Download({ niceBytesYouHaveThere }) {
  const key = useRef('');
  // const [downloadPassword, setDownloadPassword] = useState('');
  const downloadPassword = useRef('');
  const filename = useRef('');
  const size = useRef('');
  const deleteAfterDownload = useRef(false);
  const downloadError = useRef('');
  const [downloadUsePassword, setDownloadUsePassword] = useState(false);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const [showDownloadError, setShowDownloadError] = useState(false);

  const saveFile = async (blob, filename) => {
    const link = document.createElement('a');
    link.download = filename;
    link.href = URL.createObjectURL(new Blob([blob]));
    link.addEventListener('click', (e) => {
      setTimeout(() => {
        URL.revokeObjectURL(link.href);
      }, 100);
    });
    link.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowDownloadError(false);
    setShowDownloadSuccess(false);
    try {
      const theFile = await axios.post('/api/download', {
        key: key.current,
        password: downloadPassword.current,
        API_KEY: process.env.NEXT_PUBLIC_API_HASH,
      });
      console.log(theFile.data);
      filename.current = theFile.data.file;
      size.current = theFile.data.size;
      deleteAfterDownload.current = theFile.data.dad;
      const theBits = await axios.get(
        `/api/download?key=${key.current}&password=${downloadPassword.current}`,
        {
          responseType: 'blob',
        }
      );
      saveFile(theBits.data, theFile.data.file);
      setShowDownloadSuccess(true);
    } catch (err) {
      downloadError.current = err.response.data.error;
      setShowDownloadError(true);
    }
  };

  function DownloadSuccessful() {
    if (showDownloadSuccess) {
      return (
        <div className='flex flex-col items-center justify-center'>
          <div className='border-solid border-2 border-sky-500 w-fit p-2 rounded-md'>
            <h3>Success!</h3>
            <p>
              <strong>File:</strong> {filename.current}
            </p>
            <p>
              <strong>Size:</strong> {niceBytesYouHaveThere(size.current)}
            </p>
            {deleteAfterDownload.current == 'true' && (
              <p>
                <strong>Deleting your file after download</strong>
              </p>
            )}
          </div>
        </div>
      );
    }
  }

  function DonwloadFailure() {
    if (showDownloadError) {
      return (
        <div className='flex flex-col items-center justify-center'>
          <div className='border-solid border-2 border-red-500 w-fit p-2 rounded-md'>
            <h3>Something went wrong!</h3>
            <p>
              <strong>Reason:</strong> {downloadError.current}
            </p>
          </div>
        </div>
      );
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className='grid grid-flow-row gap-5 text-white'>
        Download files here.
        <input
          required
          className='border-solid border-2 border-sky-500 text-black p-2 rounded-md'
          type='text'
          onChange={(e) => (key.current = e.target.value)}
          placeholder='Enter key'
        />
        <label htmlFor='password'>
          <input
            type='checkbox'
            className='mr-4'
            onChange={(e) =>
              e.target.checked
                ? setDownloadUsePassword(true)
                : setDownloadUsePassword(false)
            }
          />
          Use Password?
        </label>
        {downloadUsePassword && (
          <div className='flex flex-col items-center justify-center'>
            <div className='border-solid border-2 border-sky-500 w-fit p-2 rounded-md'>
              <label htmlFor='password' className='mr-4'>
                <input
                  required
                  type='password'
                  className='text-black p-2 rounded-md mr-4'
                  onChange={(e) => (downloadPassword.current = e.target.value)}
                />
                Password:
              </label>
            </div>
          </div>
        )}
        <button
          className='bg-lime-500 hover:bg-lime-700 text-white font-bold py-2 px-4 rounded mt-10'
          type='submit'
        >
          Download
        </button>
        {showDownloadSuccess && <DownloadSuccessful />}
        {showDownloadError && <DonwloadFailure />}
      </div>
    </form>
  );
}
