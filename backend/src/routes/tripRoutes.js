// src/routes/tripRoutes.js
import express from 'express';
import {
  createTrip,
  getGroupTrips,
  getTripById,
  updateTrip,
  deleteTrip,
  getTripMembers,
  addTripMember,
  removeTripMember
} from '../controllers/tripController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = express.Router();

router.use(authenticateToken); // All trip routes require authentication

router.post('/', validate(schemas.createTrip), createTrip);
router.get('/group/:group_id', getGroupTrips);
router.get('/:id', getTripById);
router.get('/:id/members', getTripMembers);
router.post('/:id/members', addTripMember);
router.delete('/:id/members', removeTripMember);
router.put('/:id', validate(schemas.updateTrip), updateTrip);
router.delete('/:id', deleteTrip);

export default router;
