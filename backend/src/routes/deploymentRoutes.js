import express from 'express';
import {
  getDeployments,
  getDeploymentById,
  triggerDeployment,
  refreshGitHubDeployments,
  seedInitialDeployments,
  rollbackDeployment,
} from '../controllers/deploymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getDeployments);
router.get('/:id', protect, getDeploymentById);
router.post('/trigger', protect, triggerDeployment);
router.post('/rollback', protect, rollbackDeployment);
router.post('/refresh', protect, refreshGitHubDeployments);
router.post('/seed', protect, seedInitialDeployments);

export default router;
