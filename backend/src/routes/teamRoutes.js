import express from 'express';
import {
  getTeam,
  addTeammate,
  updateRole,
  deleteTeammate,
  getAuditLogs,
} from '../controllers/teamController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/members', protect, getTeam);
router.post('/members', protect, addTeammate);
router.patch('/members/:id/role', protect, updateRole);
router.delete('/members/:id', protect, deleteTeammate);
router.get('/audit-logs', protect, getAuditLogs);

export default router;
