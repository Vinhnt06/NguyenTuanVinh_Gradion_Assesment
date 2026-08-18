import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

const apiKey = process.env.GEMINI_API_KEY || '';

export function getGeminiAI() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY environment variable is missing');
  }
  return new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

/**
 * Upload text file via Gemini REST Files API to obtain durable fileUri
 */
export async function uploadBookTextFile(
  bookText: string,
  localFilePath: string
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not configured');

  // Save book.txt locally first
  await fs.mkdir(path.dirname(localFilePath), { recursive: true });
  await fs.writeFile(localFilePath, bookText, 'utf-8');

  // Upload to Gemini Files API via REST
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${key}`;
  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'X-Goog-Upload-Command': 'start, upload, finalize',
      'X-Goog-Upload-Header-Content-Length': Buffer.byteLength(bookText).toString(),
      'X-Goog-Upload-Header-Content-Type': 'text/plain',
      'Content-Type': 'text/plain',
    },
    body: bookText,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Files API upload failed (${response.status}): ${errText}`);
  }

  const result = await response.json();
  const fileUri = result.file?.uri;
  if (!fileUri) {
    throw new Error('Files API upload did not return a file URI');
  }

  return fileUri;
}

/**
 * Generate text or structured JSON using gemini-2.0-flash
 */
export async function generateText(params: {
  prompt: string;
  bookText?: string;
  fileUri?: string;
  responseSchema?: any;
}): Promise<string> {
  const ai = getGeminiAI();
  const model = ai.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: params.responseSchema
      ? {
          responseMimeType: 'application/json',
          responseSchema: params.responseSchema,
        }
      : undefined,
  });

  const parts: any[] = [];

  if (params.fileUri) {
    parts.push({
      fileData: {
        fileUri: params.fileUri,
        mimeType: 'text/plain',
      },
    });
  } else if (params.bookText) {
    parts.push({ text: `Book content:\n${params.bookText}\n\n` });
  }

  parts.push({ text: params.prompt });

  const result = await model.generateContent(parts);
  const response = await result.response;
  return response.text();
}

/**
 * Generate an image using Imagen / Gemini model and save to disk
 */
export async function generateAndSaveImage(
  prompt: string,
  outputPath: string
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is missing');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // REST API call for Imagen image generation
  const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${key}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      instances: [{ prompt }],
      parameters: { sampleCount: 1, aspectRatio: '1:1' },
    }),
  });

  if (!res.ok) {
    const errorBody = await res.text();
    // Fallback if imagen model is rate limited or unavailable on key: return mock/placeholder or throw clear error
    throw new Error(`Gemini Image API error (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

  if (!base64Image) {
    throw new Error('Image API response did not contain base64 bytes');
  }

  const imageBuffer = Buffer.from(base64Image, 'base64');
  await fs.writeFile(outputPath, imageBuffer);

  return outputPath;
}
