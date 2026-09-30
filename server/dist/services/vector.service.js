"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vectorService = exports.VectorService = void 0;
const supabase_js_1 = require("../lib/supabase.js");
class VectorService {
    /**
     * Split extracted multimodal text into cohesive chunks with preserved timestamp/page metadata
     */
    chunkText(extractedText) {
        const paragraphs = extractedText
            .split(/\n\s*\n/)
            .map((p) => p.trim())
            .filter(Boolean);
        const chunks = [];
        let currentChunkText = '';
        let currentPage = null;
        let currentStartTime = null;
        let currentEndTime = null;
        // Helper to parse [MM:SS] or MM:SS to seconds
        const parseTime = (timeStr) => {
            const match = timeStr.match(/(?:(\d{1,2}):)?(\d{1,2}):(\d{2})/);
            if (!match)
                return null;
            const hours = match[1] ? parseInt(match[1], 10) : 0;
            const minutes = parseInt(match[2], 10);
            const seconds = parseInt(match[3], 10);
            return hours * 3600 + minutes * 60 + seconds;
        };
        // Helper to parse page number like "Page 2" or "[Page 3]"
        const parsePage = (text) => {
            const match = text.match(/(?:\[|\b)Page\s*(\d+)(?:\]|\b)/i);
            return match ? parseInt(match[1], 10) : null;
        };
        for (const paragraph of paragraphs) {
            // Check for timestamp markers in the paragraph
            const timeMatch = paragraph.match(/\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?/);
            if (timeMatch) {
                const parsed = parseTime(timeMatch[1]);
                if (parsed !== null) {
                    if (currentStartTime === null)
                        currentStartTime = parsed;
                    currentEndTime = parsed;
                }
            }
            // Check for page markers
            const pageNum = parsePage(paragraph);
            if (pageNum !== null) {
                currentPage = pageNum;
            }
            // Check chunk length (~1000 characters or ~200 words)
            if (currentChunkText.length + paragraph.length > 900) {
                if (currentChunkText.trim().length > 0) {
                    chunks.push({
                        content: currentChunkText.trim(),
                        page_number: currentPage,
                        start_time: currentStartTime,
                        end_time: currentEndTime,
                    });
                }
                currentChunkText = paragraph + '\n\n';
                // Reset or carry over metadata
                currentStartTime = timeMatch ? parseTime(timeMatch[1]) : currentEndTime;
            }
            else {
                currentChunkText += paragraph + '\n\n';
            }
        }
        if (currentChunkText.trim().length > 0) {
            chunks.push({
                content: currentChunkText.trim(),
                page_number: currentPage,
                start_time: currentStartTime,
                end_time: currentEndTime,
            });
        }
        // Fallback if no paragraph breaks existed
        if (chunks.length === 0 && extractedText.trim().length > 0) {
            chunks.push({
                content: extractedText.trim(),
                page_number: null,
                start_time: null,
                end_time: null,
            });
        }
        return chunks;
    }
    /**
     * Save chunks and their embeddings into Supabase document_chunks
     */
    async saveChunks(sourceId, userId, chunks, embeddings) {
        if (chunks.length !== embeddings.length) {
            throw new Error('Mismatch between chunk count and embedding count');
        }
        const records = chunks.map((chunk, index) => ({
            source_id: sourceId,
            user_id: userId,
            content: chunk.content,
            page_number: chunk.page_number ?? null,
            start_time: chunk.start_time ?? null,
            end_time: chunk.end_time ?? null,
            embedding: embeddings[index],
        }));
        // Batch insert into document_chunks
        const { error } = await supabase_js_1.supabaseAdmin.from('document_chunks').insert(records);
        if (error) {
            console.error('❌ Failed to insert document chunks into Supabase:', error);
            throw new Error(`Failed to store document chunks: ${error.message}`);
        }
        console.log(`✅ Stored ${records.length} chunks with vector embeddings for source ${sourceId}`);
    }
    /**
     * Search for closest vector chunks using Supabase RPC or in-memory fallback
     */
    async searchSimilarChunks(queryEmbedding, userId, lens, limit = 5) {
        try {
            // 1. First attempt: call the optimized match_chunks RPC function
            const { data, error } = await supabase_js_1.supabaseAdmin.rpc('match_chunks', {
                query_embedding: queryEmbedding,
                match_threshold: 0.0,
                match_count: limit,
                filter_user_id: userId,
                filter_lens: lens,
            });
            if (!error && Array.isArray(data) && data.length > 0) {
                return data.map((item) => ({
                    id: item.id,
                    source_id: item.source_id,
                    file_name: item.file_name,
                    file_type: item.file_type,
                    lens_category: item.lens_category,
                    page_number: item.page_number,
                    start_time: item.start_time,
                    end_time: item.end_time,
                    content: item.content,
                    similarity: item.similarity,
                }));
            }
            if (error) {
                console.warn('⚠️ match_chunks RPC returned error (will try relational fallback):', error.message);
            }
        }
        catch (rpcErr) {
            console.warn('⚠️ RPC call failed, falling back to direct table query:', rpcErr.message);
        }
        // 2. Fallback: Select chunks directly and perform cosine similarity
        try {
            const { data: chunks, error: chunksError } = await supabase_js_1.supabaseAdmin
                .from('document_chunks')
                .select(`
          id,
          source_id,
          content,
          page_number,
          start_time,
          end_time,
          embedding,
          sources (
            file_name,
            file_type,
            lens_category
          )
        `)
                .eq('user_id', userId);
            if (chunksError || !chunks) {
                console.warn('⚠️ Fallback query error:', chunksError?.message);
                return [];
            }
            // Compute cosine similarity in memory
            const cosineSimilarity = (vecA, vecB) => {
                let dot = 0;
                let magA = 0;
                let magB = 0;
                for (let i = 0; i < vecA.length; i++) {
                    dot += vecA[i] * vecB[i];
                    magA += vecA[i] * vecA[i];
                    magB += vecB[i] * vecB[i];
                }
                if (magA === 0 || magB === 0)
                    return 0;
                return dot / (Math.sqrt(magA) * Math.sqrt(magB));
            };
            const ranked = chunks
                .filter((chunk) => {
                const source = chunk.sources;
                return !lens || !source || source.lens_category === lens;
            })
                .map((chunk) => {
                const emb = typeof chunk.embedding === 'string'
                    ? JSON.parse(chunk.embedding)
                    : chunk.embedding;
                const similarity = Array.isArray(emb) ? cosineSimilarity(queryEmbedding, emb) : 0;
                return {
                    id: chunk.id,
                    source_id: chunk.source_id,
                    file_name: chunk.sources?.file_name || 'Unknown Document',
                    file_type: chunk.sources?.file_type || 'Unknown Modality',
                    lens_category: chunk.sources?.lens_category || lens,
                    page_number: chunk.page_number,
                    start_time: chunk.start_time,
                    end_time: chunk.end_time,
                    content: chunk.content,
                    similarity,
                };
            })
                .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
                .slice(0, limit);
            return ranked;
        }
        catch (fallbackError) {
            console.error('❌ Vector search fallback failed:', fallbackError);
            return [];
        }
    }
}
exports.VectorService = VectorService;
exports.vectorService = new VectorService();
