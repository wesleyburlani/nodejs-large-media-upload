import 'express-async-errors';
import express, { Request, Response  } from 'express';
import http from 'http';

const PORT = 4000;

const onError = (err: Error, req: Request, res: Response) => { 
    res.status(500).json({ msg: err.message });
}

const app = express();
app.use(onError);
const server = http.createServer(app);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
