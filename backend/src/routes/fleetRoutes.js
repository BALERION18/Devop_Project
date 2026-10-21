import express from 'express';
import { getFleet, addServer, deleteServer, runDiagnostic } from '../controllers/serverFleetController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getFleet);
router.post('/', protect, addServer);
router.delete('/:id', protect, deleteServer);
router.post('/diagnostic', protect, runDiagnostic);

export default router;
