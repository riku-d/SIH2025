import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { querySymptoms } from '../controllers/symptomCheckerController.js';

const router = Router();

router.post('/query', authRequired, querySymptoms);

export default router;


