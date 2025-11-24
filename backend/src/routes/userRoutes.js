import express from 'express';
import { registerUser, getAllUsers, loginUser, getCurrentUser, forgotPassword, resetPassword, debugCheckEmailInDB } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validate(schemas.register), registerUser);
router.post('/login', validate(schemas.login), loginUser);
router.get('/me', authenticateToken, getCurrentUser);
router.get('/', authenticateToken, getAllUsers);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// Debug endpoint (for development/testing)
router.get('/debug/check-email', debugCheckEmailInDB);

export default router;