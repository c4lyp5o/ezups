import axios from 'axios';
import { useState } from 'react';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [uploadPassword, setUploadPassword] = useState('');
  const [uploadUsePassword, setUploadUsePassword] = useState(false);
  const [uploadInfo, setUploadInfo] = useState([]);
  const [uploadError, setUploadError] = useState(false);
  const [showUploadSuccess, setShowUploadSuccess] = useState(false);
  const [showUploadError, setShowUploadError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  function handleSubmit(e) {
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
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', uploadPassword);
    setLoading(true);
    axios
      .post('/api/upload', formData, config)
      .then((res) => {
        setLoading(false);
        setUploadInfo(res.data);
        setShowUploadSuccess(true);
        console.log(res.data);
      })
      .catch((err) => {
        setLoading(false);
        setUploadError(err.response.data.error);
        setShowUploadError(true);
        console.log(err);
      });
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
              <strong>Size:</strong> {uploadInfo.size}
            </p>
            <p>
              <strong>Key:</strong> {uploadInfo.key}
            </p>
            <p>
              <strong>Password:</strong> {uploadInfo.password}
            </p>
            <p>
              <strong>Delete after download?:</strong> {uploadInfo.dad}
            </p>
          </div>
        </div>
      );
    }
  }

  if (loading) {
    return <p>Uploading... {uploadProgress}</p>;
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
      {showUploadError && <p>Error: {uploadError}</p>}
    </div>
  );
}
