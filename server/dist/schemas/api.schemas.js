"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UploadQuerySchema = exports.RagSynthesisResponseSchema = exports.CitationSchema = exports.ChatRequestSchema = exports.LensEnum = void 0;
const zod_1 = require("zod");
exports.LensEnum = zod_1.z.enum(['Education', 'Healthcare', 'Agriculture']);
exports.ChatRequestSchema = zod_1.z.object({
    query: zod_1.z.string().min(2, 'Query must be at least 2 characters long'),
    lens: exports.LensEnum,
});
exports.CitationSchema = zod_1.z.object({
    citation_id: zod_1.z.string(),
    source_file_name: zod_1.z.string(),
    location: zod_1.z.string().describe('Timestamp (e.g., 0:15-0:30) or Page Number'),
    snippet: zod_1.z.string().describe('A brief quote of the exact source text used'),
});
exports.RagSynthesisResponseSchema = zod_1.z.object({
    answer: zod_1.z.string().describe("The synthesized answer using markdown and inline citations like [1], [2]."),
    citations: zod_1.z.array(exports.CitationSchema),
});
exports.UploadQuerySchema = zod_1.z.object({
    lens: exports.LensEnum.default('Education'),
});
