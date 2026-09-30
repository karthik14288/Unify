"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateUser = void 0;
const supabase_js_1 = require("../lib/supabase.js");
const authenticateUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Missing or malformed Authorization header. Expected Bearer <token>',
            });
            return;
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            res.status(401).json({
                error: 'Unauthorized',
                message: 'Bearer token not found in Authorization header',
            });
            return;
        }
        // Verify token using Supabase Auth
        const { data: { user }, error } = await supabase_js_1.supabaseAdmin.auth.getUser(token);
        if (error || !user) {
            // In development mode, check if a demo token is allowed
            if (process.env.NODE_ENV === 'development' && token === 'demo-test-token') {
                req.user = {
                    id: '00000000-0000-0000-0000-000000000001',
                    email: 'demo@unify.ai',
                    user_metadata: { full_name: 'Demo Researcher' }
                };
                return next();
            }
            res.status(401).json({
                error: 'Unauthorized',
                message: error ? error.message : 'Invalid or expired Supabase authentication session',
            });
            return;
        }
        req.user = {
            id: user.id,
            email: user.email,
            user_metadata: user.user_metadata,
        };
        next();
    }
    catch (err) {
        console.error('Authentication verification error:', err);
        res.status(500).json({
            error: 'Internal Server Error',
            message: 'Failed to verify authentication token',
        });
    }
};
exports.authenticateUser = authenticateUser;
