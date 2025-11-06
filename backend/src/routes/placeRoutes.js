// src/routes/placeRoutes.js
import express from 'express';
import multer from 'multer';
import { addPlace, getTripPlaces, updatePlace, deletePlace } from '../controllers/placeController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate, schemas } from '../middleware/validate.js';

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

router.use(authenticateToken);

router.post('/', upload.single('photo'), validate(schemas.addPlace), addPlace);
router.get('/trip/:trip_id', getTripPlaces);
router.put('/:place_id', updatePlace);
router.delete('/:place_id', deletePlace);

export default router;
