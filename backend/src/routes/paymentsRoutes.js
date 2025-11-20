// src/routes/paymentsRoutes.js
import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { listTripPayments, createPayment, completePayment, resetTripPayments } from '../controllers/paymentsController.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/trip/:trip_id', listTripPayments);
router.post('/trip/:trip_id/reset', resetTripPayments);
router.post('/', createPayment);
router.patch('/:id/complete', completePayment);

export default router;



