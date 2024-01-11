import { useState, useRef, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import './App.css';

function App() {
  const [loaded, setLoaded] = useState(false);
  const [message, setMessage] = useState('Click Start to transcode');
  const [fileToUpload, setFileToUpload] = useState(null as File | null | undefined);
  const ffmpegRef = useRef(new FFmpeg());
  
  const load = async () => {
    const ffmpeg = ffmpegRef.current;
    ffmpeg.on('log', ({ message }) => {
        console.log(message);
    });
    ffmpeg.on('progress', ({ progress, time }) => {
      setMessage(`Encoding progress ${progress * 100} % (transcoded time: ${time / 1000000} s)`);
    });
    await ffmpeg.load();
    setLoaded(true);
  };

  useEffect(() => {
    load();
  });

  const selectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.item(0);
    setFileToUpload(file);
  };

  const upload = async () => {
    if (!fileToUpload) {
      setMessage('No file selected');
      return;
    }

    const ffmpeg = ffmpegRef.current;
    const buffer = await fileToUpload.arrayBuffer();

    const fileName = fileToUpload.name;
    const fileNameWithoutExtension = fileName.substring(0, fileName.lastIndexOf('.'));
    const outputFileName = `${fileNameWithoutExtension}.mkv`;

    await ffmpeg.writeFile(fileName, new Uint8Array(buffer));
    await ffmpeg.exec(['-i', fileName, '-c:a', 'copy', '-c:v', 'copy', outputFileName]);
    const data = await ffmpeg.readFile(outputFileName);
    setMessage('muxed');
    const formData = new FormData();
    formData.append("file", new Blob([data]));

    const res = await fetch("http://localhost:4000", {
      method: "POST",
      body: formData,
    }).then((res) => res.json());
  };

  const download = async (filePath: string) => {
    const ffmpeg = ffmpegRef.current;
    const data = await ffmpeg.readFile(filePath);
    const a = document.createElement('a');
    const dataUrl = window.URL.createObjectURL(new Blob([data]));
    a.href = dataUrl;
    const fileName = filePath.substring(filePath.lastIndexOf('/') + 1);
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(dataUrl);
    a.remove();
  };

  return (loaded ? (
    <div className="App">
      <p/>
      <input type="file" accept="video/*,.mkv,audio/*" onChange={selectFile} />
      <button onClick={upload}>Start</button>
      <p>{message}</p>
    </div>
  ):(
    <div className="App">
      <p>Loading...</p>
    </div>
  ));
}

export default App;
