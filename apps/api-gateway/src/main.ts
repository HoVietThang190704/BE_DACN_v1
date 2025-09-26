import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { router as bff } from './routes/bff';
import { router as proxy } from './routes/proxy';

const app = express();
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(compression());
app.use(express.json());

app.get('/health', (_req,res)=>res.json({ ok:true }));
app.use('/bff', bff);    // endpoint tổng hợp
app.use('/api', proxy);  // proxy sang service nội bộ

const PORT = process.env.PORT || 4000;
app.listen(PORT, ()=>console.log(`Gateway http://localhost:${PORT}`));
