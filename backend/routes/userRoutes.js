import { Router } from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { getUserProfile, updateUserProfile, updatePassword, getDoctors, getDoctorsBySpecialization } from '../controllers/userController.js';

const router = Router();

// Get doctors grouped by specialization (must come before /:id routes)
router.get('/doctors/specialization', authRequired, getDoctorsBySpecialization);

// Get all doctors (must come before /:id routes)
router.get('/doctors', authRequired, getDoctors);

// Get individual doctor by ID
router.get('/doctor/:id', authRequired, getUserProfile);

// Get user profile
router.get('/:id', authRequired, getUserProfile);

// Update user profile
router.put('/:id', authRequired, updateUserProfile);

// Update password
router.put('/:id/password', authRequired, updatePassword);

export default router;
