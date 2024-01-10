import { useState } from 'react';
import './App.css';

function App() {
  const [message, setMessage] = useState('Click Start to transcode');
  
  const selectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setMessage('file selected');
  };

  const upload = async () => {
    setMessage('Uploaded');
  };

  return (
    <div className="App">
      <p/>
      <input type="file" accept="video/*,.mkv,audio/*" onChange={selectFile} />
      <button onClick={upload}>Start</button>
      <p>{message}</p>
    </div>
  );
}

export default App;
