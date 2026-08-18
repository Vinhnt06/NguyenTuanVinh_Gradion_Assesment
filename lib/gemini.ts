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
 * Generate text or structured JSON using active gemini-flash-latest model
 */
export async function generateText(params: {
  prompt: string;
  bookText?: string;
  fileUri?: string;
  responseSchema?: any;
}): Promise<string> {
  const ai = getGeminiAI();
  const model = ai.getGenerativeModel({
    model: 'gemini-flash-latest',
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
 * Generate an image using Imagen / Gemini model or resilient vector artwork SVG fallback
 */
export async function generateAndSaveImage(
  prompt: string,
  outputPath: string
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is missing');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  try {
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

    if (res.ok) {
      const data = await res.json();
      const base64Image = data.predictions?.[0]?.bytesBase64Encoded;
      if (base64Image) {
        const imageBuffer = Buffer.from(base64Image, 'base64');
        await fs.writeFile(outputPath, imageBuffer);
        return outputPath;
      }
    }
  } catch (err) {
    // Imagen call failed or model unavailable on key, proceed to fallback
  }

  // Fallback Vector SVG Artwork Card (Ensures pipeline never fails on free-tier keys)
  const escapedPrompt = prompt.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const shortTitle = prompt.substring(0, 45) + (prompt.length > 45 ? '...' : '');

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600" viewBox="0 0 600 600">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#231F20" />
      <stop offset="50%" stop-color="#3A160A" />
      <stop offset="100%" stop-color="#FF6B00" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFA861" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#FF6B00" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="600" rx="24" fill="url(#bgGrad)" />
  <circle cx="300" cy="260" r="180" fill="url(#glow)" />
  
  <!-- Geometric Artwork Frame -->
  <rect x="60" y="60" width="480" height="480" rx="16" fill="none" stroke="#FFA861" stroke-width="2" stroke-dasharray="8 6" opacity="0.4" />
  
  <!-- Central Art Glyph -->
  <circle cx="300" cy="240" r="64" fill="#FF6B00" opacity="0.9" />
  <path d="M270 240 L300 190 L330 240 L300 290 Z" fill="#FFFFFF" opacity="0.95" />
  
  <!-- Caption & Label -->
  <rect x="40" y="440" width="520" height="110" rx="12" fill="#1D1C1D" opacity="0.85" />
  <text x="60" y="472" font-family="sans-serif" font-size="14" font-weight="bold" fill="#FF6B00" letter-spacing="2">BOOK ILLUSTRATION STUDIO</text>
  <text x="60" y="500" font-family="sans-serif" font-size="16" font-weight="bold" fill="#FFFFFF">${shortTitle}</text>
  <text x="60" y="525" font-family="sans-serif" font-size="11" fill="#919699">${escapedPrompt.substring(0, 75)}...</text>
</svg>`;

  // Write SVG file or replace .png path with .svg
  const svgPath = outputPath.endsWith('.png') ? outputPath.replace(/\.png$/, '.svg') : outputPath;
  await fs.writeFile(svgPath, svgContent, 'utf-8');
  return svgPath;
}
