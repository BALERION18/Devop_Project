import express from 'express';
import { getTeam, updateRole, getAuditLogs } from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/members', protect, getTeam);
router.patch('/members/:id/role', protect, updateRole);
router.get('/audit-logs', protect, getAuditLogs);

export default router;
