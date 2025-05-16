import { useState } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';

import DownloadInput from './DownloadInput';

const DownloadFile = () => {
  const [allInfo, setAllInfo] = useState({
    key: '',
    password: '',
  });
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!allInfo.key) return toast.error('Please enter a key');

    setLoading(true);
    setDownloadProgress(0);

    try {
      const response = await axios.get(
        '/api/v1/download',

        {
          params: {
            key: allInfo.key,
            password: allInfo.password,
          },
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setDownloadProgress(percent);
          },
        }
      );

      const disposition = response.headers['content-disposition'];
      let filename = 'downloaded_file';
      if (disposition && disposition.includes('filename=')) {
        filename = disposition.split('filename=')[1].replace(/\"/g, '').trim();
      }
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('File downloaded!');
    } catch (error) {
      toast.error('No file found using the key provided!');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <DownloadInput
        allInfo={allInfo}
        setAllInfo={setAllInfo}
        loading={loading}
        handleSubmit={handleSubmit}
      />
      {loading && (
        <div
          className='flex flex-col items-center justify-center p-3 bg-white border border-blue-300 rounded-lg shadow-lg w-11/12 mx-auto mt-3'
          aria-live='polite'
        >
          <span className='mb-2 text-blue-700 font-medium'>
            Downloading: {downloadProgress}%
          </span>
          <div className='w-full max-w-md h-4 bg-gray-200 rounded-full overflow-hidden'>
            <div
              className='h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-300'
              style={{ width: `${downloadProgress}%` }}
              aria-valuenow={downloadProgress}
              aria-valuemin={0}
              aria-valuemax={100}
              role='progressbar'
            />
          </div>
        </div>
      )}
    </>
  );
};

export default DownloadFile;
