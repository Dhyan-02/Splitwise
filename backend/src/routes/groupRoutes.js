import express from 'express';
import { createGroup, joinGroup, getUserGroups, getGroupMembers, getGroupById, generateInvite, joinByInvite } from '../controllers/groupController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticateToken); // All group routes require authentication

router.post('/create', validate(schemas.createGroup), createGroup);
router.post('/join', validate(schemas.joinGroup), joinGroup);
router.post('/join/invite', joinByInvite);
router.get('/my-groups', getUserGroups);
router.get('/:group_id/members', getGroupMembers); // Must come before /:group_id
router.get('/:group_id', getGroupById);
router.post('/:group_id/invite', generateInvite);

export default router;