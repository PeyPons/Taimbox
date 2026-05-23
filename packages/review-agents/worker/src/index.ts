import { Worker } from 'bullmq';
import { JOB_QUEUE_NAME } from '@taimbox/review-shared';
import { env } from './env.js';
import { processReviewJob } from './pipeline.js';
import { redisConnectionOptions } from './redis.js';

const worker = new Worker(
  JOB_QUEUE_NAME,
  async (job) => {
    const { jobId } = job.data as { jobId: string };
    console.log(`[review-worker] processing ${jobId}`);
    await processReviewJob(jobId);
  },
  {
    connection: redisConnectionOptions(),
    concurrency: env.workerConcurrency,
    lockDuration: 2 * 60 * 60 * 1000,
  },
);

worker.on('failed', (job, err) => {
  console.error(`[review-worker] failed ${job?.id}`, err);
});

console.log(`[review-worker] started concurrency=${env.workerConcurrency}`);
