import express from 'express';
import { registerUser, getAllUsers, loginUser, getCurrentUser } from '../controllers/userController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', validate(schemas.register), registerUser);
router.post('/login', validate(schemas.login), loginUser);
router.get('/me', authenticateToken, getCurrentUser);
router.get('/', authenticateToken, getAllUsers);

export default router;