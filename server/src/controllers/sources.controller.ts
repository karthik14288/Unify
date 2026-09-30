import { Request, Response } from 'express';
import { supabaseAdmin } from '../lib/supabase.js';

export const getSources = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      return;
    }

    const lens = req.query.lens as string | undefined;

    let query = supabaseAdmin
      .from('sources')
      .select(`
        id,
        user_id,
        file_name,
        file_type,
        storage_path,
        lens_category,
        created_at,
        document_chunks (count)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (lens && ['Education', 'Healthcare', 'Agriculture'].includes(lens)) {
      query = query.eq('lens_category', lens);
    }

    const { data: sources, error } = await query;

    if (error) {
      if (error.code === 'PGRST205' || error.message.includes('sources')) {
        console.warn('⚠️ sources table does not exist yet. Please execute database/schema.sql in Supabase SQL editor.');
        res.status(200).json({
          sources: [],
          schemaNotice: 'Table public.sources has not been created yet. Please execute database/schema.sql in Supabase SQL Editor.',
        });
        return;
      }
      console.error('❌ Error fetching sources:', error);
      res.status(500).json({ error: 'Database Error', message: error.message });
      return;
    }

    const formatted = (sources || []).map((s: any) => ({
      id: s.id,
      fileName: s.file_name,
      fileType: s.file_type,
      storagePath: s.storage_path,
      lensCategory: s.lens_category,
      createdAt: s.created_at,
      chunksCount: s.document_chunks?.[0]?.count || 0,
    }));

    res.status(200).json({ sources: formatted });
  } catch (error: any) {
    console.error('❌ Failed to get sources:', error);
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};

export const deleteSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: 'Unauthorized', message: 'User not authenticated' });
      return;
    }

    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Bad Request', message: 'Source ID is required' });
      return;
    }

    // 1. Get source record to find storage path
    const { data: source, error: findError } = await supabaseAdmin
      .from('sources')
      .select('id, storage_path, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (findError || !source) {
      res.status(404).json({ error: 'Not Found', message: 'Source not found or unauthorized' });
      return;
    }

    // 2. Delete storage file if present
    if (source.storage_path) {
      await supabaseAdmin.storage.from('unify-sources').remove([source.storage_path]);
    }

    // 3. Delete from database (cascades to document_chunks)
    const { error: deleteError } = await supabaseAdmin
      .from('sources')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (deleteError) {
      res.status(500).json({ error: 'Database Error', message: deleteError.message });
      return;
    }

    res.status(200).json({ success: true, message: 'Source deleted successfully' });
  } catch (error: any) {
    console.error('❌ Failed to delete source:', error);
    res.status(500).json({ error: 'Internal Error', message: error.message });
  }
};
