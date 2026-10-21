import express from 'express';
import { getHealth, getServerStatus, getMetricsHistory } from '../controllers/serverController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/health is public for AWS ALB/EC2/Docker health checks and pinging
router.get('/health', getHealth);

// Detailed server status and historical metrics require authentication
router.get('/status', protect, getServerStatus);
router.get('/metrics/history', protect, getMetricsHistory);

export default router;
