import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

export interface AuthenticatedUser {
  id: string;
  email?: string;
  user_metadata?: Record<string, any>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const authenticateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
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

    // Support instant Demo Sandbox session
    if (token === 'demo-test-token' || token.startsWith('demo-')) {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'researcher@unify.ai',
        user_metadata: { full_name: 'Dr. Jane Vance (Principal Researcher)' },
      };
      return next();
    }

    // Verify token using Supabase Auth
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
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
  } catch (err: any) {
    console.error('Authentication verification error:', err);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to verify authentication token',
    });
  }
};
