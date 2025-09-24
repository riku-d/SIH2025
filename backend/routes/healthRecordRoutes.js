import { Router } from 'express';
import { authRequired, authorizeRoles } from '../middleware/authMiddleware.js';
import { createRecord, getRecordsForPatient, downloadPatientHistoryPdf } from '../controllers/healthRecordController.js';

const router = Router();

router.post('/create', authRequired, authorizeRoles('doctor'), createRecord);
router.get('/:patientId', authRequired, getRecordsForPatient);
router.get('/:patientId/download', authRequired, downloadPatientHistoryPdf);

export default router;


