import { Router } from 'express';
import express from 'express';
import { authRequired } from '../middleware/authMiddleware.js';
import { chat, config, transcribe, summarise } from '../controllers/assistantController.js';

const router = Router();

/**
 * Its own body parser: a turn can carry a photo of a prescription, which
 * the app's global 100kb limit rejects outright. Kept local so the rest of
 * the API keeps the smaller limit.
 */
router.use(express.json({ limit: '25mb' }));

router.get('/config', authRequired, config);
router.post('/chat', authRequired, chat);
router.post('/transcribe', authRequired, transcribe);
router.post('/summarise', authRequired, summarise);

export default router;
