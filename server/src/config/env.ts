import { z } from 'zod';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config();

export const EnvSchema = z.object({
  PORT: z.string().default('8080').transform((val) => parseInt(val, 10)),
  SUPABASE_URL: z.string().url('SUPABASE_URL must be a valid URL'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  SUPABASE_JWKS_URL: z.string().url().optional(),
  GEMINI_API_KEY: z.string().optional().default(''),
});

export type Env = z.infer<typeof EnvSchema>;

let envConfig: Env;

try {
  envConfig = EnvSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('❌ Environment configuration error:');
    error.errors.forEach((err) => {
      console.error(`   - ${err.path.join('.')}: ${err.message}`);
    });
    process.exit(1);
  }
  throw error;
}

export const env = envConfig;
