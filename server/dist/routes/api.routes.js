"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const upload_controller_js_1 = require("../controllers/upload.controller.js");
const chat_controller_js_1 = require("../controllers/chat.controller.js");
const sources_controller_js_1 = require("../controllers/sources.controller.js");
const auth_middleware_js_1 = require("../middlewares/auth.middleware.js");
const rateLimiter_js_1 = require("../middlewares/rateLimiter.js");
const env_js_1 = require("../config/env.js");
const supabase_js_1 = require("../lib/supabase.js");
const router = (0, express_1.Router)();
// Configure Multer for in-memory file handling (supports PDF, PNG, JPG, MP3, MP4)
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 30 * 1024 * 1024, // 30 MB maximum file size
    },
    fileFilter: (_req, file, cb) => {
        const allowedMimePrefixes = ['image/', 'audio/', 'video/', 'text/', 'application/pdf', 'application/json'];
        const isAllowed = allowedMimePrefixes.some((prefix) => file.mimetype.startsWith(prefix) || file.mimetype === prefix);
        if (isAllowed) {
            cb(null, true);
        }
        else {
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
        const { error: dbErr } = await supabase_js_1.supabaseAdmin.from('sources').select('count').limit(1);
        if (!dbErr) {
            dbConnected = true;
            schemaReady = true;
        }
        else if (dbErr.code === 'PGRST205') {
            dbConnected = true;
            schemaReady = false; // tables not yet created in Supabase
        }
    }
    catch (e) {
        dbConnected = false;
    }
    res.json({
        geminiKeyConfigured: Boolean(env_js_1.env.GEMINI_API_KEY && env_js_1.env.GEMINI_API_KEY !== 'your_google_gemini_api_key_here'),
        supabaseConnected: dbConnected,
        schemaReady,
        port: env_js_1.env.PORT,
    });
});
// Authenticated API Routes
router.post('/upload', auth_middleware_js_1.authenticateUser, rateLimiter_js_1.uploadRateLimiter, upload.single('file'), upload_controller_js_1.handleUpload);
router.post('/chat', auth_middleware_js_1.authenticateUser, rateLimiter_js_1.chatRateLimiter, chat_controller_js_1.handleChat);
router.get('/sources', auth_middleware_js_1.authenticateUser, sources_controller_js_1.getSources);
router.delete('/sources/:id', auth_middleware_js_1.authenticateUser, sources_controller_js_1.deleteSource);
exports.default = router;
