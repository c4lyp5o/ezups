import { useState, useEffect } from 'react';

export default function Test() {
  const [password, setPassword] = useState('');
  const [doublePassword, setDoublePassword] = useState('');
  const [testkey, setTestkey] = useState(false);
  function Password() {
    useEffect(() => {
      if (password === doublePassword) {
        setTestkey(true);
      }
    }, [password, doublePassword]);
    return (
      <>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p>{password}</p>
      </>
    );
  }
  return (
    <div>
      <form action="">
        <h1>Test</h1>
        <input
          type="checkbox"
          onChange={() => {
            testkey ? setTestkey(false) : setTestkey(true);
          }}
        />
        <br />
        <input
          type="password"
          value={doublePassword}
          onChange={(e) => setDoublePassword(e.target.value)}
        />
        <p>{doublePassword}</p>
        <br />
        {testkey && <Password />}
      </form>
    </div>
  );
}
