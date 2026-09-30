"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUpload = void 0;
const supabase_js_1 = require("../lib/supabase.js");
const genai_service_js_1 = require("../services/genai.service.js");
const vector_service_js_1 = require("../services/vector.service.js");
const api_schemas_js_1 = require("../schemas/api.schemas.js");
const BUCKET_NAME = 'unify-sources';
/**
 * Ensure storage bucket exists
 */
async function ensureBucketExists() {
    try {
        const { data: buckets } = await supabase_js_1.supabaseAdmin.storage.listBuckets();
        const exists = buckets?.some((b) => b.name === BUCKET_NAME);
        if (!exists) {
            await supabase_js_1.supabaseAdmin.storage.createBucket(BUCKET_NAME, { public: true });
        }
    }
    catch (err) {
        console.warn('⚠️ Bucket existence check note:', err);
    }
}
const handleUpload = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
            return;
        }
        const file = req.file;
        if (!file) {
            res.status(400).json({
                error: 'Bad Request',
                message: 'No file provided. Please attach a file using the "file" field.',
            });
            return;
        }
        // Lens category from req.body (default to Agriculture or Education)
        const rawLens = req.body.lens || 'Agriculture';
        const lensParse = api_schemas_js_1.LensEnum.safeParse(rawLens);
        const lens = lensParse.success ? lensParse.data : 'Agriculture';
        const customApiKey = req.headers['x-gemini-api-key'] || undefined;
        console.log(`📥 Received upload: "${file.originalname}" (${file.mimetype}, ${file.size} bytes) for Lens: [${lens}]`);
        // 1. Ensure bucket exists and upload file to Supabase Storage
        await ensureBucketExists();
        const sanitizedFileName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
        const storagePath = `${user.id}/${Date.now()}_${sanitizedFileName}`;
        const { error: uploadError } = await supabase_js_1.supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(storagePath, file.buffer, {
            contentType: file.mimetype,
            upsert: true,
        });
        if (uploadError) {
            console.warn(`⚠️ Supabase storage upload warning: ${uploadError.message}. Proceeding with processing...`);
        }
        // 2. Insert record into `sources` table
        const { data: sourceRecord, error: sourceError } = await supabase_js_1.supabaseAdmin
            .from('sources')
            .insert({
            user_id: user.id,
            file_name: file.originalname,
            file_type: file.mimetype,
            storage_path: storagePath,
            lens_category: lens,
        })
            .select()
            .single();
        if (sourceError || !sourceRecord) {
            console.error('❌ Failed to insert source record:', sourceError);
            res.status(500).json({
                error: 'Database Error',
                message: `Failed to save source record: ${sourceError?.message || 'Unknown error'}. Please verify database/schema.sql has been run.`,
            });
            return;
        }
        const sourceId = sourceRecord.id;
        // 3. AI Extraction via Gemini Multimodal API (gemini-2.5-pro)
        let extractedText = '';
        try {
            extractedText = await genai_service_js_1.genaiService.extractMultimodalContent(file.buffer, file.mimetype, file.originalname, customApiKey);
        }
        catch (extractError) {
            console.error('❌ Gemini Multimodal Extraction failed:', extractError.message);
            // Clean up source record if extraction fails
            await supabase_js_1.supabaseAdmin.from('sources').delete().eq('id', sourceId);
            res.status(500).json({
                error: 'AI Extraction Failed',
                message: `Gemini processing failed: ${extractError.message}`,
            });
            return;
        }
        // 4. Chunk the extracted text
        const chunks = vector_service_js_1.vectorService.chunkText(extractedText);
        console.log(`🧩 Created ${chunks.length} semantic chunks for "${file.originalname}"`);
        // 5. Generate vector embeddings for all chunks via text-embedding-004
        const embeddings = [];
        for (let i = 0; i < chunks.length; i++) {
            try {
                const emb = await genai_service_js_1.genaiService.generateEmbedding(chunks[i].content, customApiKey);
                embeddings.push(emb);
            }
            catch (embErr) {
                console.error(`❌ Failed to embed chunk ${i + 1}:`, embErr.message);
                throw new Error(`Embedding generation failed at chunk ${i + 1}: ${embErr.message}`);
            }
        }
        // 6. Save chunks and embeddings into document_chunks
        await vector_service_js_1.vectorService.saveChunks(sourceId, user.id, chunks, embeddings);
        res.status(201).json({
            success: true,
            message: `File "${file.originalname}" successfully processed and vectorized across ${chunks.length} chunks.`,
            source: sourceRecord,
            chunksCount: chunks.length,
            extractedPreview: extractedText.slice(0, 300) + '...',
        });
    }
    catch (error) {
        console.error('❌ Upload pipeline error:', error);
        res.status(500).json({
            error: 'Ingestion Pipeline Error',
            message: error.message || 'An unexpected error occurred during ingestion',
        });
    }
};
exports.handleUpload = handleUpload;
