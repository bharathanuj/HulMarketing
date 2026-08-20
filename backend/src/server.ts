import dotenv from 'dotenv';
dotenv.config(); // must run before any other local import — several of them construct
                  // the DB pool and read OLLAMA_* vars at module-load time.

import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

import signalsRouter from './routes/signals';
import opportunitiesRouter from './routes/opportunities';
import campaignsRouter from './routes/campaigns';
import approvalsRouter from './routes/approvals';
import governanceRouter from './routes/governance';
import learningRouter from './routes/learning';
import documentsRouter from './routes/documents';
import modelsRouter from './routes/models';
import brandsRouter from './routes/brands';
import { loadModelConfig } from './config/modelConfig';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/signals', signalsRouter);
app.use('/api/opportunities', opportunitiesRouter);
app.use('/api/campaigns', campaignsRouter);
app.use('/api/approvals', approvalsRouter);
app.use('/api/governance', governanceRouter);
app.use('/api/learning', learningRouter);
app.use('/api/documents', documentsRouter);
app.use('/api/models', modelsRouter);
app.use('/api/brands', brandsRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

const httpServer = createServer(app);

// Live Pulse (Angular) subscribes here for real-time signal/opportunity pushes
// instead of polling — matches the "radar + control tower" UI requirement.
export const io = new SocketIOServer(httpServer, { cors: { origin: '*' } });
io.on('connection', (socket) => {
  socket.emit('connected', { message: 'Connected to PROJECT NEXT live stream' });
});

const PORT = process.env.PORT || 4000;
loadModelConfig()
  .catch((err) => console.error('Failed to load AI model config, using .env defaults:', err))
  .finally(() => {
    httpServer.listen(PORT, () => {
      console.log(`PROJECT NEXT backend listening on :${PORT}`);
    });
  });
