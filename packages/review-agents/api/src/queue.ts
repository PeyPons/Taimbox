import { Queue } from 'bullmq';
import { JOB_QUEUE_NAME } from '@taimbox/review-shared';
import { redisConnectionOptions } from './redis.js';

export const reviewQueue = new Queue(JOB_QUEUE_NAME, { connection: redisConnectionOptions() });

export interface ReviewQueuePayload {
  jobId: string;
}

export async function enqueueReviewJob(jobId: string) {
  await reviewQueue.add(
    'process',
    { jobId } satisfies ReviewQueuePayload,
    {
      jobId: `review-${jobId}`,
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 1,
    },
  );
}
