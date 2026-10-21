import express from 'express';
import { getMonitors, addMonitor, deleteMonitor } from '../controllers/uptimeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMonitors);
router.post('/', protect, addMonitor);
router.delete('/:id', protect, deleteMonitor);

export default router;
