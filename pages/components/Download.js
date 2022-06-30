import { useState, useRef } from 'react';
import axios from 'axios';

export default function Download() {
  const key = useRef('');
  // const [downloadPassword, setDownloadPassword] = useState('');
  const downloadPassword = useRef('');
  const filename = useRef('');
  const size = useRef('');
  const downloadError = useRef('');
  const [downloadUsePassword, setDownloadUsePassword] = useState(false);
  const [showDownloadSuccess, setShowDownloadSuccess] = useState(false);
  const [showDownloadError, setShowDownloadError] = useState(false);
  // const [downloadInfo, setDownloadInfo] = useState([]);

  // const saveFile = async (blob, name, type) => {
  //   const a = document.createElement('a');
  //   a.download = name;
  //   a.href = URL.createObjectURL(new Blob([blob], { type: type }));
  //   a.addEventListener('click', (e) => {
  //     setTimeout(() => {
  //       URL.revokeObjectURL(a.href);
  //     }, 100);
  //   });
  //   a.click();
  // };

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
    // console.log(key.current);
    // await axios
    //   .post('/api/download', { key: key.current })
    //   .then((res) => {
    //     filename.current = res.data.file;
    //     setDownloadInfo(res.data);
    //     setShowDownloadSuccess(true);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     setShowDownloadError(true);
    //     setInfo(err);
    //   });
    // await axios
    //   .get(`/api/download?key=${key.current}`, {
    //     responseType: 'blob',
    //   })
    //   .then((res) => {
    //     saveFile(res.data, filename.current);
    //     console.log(downloadInfo);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
    try {
      const theFile = await axios.post('/api/download', {
        key: key.current,
        password: downloadPassword.current,
      });
      filename.current = theFile.data.file;
      size.current = theFile.data.size;
      const theBits = await axios.get(
        `/api/download?key=${key.current}&password=${downloadPassword.current}`,
        {
          responseType: 'blob',
        }
      );
      saveFile(theBits.data, theFile.data.file);
      setShowDownloadSuccess(true);
    } catch (err) {
      console.log(err);
      downloadError.current = err.response.data.message;
      setShowDownloadError(true);
    }
  };

  function DownloadSuccessful() {
    if (showDownloadSuccess) {
      return (
        <div className='flex flex-col items-center justify-center'>
          <div className='border-solid border-2 border-sky-500 w-fit p-2'>
            <h3>Success!</h3>
            <p>
              <strong>File:</strong> {filename.current}
            </p>
            <p>
              <strong>Size:</strong> {size.current}
            </p>
          </div>
        </div>
      );
    }
  }

  function DonwloadFailure() {
    if (showDownloadError) {
      return (
        <div className='flex flex-col items-center justify-center'>
          <div className='border-solid border-2 border-red-500 w-fit p-2'>
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
    <div className='p-3'>
      <h1>Download files here</h1>
      <br />
      <form
        className='flex flex-col items-center justify-center'
        onSubmit={handleSubmit}
      >
        <input
          required
          className='border-solid border-2 border-sky-500'
          type='text'
          onChange={(e) => (key.current = e.target.value)}
          placeholder='Enter key'
        />
        <br />
        <input
          type='checkbox'
          onChange={(e) =>
            e.target.checked
              ? setDownloadUsePassword(true)
              : setDownloadUsePassword(false)
          }
        />
        <p>Use Password?</p>
        {downloadUsePassword && (
          <div className='flex flex-col items-center justify-center'>
            <div className='border-solid border-2 border-sky-500 w-fit p-2'>
              <label htmlFor='password'>Password:</label>
              <input
                required
                type='password'
                id='downloadpassword'
                name='downloadpassword'
                onChange={(e) => (downloadPassword.current = e.target.value)}
              />
            </div>
          </div>
        )}
        <br />
        <button
          className='border-solid border-2 border-sky-500 p-1'
          type='submit'
        >
          Download
        </button>
      </form>
      <br />
      <div>{showDownloadSuccess && <DownloadSuccessful />}</div>
      <div>{showDownloadError && <DonwloadFailure />}</div>
    </div>
  );
}
