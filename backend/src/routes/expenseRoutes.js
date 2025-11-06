// src/routes/expenseRoutes.js
import express from 'express';
import { addExpense, getTripExpenses, deleteExpense } from '../controllers/expenseController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticateToken); // All expense routes require authentication

router.post('/', validate(schemas.addExpense), addExpense);
router.get('/trip/:trip_id', getTripExpenses);
router.delete('/:expense_id', deleteExpense);

export default router;