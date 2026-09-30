-- ====================================================================
-- UNIFY PLATFORM DATABASE SCHEMA & VECTOR CONFIGURATION
-- Execute this entire script in your Supabase SQL Editor
-- ====================================================================

-- 1. Enable the pgvector extension for high-performance vector search
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the sources table to track ingested multimodal files
CREATE TABLE IF NOT EXISTS sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    lens_category TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create document_chunks table with 768-dimensional vector embedding
CREATE TABLE IF NOT EXISTS document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    page_number INT,
    start_time NUMERIC,
    end_time NUMERIC,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create HNSW index for fast vector cosine similarity search
CREATE INDEX IF NOT EXISTS document_chunks_embedding_hnsw_idx 
ON document_chunks USING hnsw (embedding vector_cosine_ops);

-- Additional indexing for relational lookups
CREATE INDEX IF NOT EXISTS sources_user_id_idx ON sources (user_id);
CREATE INDEX IF NOT EXISTS sources_lens_idx ON sources (lens_category);
CREATE INDEX IF NOT EXISTS document_chunks_source_id_idx ON document_chunks (source_id);
CREATE INDEX IF NOT EXISTS document_chunks_user_id_idx ON document_chunks (user_id);

-- 5. Row Level Security (RLS) Policies
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

-- Sources RLS
DROP POLICY IF EXISTS "Users can only view their own sources" ON sources;
CREATE POLICY "Users can only view their own sources" 
ON sources FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own sources" ON sources;
CREATE POLICY "Users can insert their own sources" 
ON sources FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own sources" ON sources;
CREATE POLICY "Users can delete their own sources" 
ON sources FOR DELETE USING (auth.uid() = user_id);

-- Document Chunks RLS
DROP POLICY IF EXISTS "Users can only view their own chunks" ON document_chunks;
CREATE POLICY "Users can only view their own chunks" 
ON document_chunks FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own chunks" ON document_chunks;
CREATE POLICY "Users can insert their own chunks" 
ON document_chunks FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own chunks" ON document_chunks;
CREATE POLICY "Users can delete their own chunks" 
ON document_chunks FOR DELETE USING (auth.uid() = user_id);

-- 6. RPC Function for similarity search
CREATE OR REPLACE FUNCTION match_chunks (
    query_embedding vector(768),
    match_threshold float DEFAULT 0.0,
    match_count int DEFAULT 5,
    filter_user_id uuid DEFAULT NULL,
    filter_lens text DEFAULT NULL
)
RETURNS TABLE (
    id uuid,
    source_id uuid,
    content text,
    page_number int,
    start_time numeric,
    end_time numeric,
    file_name text,
    file_type text,
    lens_category text,
    similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.source_id,
        dc.content,
        dc.page_number,
        dc.start_time,
        dc.end_time,
        s.file_name,
        s.file_type,
        s.lens_category,
        (1 - (dc.embedding <=> query_embedding))::float AS similarity
    FROM document_chunks dc
    JOIN sources s ON s.id = dc.source_id
    WHERE (filter_user_id IS NULL OR dc.user_id = filter_user_id)
      AND (filter_lens IS NULL OR s.lens_category = filter_lens)
      AND (1 - (dc.embedding <=> query_embedding)) >= match_threshold
    ORDER BY dc.embedding <=> query_embedding ASC
    LIMIT match_count;
END;
$$;
