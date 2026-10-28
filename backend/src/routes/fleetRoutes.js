import express from 'express';
import {
  getFleet,
  addServer,
  deleteServer,
  runDiagnostic,
  syncAwsFleet,
  executeServerAction,
  getAiDiagnosis,
  getFinOpsAnalytics,
  getSecurityAudit,
  getInstallScript,
  handleHeartbeat,
  generateAgentToken,
  clearFleet,
  getAwsEnvStatus,
} from '../controllers/serverFleetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public agent installer & telemetry endpoints
router.get('/install.sh', getInstallScript);
router.post('/heartbeat', handleHeartbeat);

// Protected fleet & AWS endpoints
router.get('/', protect, getFleet);
router.post('/', protect, addServer);
router.delete('/clear', protect, clearFleet);
router.delete('/:id', protect, deleteServer);
router.post('/diagnostic', protect, runDiagnostic);

// AWS Auto-Discovery & Cloud FinOps / Security endpoints
router.get('/aws/env-config', protect, getAwsEnvStatus);
router.post('/aws/sync', protect, syncAwsFleet);
router.post('/aws/action/:id', protect, executeServerAction);
router.get('/aws/ai-diagnose/:id', protect, getAiDiagnosis);
router.get('/aws/finops', protect, getFinOpsAnalytics);
router.get('/aws/security-audit', protect, getSecurityAudit);
router.get('/agent/token', protect, generateAgentToken);

export default router;
