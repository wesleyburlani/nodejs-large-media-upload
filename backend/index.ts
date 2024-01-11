import 'express-async-errors';
import express, { Request, Response  } from 'express';
import http from 'http';
import Busboy from 'busboy';
import { Readable, Writable } from "stream";
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { pipeline } from 'stream/promises';
const PORT = 4000;

const app = express();
const server = http.createServer(app);

app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
  });

app.post('/', async (req: Request, res: Response) => {
    console.log("uploading...");
    const busboy = Busboy({ headers: req.headers });
    busboy.on('file', (name: string, file: Readable, info: Busboy.FileInfo) => {
        const { filename, encoding, mimeType } = info;
        console.log(
            `File [${name}]: filename: %j, encoding: %j, mimeType: %j`,
            filename,
            encoding,
            mimeType
          );
          file.on('data', (data) => {
            console.log(`File [${name}] got ${data.length} bytes`);
          }).on('close', () => {
            console.log(`File [${name}] done`);
          });
        const outputPath = `./tmp/upload/${new Date().getTime()}`;
        if (!existsSync(outputPath)) {
            mkdirSync(outputPath, { recursive: true });
        }
        const command = ffmpeg(file)
        .on('start', function (commandLine) {
            console.log('Starting the transcoding...');
            console.log(commandLine);
        })
        .on('stderr', (stderrLine) => {
            if (!stderrLine.includes('frame=')) {
            console.error(stderrLine);
            }
        })
        .on('error', (error) => {
            console.error('Failed to complete transcoding', error);
        })
        .on('end', async function () {
            console.log('Transcoding succeeded !');
        })
        .addOptions(['-hide_banner', '-y'])

        command
        .output(`${outputPath}/playlist.m3u8`)
        .format('hls')
        .complexFilter('scale=1280x720:force_original_aspect_ratio=decrease,pad=1280:720:-1:-1:color=black')
        .outputOptions([
            '-c:a aac',
            '-b:a 160k',
            '-ar 48000',
            '-ac 2',
            '-c:v libx264',
            '-preset:v fast',
            '-pix_fmt yuv420p',
            '-crf 20',
            '-maxrate 2808k',
            '-bufsize 5616k',
            '-max_muxing_queue_size 4096',
            '-g 25',
            '-keyint_min 25',
            '-force_key_frames expr:gte(t,n_forced*1)',
            `-hls_segment_filename ${outputPath}/chunk_%06d.ts`,
            `-hls_time 2`,
            '-hls_list_size 0',
            '-master_pl_name master.m3u8',
        ])
        .run();
    });

    busboy.on('error', (err) => {
        console.log(err);
        res.status(500).send(err);
    });
    busboy.on('finish', () => {
        res.status(200).send('ok');
    });

    try {
        await pipeline(
            req,
            busboy
        )
    } catch (err) {
        const error = err as Error
        console.log('error**', error.stack)
        return res.end(`Error!!: ${error.stack}`)
    }
});

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
