import { Request, Response } from 'express';
import { ChatRequestSchema } from '../schemas/api.schemas.js';
import { genaiService } from '../services/genai.service.js';
import { vectorService } from '../services/vector.service.js';

export const handleChat = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      return;
    }

    // Validate request body
    const parseResult = ChatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        error: 'Validation Error',
        message: parseResult.error.errors.map((e) => e.message).join(', '),
      });
      return;
    }

    const { query, lens } = parseResult.data;
    const customApiKey = (req.headers['x-gemini-api-key'] as string) || undefined;

    console.log(`💬 User [${user.id}] queried: "${query}" in Lens [${lens}]`);

    // 1. Generate query embedding with text-embedding-004
    let queryEmbedding: number[];
    try {
      queryEmbedding = await genaiService.generateEmbedding(query, customApiKey);
    } catch (embedError: any) {
      if (embedError.message.includes('Gemini API key is not configured')) {
        res.status(200).json({
          answer: `### 🔑 Gemini API Key Configuration Required\n\nTo perform cross-modal semantic search and multi-format RAG reasoning with **Gemini 2.5 Pro** and **text-embedding-004**, a Gemini API key is required.\n\n**Quick Setup Options:**\n1. **Directly in UI**: Click the **System & Schema** (gear icon) in the header or sidebar to paste your key into your browser.\n2. **In Server Config**: Open \`server/.env\` and set \`GEMINI_API_KEY=your_key_here\`.\n\n*You can obtain a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).*\n\nOnce added, your queries will immediately search your 768-dimensional pgvector index and return exact citations!`,
          citations: [],
          lens,
          retrievedChunksCount: 0,
        });
        return;
      }
      res.status(500).json({
        error: 'Embedding Failed',
        message: `Failed to embed query: ${embedError.message}`,
      });
      return;
    }

    // 2. Perform vector similarity search for top 5 multimodal chunks
    const retrievedChunks = await vectorService.searchSimilarChunks(
      queryEmbedding,
      user.id,
      lens,
      5
    );

    console.log(`🔍 Retrieved ${retrievedChunks.length} relevant chunks for query`);

    // 3. Synthesize answer with structured citations using Gemini 2.5 Pro
    let synthesisResult;
    try {
      synthesisResult = await genaiService.synthesizeAnswerWithCitations(
        query,
        lens,
        retrievedChunks,
        customApiKey
      );
    } catch (synthError: any) {
      res.status(500).json({
        error: 'Synthesis Failed',
        message: `Reasoning generation failed: ${synthError.message}`,
      });
      return;
    }

    res.status(200).json({
      answer: synthesisResult.answer,
      citations: synthesisResult.citations,
      lens,
      retrievedChunksCount: retrievedChunks.length,
      chunks: retrievedChunks.map((c) => ({
        id: c.id,
        source_id: c.source_id,
        file_name: c.file_name,
        file_type: c.file_type,
        page_number: c.page_number,
        start_time: c.start_time,
        end_time: c.end_time,
        similarity: c.similarity,
        preview: c.content.slice(0, 150) + '...',
      })),
    });
  } catch (error: any) {
    console.error('❌ Chat handler error:', error);
    res.status(500).json({
      error: 'Internal Chat Error',
      message: error.message || 'An unexpected error occurred while processing query',
    });
  }
};
