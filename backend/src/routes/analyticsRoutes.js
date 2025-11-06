// src/routes/analyticsRoutes.js
import express from 'express';
import { getTripAnalytics } from '../controllers/analyticsController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.get('/trips/:trip_id', getTripAnalytics);

export default router;
