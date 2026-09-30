"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = exports.EnvSchema = void 0;
const zod_1 = require("zod");
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
exports.EnvSchema = zod_1.z.object({
    PORT: zod_1.z.string().default('8080').transform((val) => parseInt(val, 10)),
    SUPABASE_URL: zod_1.z.string().url('SUPABASE_URL must be a valid URL'),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
    SUPABASE_JWKS_URL: zod_1.z.string().url().optional(),
    GEMINI_API_KEY: zod_1.z.string().optional().default(''),
});
let envConfig;
try {
    envConfig = exports.EnvSchema.parse(process.env);
}
catch (error) {
    if (error instanceof zod_1.z.ZodError) {
        console.error('❌ Environment configuration error:');
        error.errors.forEach((err) => {
            console.error(`   - ${err.path.join('.')}: ${err.message}`);
        });
        process.exit(1);
    }
    throw error;
}
exports.env = envConfig;
