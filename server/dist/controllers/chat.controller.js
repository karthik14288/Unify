"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleChat = void 0;
const api_schemas_js_1 = require("../schemas/api.schemas.js");
const genai_service_js_1 = require("../services/genai.service.js");
const vector_service_js_1 = require("../services/vector.service.js");
const handleChat = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
            return;
        }
        // Validate request body
        const parseResult = api_schemas_js_1.ChatRequestSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({
                error: 'Validation Error',
                message: parseResult.error.errors.map((e) => e.message).join(', '),
            });
            return;
        }
        const { query, lens } = parseResult.data;
        const customApiKey = req.headers['x-gemini-api-key'] || undefined;
        console.log(`💬 User [${user.id}] queried: "${query}" in Lens [${lens}]`);
        // 1. Generate query embedding with text-embedding-004
        let queryEmbedding;
        try {
            queryEmbedding = await genai_service_js_1.genaiService.generateEmbedding(query, customApiKey);
        }
        catch (embedError) {
            res.status(500).json({
                error: 'Embedding Failed',
                message: `Failed to embed query: ${embedError.message}`,
            });
            return;
        }
        // 2. Perform vector similarity search for top 5 multimodal chunks
        const retrievedChunks = await vector_service_js_1.vectorService.searchSimilarChunks(queryEmbedding, user.id, lens, 5);
        console.log(`🔍 Retrieved ${retrievedChunks.length} relevant chunks for query`);
        // 3. Synthesize answer with structured citations using Gemini 2.5 Pro
        let synthesisResult;
        try {
            synthesisResult = await genai_service_js_1.genaiService.synthesizeAnswerWithCitations(query, lens, retrievedChunks, customApiKey);
        }
        catch (synthError) {
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
    }
    catch (error) {
        console.error('❌ Chat handler error:', error);
        res.status(500).json({
            error: 'Internal Chat Error',
            message: error.message || 'An unexpected error occurred while processing query',
        });
    }
};
exports.handleChat = handleChat;
