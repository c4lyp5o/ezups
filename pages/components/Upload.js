import axios from 'axios';
import { useState } from 'react';

export default function Upload() {
  const [file, setFile] = useState(null);
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
    setLoading(true);
    axios
      .post('/api/upload', formData, config)
      .then((res) => {
        setLoading(false);
        setSuccess(res.data);
        console.log(res);
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
        <button type="submit">Upload</button>
      </form>
      <br />
      {success && (
        <>
          <p>{success.message}</p>
          <p>Name: {success.file}</p>
          <p>Size: {success.size}</p>
        </>
      )}
      {error && <p>Error: {error}</p>}
    </div>
  );
}
