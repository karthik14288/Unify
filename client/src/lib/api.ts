const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export interface SourceItem {
  id: string;
  fileName: string;
  fileType: string;
  storagePath: string;
  lensCategory: 'Education' | 'Healthcare' | 'Agriculture';
  createdAt: string;
  chunksCount: number;
}

export interface CitationItem {
  citation_id: string;
  source_file_name: string;
  location: string;
  snippet: string;
}

export interface ChatResponse {
  answer: string;
  citations: CitationItem[];
  lens: string;
  retrievedChunksCount: number;
  chunks?: Array<{
    id: string;
    source_id: string;
    file_name: string;
    file_type: string;
    page_number?: number | null;
    start_time?: number | null;
    end_time?: number | null;
    similarity?: number;
    preview: string;
  }>;
}

export const getStoredApiKey = (): string => {
  return localStorage.getItem('unify_custom_gemini_key') || '';
};

export const setStoredApiKey = (key: string): void => {
  if (key) {
    localStorage.setItem('unify_custom_gemini_key', key);
  } else {
    localStorage.removeItem('unify_custom_gemini_key');
  }
};

const getHeaders = (token: string | null): Record<string, string> => {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token || ''}`,
  };
  const customKey = getStoredApiKey();
  if (customKey) {
    headers['x-gemini-api-key'] = customKey;
  }
  return headers;
};

export const api = {
  async getStatus(): Promise<{
    geminiKeyConfigured: boolean;
    supabaseConnected: boolean;
    schemaReady: boolean;
    port: number;
  }> {
    const res = await fetch(`${API_URL}/api/status`);
    if (!res.ok) throw new Error('Failed to fetch system status');
    return res.json();
  },

  async getSources(token: string | null, lens?: string): Promise<SourceItem[]> {
    const url = lens ? `${API_URL}/api/sources?lens=${encodeURIComponent(lens)}` : `${API_URL}/api/sources`;
    const res = await fetch(url, {
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to fetch knowledge sources');
    }
    const data = await res.json();
    return data.sources || [];
  },

  async deleteSource(token: string | null, id: string): Promise<void> {
    const res = await fetch(`${API_URL}/api/sources/${id}`, {
      method: 'DELETE',
      headers: getHeaders(token),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete source');
    }
  },

  async uploadFile(
    token: string | null,
    file: File,
    lens: string,
    onProgress?: (stage: 'Uploading' | 'Extracting' | 'Chunking' | 'Embedding' | 'Saved') => void
  ): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('lens', lens);

    if (onProgress) onProgress('Uploading');

    // Simulate pipeline stage progression feedback for user delight
    const timer1 = setTimeout(() => onProgress?.('Extracting'), 800);
    const timer2 = setTimeout(() => onProgress?.('Chunking'), 3500);
    const timer3 = setTimeout(() => onProgress?.('Embedding'), 5500);

    try {
      const headers = getHeaders(token);
      // Let browser set multipart content-type boundary
      delete (headers as any)['Content-Type'];

      const res = await fetch(`${API_URL}/api/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to process and vectorize file');
      }

      if (onProgress) onProgress('Saved');
      return await res.json();
    } catch (error) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      throw error;
    }
  },

  async sendChat(
    token: string | null,
    query: string,
    lens: string
  ): Promise<ChatResponse> {
    const headers = getHeaders(token);
    headers['Content-Type'] = 'application/json';

    const res = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ query, lens }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to get answer from reasoning pipeline');
    }

    return await res.json();
  },
};
