import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authRequired } from '../middleware/authMiddleware.js';
import { uploadAppointmentMedia, handleUploadErrors } from '../middleware/uploadMiddleware.js';
import { bookAppointment, getAppointmentsForPatient, getAppointmentsForDoctor, confirmAppointment, rejectAppointment, completeAppointment, cancelAppointment } from '../controllers/appointmentController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.post('/book', authRequired, uploadAppointmentMedia, handleUploadErrors, bookAppointment);
router.get('/patient/:id', authRequired, getAppointmentsForPatient);
router.get('/doctor/:id', authRequired, getAppointmentsForDoctor);
router.put('/:id/confirm', authRequired, confirmAppointment);
router.put('/:id/reject', authRequired, rejectAppointment);
router.put('/:id/complete', authRequired, completeAppointment);
router.put('/:id/cancel', authRequired, cancelAppointment);

// Route to serve uploaded media files
router.get('/media/:filename', authRequired, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(__dirname, '..', 'uploads', 'appointments', filename);
        
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ message: 'File not found' });
        }
        
        res.sendFile(filePath);
    } catch (error) {
        res.status(500).json({ message: 'Error serving file' });
    }
});

export default router;


