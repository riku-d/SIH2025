import { Router } from 'express';
import { authRequired, authorizeRoles } from '../middleware/authMiddleware.js';
import { updateStock, checkStock } from '../controllers/pharmacyController.js';

const router = Router();

router.post('/update-stock', authRequired, authorizeRoles('pharmacy'), updateStock);
router.get('/check-stock/:medicineName', authRequired, checkStock);

export default router;


