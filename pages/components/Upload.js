import axios from 'axios';
import { useState } from 'react';

export default function Upload({ niceBytesYouHaveThere }) {
  const [file, setFile] = useState(null);
  const [uploadPassword, setUploadPassword] = useState('');
  const [uploadUsePassword, setUploadUsePassword] = useState(false);
  const [uploadDeleteAfterDownload, setUploadDeleteAfterDownload] =
    useState(false);
  const [uploadInfo, setUploadInfo] = useState([]);
  const [uploadError, setUploadError] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [showUploadError, setShowUploadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  async function handleSubmit(e) {
    e.preventDefault();
    setShowUploadError(false);
    setShowUploadSuccess(false);
    if (!file) {
      setUploadError('No file selected');
      setShowUploadError(true);
      return;
    }
    const config = {
      headers: { 'content-type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        console.log(
          `Current progress:`,
          Math.round((e.loaded * 100) / e.total)
        );
        setUploadProgress(Math.round((e.loaded * 100) / e.total));
      },
    };
    if (file.size > 9961472) {
      setUploadError(
        `File too large. Your file is ${niceBytesYouHaveThere(file.size)}`
      );
      setShowUploadError(true);
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', uploadPassword);
    formData.append('dad', uploadDeleteAfterDownload);
    formData.append('API_KEY', process.env.NEXT_PUBLIC_API_HASH);
    setLoading(true);
    try {
      const theFile = await axios.post('/api/upload', formData, config);
      console.log(theFile.data);
      setUploadInfo(theFile.data);
      setShowUploadSuccess(true);
    } catch (err) {
      console.log(err);
      setUploadError(err.response.data.error);
      setShowUploadError(true);
    }
    setLoading(false);
  }

  function UploadSuccessful() {
    if (showUploadSuccess === true) {
      return (
        <div className='flex flex-col items-center justify-center'>
          <div className='border-solid border-2 border-sky-500 w-fit p-2'>
            <h3>Success!</h3>
            <p>
              <strong>File:</strong> {uploadInfo.file}
            </p>
            <p>
              <strong>Size:</strong> {niceBytesYouHaveThere(uploadInfo.size)}
            </p>
            <p>
              <strong>Key:</strong> {uploadInfo.key}
            </p>
            {uploadUsePassword && (
              <p>
                <strong>Password:</strong> {uploadInfo.password}
              </p>
            )}
            {uploadDeleteAfterDownload && (
              <p>
                <strong>Delete after download?:</strong>{' '}
                {uploadInfo.dad ? 'Yes' : 'No'}
              </p>
            )}
          </div>
        </div>
      );
    }
  }

  if (loading) {
    return (
      <>
        <div>
          <p>Uploading...</p>
          <progress className='mr-2' value={uploadProgress} max='100' />
          {uploadProgress}%
        </div>
      </>
    );
  }

  return (
    <div className='p-3'>
      <p>Upload files here.</p>
      <br />
      <form
        className='flex flex-col items-center justify-center'
        encType='multipart/form-data'
        onSubmit={handleSubmit}
      >
        <input
          required
          type='file'
          name='file'
          onClick={(e) => {
            setShowUploadError(false);
            setShowUploadSuccess(false);
          }}
          onChange={(e) => setFile(e.target.files[0])}
        />
        <br />
        <input
          type='checkbox'
          onChange={(e) =>
            e.target.checked
              ? setUploadUsePassword(true)
              : setUploadUsePassword(false)
          }
        />
        <p>Use Password?</p>
        {uploadUsePassword && (
          <div className='flex flex-col items-center justify-center'>
            <div className='border-solid border-2 border-sky-500 w-fit p-2'>
              <label htmlFor='password'>Password:</label>
              <input
                required
                key='upload-password'
                type='password'
                id='password'
                name='password'
                value={uploadPassword}
                onChange={(e) => setUploadPassword(e.target.value)}
              />
            </div>
          </div>
        )}
        <input
          type='checkbox'
          onChange={(e) =>
            e.target.checked
              ? setUploadDeleteAfterDownload(true)
              : setUploadDeleteAfterDownload(false)
          }
        />
        <p>Delete after download?</p>
        <br />
        <button
          className='border-solid border-2 border-sky-500 p-1'
          type='submit'
        >
          Upload
        </button>
      </form>
      <br />
      {showUploadSuccess && <UploadSuccessful />}
      {showUploadError && (
        <div className='flex flex-col items-center justify-center'>
          <div className='border-solid border-2 border-red-500 w-fit p-2'>
            <p>Error: {uploadError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
