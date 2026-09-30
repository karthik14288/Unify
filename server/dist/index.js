"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_js_1 = require("./config/env.js");
const api_routes_js_1 = __importDefault(require("./routes/api.routes.js"));
const app = (0, express_1.default)();
// Configure CORS
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow local development origins or no-origin (mobile, curl)
        callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-gemini-api-key'],
}));
// Body parsing middleware
app.use(express_1.default.json({ limit: '50mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '50mb' }));
// Logging middleware
app.use((req, _res, next) => {
    const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
    console.log(`[${timestamp}] ${req.method} ${req.path}`);
    next();
});
// Mount API routes
app.use('/api', api_routes_js_1.default);
// Global Error Handler
app.use((err, _req, res, _next) => {
    console.error('💥 Unhandled Express Error:', err);
    res.status(err.status || 500).json({
        error: err.name || 'InternalServerError',
        message: err.message || 'An unexpected server error occurred',
    });
});
// Start Express Server
const server = app.listen(env_js_1.env.PORT, () => {
    console.log(`
  ======================================================
  🚀 UNIFY — Cross-Modal AI Understanding Platform Backend
  📡 Server listening on: http://localhost:${env_js_1.env.PORT}
  🔗 Supabase Project: ${env_js_1.env.SUPABASE_URL}
  ✨ Gemini 2.5 Pro & text-embedding-004 Engine Armed
  ======================================================
  `);
});
exports.default = app;
