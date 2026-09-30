import { Router } from 'express';
import multer from 'multer';
import { handleUpload } from '../controllers/upload.controller.js';
import { handleChat } from '../controllers/chat.controller.js';
import { getSources, deleteSource } from '../controllers/sources.controller.js';
import { authenticateUser } from '../middlewares/auth.middleware.js';
import { chatRateLimiter, uploadRateLimiter } from '../middlewares/rateLimiter.js';
import { env } from '../config/env.js';
import { supabaseAdmin } from '../lib/supabase.js';

const router = Router();

// Configure Multer for in-memory file handling (supports PDF, PNG, JPG, MP3, MP4)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 30 * 1024 * 1024, // 30 MB maximum file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimePrefixes = ['image/', 'audio/', 'video/', 'text/', 'application/pdf', 'application/json'];
    const isAllowed = allowedMimePrefixes.some((prefix) =>
      file.mimetype.startsWith(prefix) || file.mimetype === prefix
    );

    if (isAllowed) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed: PDF, Images, Audio, Video, Text.`));
    }
  },
});

// Health check endpoint
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Unify Multimodal RAG Engine',
  });
});

// System Status and Config check
router.get('/status', async (_req, res) => {
  let dbConnected = false;
  let schemaReady = false;

  try {
    const { error: dbErr } = await supabaseAdmin.from('sources').select('count').limit(1);
    if (!dbErr) {
      dbConnected = true;
      schemaReady = true;
    } else if (dbErr.code === 'PGRST205') {
      dbConnected = true;
      schemaReady = false; // tables not yet created in Supabase
    }
  } catch (e) {
    dbConnected = false;
  }

  res.json({
    geminiKeyConfigured: Boolean(env.GEMINI_API_KEY && env.GEMINI_API_KEY !== 'your_google_gemini_api_key_here'),
    supabaseConnected: dbConnected,
    schemaReady,
    port: env.PORT,
  });
});

// Authenticated API Routes
router.post('/upload', authenticateUser, uploadRateLimiter, upload.single('file'), handleUpload);
router.post('/chat', authenticateUser, chatRateLimiter, handleChat);
router.get('/sources', authenticateUser, getSources);
router.delete('/sources/:id', authenticateUser, deleteSource);

export default router;
