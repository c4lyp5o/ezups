import { useState, useRef } from 'react';
import axios from 'axios';

export default function Download() {
  const key = useRef('');
  const filename = useRef('');
  const mimetype = useRef('');
  const [downloadUsePassword, setDownloadUsePassword] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [info, setInfo] = useState('');
  const [downloadPassword, setDownloadPassword] = useState('');

  const handleChange = (e) => {
    key.current = e.target.value;
  };

  const saveFile = async (blob, name, type) => {
    const a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(new Blob([blob], { type: type }));
    a.addEventListener('click', (e) => {
      setTimeout(() => {
        URL.revokeObjectURL(a.href);
      }, 100);
    });
    a.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setShowError(false);
    setShowSuccess(false);
    // await axios
    //   .post('/api/download', { key: key.current })
    //   .then((res) => {
    //     filename.current = res.data.file;
    //     mimetype.current = res.data.mimetype;
    //     setShowSuccess(true);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //     setShowError(true);
    //     setInfo(err);
    //   });
    // await axios
    //   .get(`/api/download?key=${key.current}`, {
    //     responseType: 'blob',
    //   })
    //   .then((res) => {
    //     saveFile(res.data, filename.current, mimetype.current);
    //   })
    //   .catch((err) => {
    //     console.log(err);
    //   });
    try {
      const theFile = await axios.post('/api/download', {
        key: key.current,
        password: downloadPassword.current,
      });
      filename.current = await theFile.data.file;
      mimetype.current = await theFile.data.mimetype;
      const theBits = await axios.get(`/api/download?key=${key.current}`, {
        responseType: 'blob',
      });
      saveFile(theBits.data, filename.current, mimetype.current);
      setShowSuccess(true);
    } catch (err) {
      setInfo(err);
      setShowError(true);
    }
  };

  function Success() {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="border-solid border-2 border-sky-500 w-fit p-2">
          <h3>Success!</h3>
          <p>
            <strong>Key:</strong> {key.current}
            <br />
            <strong>File:</strong> {filename.current}
          </p>
        </div>
      </div>
    );
  }

  function Failure() {
    return (
      <div className="flex flex-col items-center justify-center">
        <div className="border-solid border-2 border-red-500 w-fit p-2">
          <h3>Failure!</h3>
          <p>
            <strong>Error:</strong> {info.response.data.message}
          </p>
        </div>
      </div>
    );
  }

  function DownloadPasswordFill() {
    if (downloadUsePassword) {
      return (
        <div className="flex flex-col items-center justify-center">
          <div className="border-solid border-2 border-sky-500 w-fit p-2">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="downloadpassword"
              name="downloadpassword"
              value={downloadPassword}
              onChange={(e) => setDownloadPassword(e.target.value)}
            />
          </div>
        </div>
      );
    }
  }

  function downloadCheckbox(e) {
    if (e.target.checked) {
      setDownloadUsePassword(true);
    } else {
      setDownloadUsePassword(false);
    }
  }

  return (
    <div className="p-3">
      <h1>Download files here</h1>
      <br />
      <form
        className="flex flex-col items-center justify-center"
        onSubmit={handleSubmit}
      >
        <input
          className="border-solid border-2 border-sky-500"
          type="text"
          onChange={handleChange}
          placeholder="Enter key"
        />
        <br />
        <input type="checkbox" onChange={downloadCheckbox} />
        <p>Use Password?</p>
        {downloadUsePassword && <DownloadPasswordFill />}
        <br />
        <button
          className="border-solid border-2 border-sky-500 p-1"
          type="submit"
        >
          Download
        </button>
      </form>
      <br />
      <div>{showSuccess && Success()}</div>
      <div>{showError && Failure()}</div>
    </div>
  );
}
