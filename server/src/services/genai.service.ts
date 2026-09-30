import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env.js';
import { RagSynthesisResponse, RagSynthesisResponseSchema, LensType } from '../schemas/api.schemas.js';

export interface RetrievedChunkContext {
  id: string;
  source_id: string;
  file_name: string;
  file_type: string;
  lens_category: string;
  page_number?: number | null;
  start_time?: number | null;
  end_time?: number | null;
  content: string;
  similarity?: number;
}

export class GenAIService {
  private getClient(customApiKey?: string): GoogleGenAI {
    const key = customApiKey || env.GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        'Gemini API key is not configured. Please provide GEMINI_API_KEY in server/.env or in the request headers.'
      );
    }
    return new GoogleGenAI({ apiKey: key });
  }

  /**
   * Extract text, OCR, diagrams, or transcripts from multimodal input
   */
  async extractMultimodalContent(
    fileBuffer: Buffer,
    mimeType: string,
    fileName: string,
    customApiKey?: string
  ): Promise<string> {
    const client = this.getClient(customApiKey);

    const extractionPrompt = 
      "Analyze this file. If it's audio/video, transcribe it and include timestamps in [MM:SS] format. " +
      "If it's a document or image, extract the text, describe any diagrams in detail, and note page numbers. " +
      "Output raw, highly descriptive text optimized for vector chunking.";

    try {
      console.log(`🤖 Processing file "${fileName}" (${mimeType}) with Gemini 2.5 Pro...`);

      // Text files can be sent as text, while binary/multimodal files are passed as inlineData base64
      let contents: any;
      if (mimeType.startsWith('text/') || mimeType === 'application/json' || mimeType === 'text/csv') {
        const textContent = fileBuffer.toString('utf-8');
        contents = [
          {
            role: 'user',
            parts: [
              { text: `${extractionPrompt}\n\nFile Name: ${fileName}\n\nContent:\n${textContent}` },
            ],
          },
        ];
      } else {
        const base64Data = fileBuffer.toString('base64');
        contents = [
          {
            role: 'user',
            parts: [
              { text: `${extractionPrompt}\n\nFile Name: ${fileName}` },
              {
                inlineData: {
                  mimeType,
                  data: base64Data,
                },
              },
            ],
          },
        ];
      }

      const response = await client.models.generateContent({
        model: 'gemini-2.5-pro',
        contents,
      });

      const extractedText = response.text?.trim() || '';
      if (!extractedText) {
        throw new Error('Gemini returned an empty extraction result');
      }

      console.log(`✅ Extracted ${extractedText.length} characters from "${fileName}".`);
      return extractedText;
    } catch (error: any) {
      console.error(`❌ Gemini extraction failed for "${fileName}":`, error.message);
      throw error;
    }
  }

  /**
   * Generate 768-dimensional vector embedding using text-embedding-004
   */
  async generateEmbedding(text: string, customApiKey?: string): Promise<number[]> {
    const client = this.getClient(customApiKey);

    try {
      // Truncate safely if exceeding text-embedding-004 token limits (~2048 tokens / ~8000 chars)
      const cleanText = text.slice(0, 8000);

      const response = await client.models.embedContent({
        model: 'text-embedding-004',
        contents: cleanText,
      });

      // Handle response structure from @google/genai
      const embeddingValues =
        (response as any).embedding?.values ||
        response.embeddings?.[0]?.values;

      if (!embeddingValues || !Array.isArray(embeddingValues)) {
        throw new Error('Failed to retrieve vector values from embedding API response');
      }

      return embeddingValues;
    } catch (error: any) {
      console.error('❌ Embedding generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Domain-specific guidance to complement the base system prompt
   */
  private getDomainGuidance(lens: LensType): string {
    switch (lens) {
      case 'Education':
        return (
          'DOMAIN LENS [EDUCATION]: Focus on pedagogical clarity, academic rigor, synthesizing lecture transcripts, ' +
          'handouts, and whiteboard formulas. Explain core concepts step-by-step.'
        );
      case 'Healthcare':
        return (
          'DOMAIN LENS [HEALTHCARE]: Focus on clinical precision, synthesizing patient memos, lab reports, and vital markers. ' +
          'Maintain high clinical caution and clearly cite diagnostic tests and observation timestamps.'
        );
      case 'Agriculture':
        return (
          'DOMAIN LENS [AGRICULTURE]: Focus on agronomic diagnosis, synthesizing field voice notes, drone aerial imagery, and ' +
          'soil sensor readings (e.g., nitrogen deficiency, soil moisture, pest damage). Provide actionable recommendations.'
        );
      default:
        return '';
    }
  }

  /**
   * Synthesize an answer with structured citations using Gemini 2.5 Pro
   */
  async synthesizeAnswerWithCitations(
    query: string,
    lens: LensType,
    chunks: RetrievedChunkContext[],
    customApiKey?: string
  ): Promise<RagSynthesisResponse> {
    const client = this.getClient(customApiKey);

    const domainGuidance = this.getDomainGuidance(lens);

    const baseSystemPrompt = 
      `You are Unify, an advanced cross-modal reasoning AI. You are currently operating under the ${lens} lens.\n` +
      `Your goal is to answer the user's query by synthesizing the provided context chunks.\n` +
      `The context chunks come from various modalities (audio transcripts, scanned documents, images, video).\n` +
      `CRITICAL RULE: You must base your answer strictly on the provided context.\n` +
      `CITATION RULE: You must cite your sources. For every factual claim, append a citation reference in the format [1], [2], etc., matching the citation_id.\n` +
      `You will return a structured JSON response containing the 'answer' string (with markdown and inline citations) ` +
      `and a 'citations' array mapping the citation_ids back to their file names and specific locations (timestamps or page numbers).\n` +
      `${domainGuidance}`;

    // Format retrieved chunks with clear IDs and metadata
    const formattedContext = chunks.length === 0
      ? "No relevant knowledge base chunks found."
      : chunks.map((chunk, index) => {
          const citationId = `${index + 1}`;
          let locationStr = 'General';
          if (chunk.page_number !== null && chunk.page_number !== undefined) {
            locationStr = `Page ${chunk.page_number}`;
          } else if (chunk.start_time !== null && chunk.start_time !== undefined) {
            const startMin = Math.floor(Number(chunk.start_time) / 60);
            const startSec = Math.floor(Number(chunk.start_time) % 60).toString().padStart(2, '0');
            const endMin = chunk.end_time ? Math.floor(Number(chunk.end_time) / 60) : startMin;
            const endSec = chunk.end_time ? Math.floor(Number(chunk.end_time) % 60).toString().padStart(2, '0') : '';
            locationStr = endSec ? `${startMin}:${startSec} - ${endMin}:${endSec}` : `${startMin}:${startSec}`;
          }

          return (
            `--- CONTEXT CHUNK [${citationId}] ---\n` +
            `Citation ID: [${citationId}]\n` +
            `Source File: ${chunk.file_name}\n` +
            `Modality/Type: ${chunk.file_type}\n` +
            `Location: ${locationStr}\n` +
            `Lens Category: ${chunk.lens_category}\n` +
            `Content:\n${chunk.content}\n`
          );
        }).join('\n');

    const userPrompt = 
      `User Question: "${query}"\n\n` +
      `Retrieved Multimodal Knowledge Chunks:\n${formattedContext}\n\n` +
      `Instructions:\n` +
      `1. Synthesize an accurate, comprehensive answer directly answering the user question based ONLY on the chunks above.\n` +
      `2. Insert citations formatted as [1], [2] throughout your answer whenever you state a fact derived from a chunk.\n` +
      `3. In the 'citations' array, include every cited chunk with: citation_id (e.g. "1"), source_file_name, location (timestamp or page), and snippet (exact quote).\n` +
      `4. If the context does not contain enough information to answer the question, clearly state that in the answer.`;

    const jsonSchema = {
      type: "object",
      properties: {
        answer: { 
          type: "string", 
          description: "The synthesized answer using markdown and inline citations like [1], [2]." 
        },
        citations: {
          type: "array",
          items: {
            type: "object",
            properties: {
              citation_id: { type: "string" },
              source_file_name: { type: "string" },
              location: { type: "string", description: "Timestamp (e.g., 0:15-0:30) or Page Number" },
              snippet: { type: "string", description: "A brief quote of the exact source text used" }
            },
            required: ["citation_id", "source_file_name", "location", "snippet"]
          }
        }
      },
      required: ["answer", "citations"]
    };

    try {
      console.log(`🤖 Generating RAG synthesis for "${query}" with Gemini 2.5 Pro...`);

      const response = await client.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }],
          },
        ],
        config: {
          systemInstruction: baseSystemPrompt,
          responseMimeType: 'application/json',
          responseSchema: jsonSchema as any,
        },
      });

      const rawJson = response.text?.trim() || '{}';
      const parsed = JSON.parse(rawJson);
      const validated = RagSynthesisResponseSchema.parse(parsed);

      return validated;
    } catch (error: any) {
      console.error('❌ RAG synthesis error:', error.message);
      // Fallback parser if JSON mode was wrapped
      try {
        const text = error.response?.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return RagSynthesisResponseSchema.parse(parsed);
        }
      } catch (innerError) {
        // ignore fallback error
      }
      throw error;
    }
  }
}

export const genaiService = new GenAIService();
