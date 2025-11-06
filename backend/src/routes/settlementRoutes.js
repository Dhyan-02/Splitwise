// src/routes/settlementRoutes.js
import express from 'express';
import { getTripSettlements } from '../controllers/settlementController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/trips/:trip_id', getTripSettlements);

export default router;
