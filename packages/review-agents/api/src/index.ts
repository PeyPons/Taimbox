import express from 'express';
import cors from 'cors';
import { env } from './env.js';
import { requireAuth } from './middleware/auth.js';
import skillsRouter from './routes/skills.js';
import jobsRouter from './routes/jobs.js';
import uploadsRouter from './routes/uploads.js';

const app = express();
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json({ limit: '2mb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/skills', requireAuth, skillsRouter);
app.use('/api/jobs', requireAuth, jobsRouter);
app.use('/api/uploads', requireAuth, uploadsRouter);

app.listen(env.port, () => {
  console.log(`[review-api] listening on :${env.port}`);
});
