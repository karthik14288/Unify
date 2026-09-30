import { z } from 'zod';

export const LensEnum = z.enum(['Education', 'Healthcare', 'Agriculture']);
export type LensType = z.infer<typeof LensEnum>;

export const ChatRequestSchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters long'),
  lens: LensEnum,
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

export const CitationSchema = z.object({
  citation_id: z.string(),
  source_file_name: z.string(),
  location: z.string().describe('Timestamp (e.g., 0:15-0:30) or Page Number'),
  snippet: z.string().describe('A brief quote of the exact source text used'),
});

export type Citation = z.infer<typeof CitationSchema>;

export const RagSynthesisResponseSchema = z.object({
  answer: z.string().describe("The synthesized answer using markdown and inline citations like [1], [2]."),
  citations: z.array(CitationSchema),
});

export type RagSynthesisResponse = z.infer<typeof RagSynthesisResponseSchema>;

export const UploadQuerySchema = z.object({
  lens: LensEnum.default('Education'),
});
