import { Queue } from 'bullmq';
import { redisConnection } from './redis';

export const importQueueName = 'product-import-queue';

/**
 * BullMQ Queue - Optional and safe for startup.
 * We wrap the instantiation to avoid immediate connection errors from crashing the server.
 */
let queueInstance: any = null;

try {
  queueInstance = new Queue(importQueueName, {
    connection: redisConnection as any,
  });
  
  // Suppress immediate connection errors
  queueInstance.on('error', () => {}); 
} catch (e) {
  console.warn('[Queue] BullMQ could not be initialized (Redis offline). Queued jobs will be disabled.');
  // Dummy object to prevent 'undefined' property access errors
  queueInstance = { 
    add: async () => ({ id: 'dummy-job' }),
    on: () => {} 
  };
}

export const importQueue = queueInstance;
