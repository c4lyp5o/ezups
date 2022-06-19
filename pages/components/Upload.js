import axios from 'axios';
import { useState } from 'react';

export default function Upload() {
  const [file, setFile] = useState(null);
  const [password, setPassword] = useState('');
  const [uploadUsePassword, setUploadUsePassword] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(null);

  function handleSubmit(e) {
    console.log('submitting');
    e.preventDefault();
    const config = {
      headers: { 'content-type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        console.log(
          `Current progress:`,
          Math.round((event.loaded * 100) / event.total)
        );
      },
    };
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);
    setLoading(true);
    axios
      .post('/api/upload', formData, config)
      .then((res) => {
        setLoading(false);
        setSuccess(res.data);
        console.log(res.data);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.response.data.error);
        console.log(err);
      });
  }

  function handleChange(e) {
    setFile(e.target.files[0]);
  }

  function handleUsePassword(e) {
    if (e.target.checked) {
      setUploadUsePassword(true);
    } else {
      setUploadUsePassword(false);
    }
  }

  function Confirmation() {
    if (success) {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="border-solid border-2 border-sky-500 w-fit p-2">
            <h3>Success!</h3>
            <p>
              <strong>File:</strong> {success.file}
            </p>
            <p>
              <strong>Size:</strong> {success.size}
            </p>
            <p>
              <strong>Key:</strong> {success.key}
            </p>
            <p>
              <strong>Password:</strong> {success.password}
            </p>
            <p>
              <strong>Delete after download?:</strong> {success.dad}
            </p>
          </div>
        </div>
      );
    }
  }

  function UploadPasswordFill() {
    if (uploadUsePassword) {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="border-solid border-2 border-sky-500 w-fit p-2">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
      );
    }
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="p-3">
      <p>Upload files here.</p>
      <br />
      <form
        className="flex flex-col items-center justify-center"
        encType="multipart/form-data"
        onSubmit={handleSubmit}
      >
        <input type="file" name="file" onChange={handleChange} />
        <br />
        <input type="checkbox" onChange={handleUsePassword} />
        <p>Use Password?</p>
        {uploadUsePassword && <UploadPasswordFill />}
        <br />
        <button
          className="border-solid border-2 border-sky-500 p-1"
          type="submit"
        >
          Upload
        </button>
      </form>
      <br />
      {success && <Confirmation />}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
