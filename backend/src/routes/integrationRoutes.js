import express from 'express';
import {
  testMongoConnection,
  testS3Connection,
  testRedisConnection,
} from '../controllers/integrationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected endpoints for testing custom cloud databases & storage
router.post('/test-mongodb', protect, testMongoConnection);
router.post('/test-s3', protect, testS3Connection);
router.post('/test-redis', protect, testRedisConnection);

export default router;
