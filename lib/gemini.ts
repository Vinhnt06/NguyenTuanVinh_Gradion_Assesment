import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs/promises';
import path from 'path';

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
 * Implements 3x exponential retry for 503 Service Unavailable / 429 rate limit spikes
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

  // Transient Error Auto-Retry (503 High Demand / 429 Rate Limit)
  let lastError: any;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const result = await model.generateContent(parts);
      const response = await result.response;
      return response.text();
    } catch (err: any) {
      lastError = err;
      const isTransient =
        err.message?.includes('503') ||
        err.message?.includes('429') ||
        err.message?.includes('high demand') ||
        err.message?.includes('RESOURCE_EXHAUSTED');

      if (isTransient && attempt < 2) {
        console.warn(
          `Gemini API transient 503/429 error (attempt ${attempt + 1}/3). Auto retrying in 1.5s...`
        );
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }

  throw lastError;
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
        parameters: { sampleCount: 1, aspectRatio: '3:4' },
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

  // Fallback Vector SVG Artwork Card (3:4 aspect ratio, 600x800 viewBox)
  const escapedPrompt = prompt.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const shortTitle = prompt.substring(0, 40) + (prompt.length > 40 ? '...' : '');

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A1819" />
      <stop offset="45%" stop-color="#2D1910" />
      <stop offset="100%" stop-color="#FF6B00" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#FFA861" stop-opacity="0.7" />
      <stop offset="100%" stop-color="#FF6B00" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="600" height="800" rx="28" fill="url(#bgGrad)" />
  <circle cx="300" cy="320" r="220" fill="url(#glow)" />
  
  <!-- Outer Frame Line -->
  <rect x="40" y="40" width="520" height="720" rx="20" fill="none" stroke="#FFA861" stroke-width="2" stroke-dasharray="8 6" opacity="0.35" />
  
  <!-- Central Art Diamond Emblem -->
  <circle cx="300" cy="300" r="75" fill="#FF6B00" opacity="0.9" />
  <path d="M265 300 L300 240 L335 300 L300 360 Z" fill="#FFFFFF" opacity="0.95" />

  <!-- Studio Header Tag -->
  <rect x="70" y="60" width="220" height="30" rx="6" fill="#FF6B00" opacity="0.2" />
  <text x="82" y="80" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFA861" letter-spacing="1.5">STUDIO VISUAL ARTWORK</text>

  <!-- Bottom Caption Container -->
  <rect x="50" y="640" width="500" height="100" rx="16" fill="#141416" opacity="0.92" stroke="#33333E" stroke-width="1" />
  <text x="70" y="670" font-family="sans-serif" font-size="12" font-weight="bold" fill="#FF6B00" letter-spacing="1.5">BOOK ILLUSTRATION STUDIO</text>
  <text x="70" y="698" font-family="sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">${shortTitle}</text>
  <text x="70" y="722" font-family="sans-serif" font-size="11" fill="#919699">${escapedPrompt.substring(0, 65)}...</text>
</svg>`;

  // Write SVG file or replace .png path with .svg
  const svgPath = outputPath.endsWith('.png') ? outputPath.replace(/\.png$/, '.svg') : outputPath;
  await fs.writeFile(svgPath, svgContent, 'utf-8');
  return svgPath;
}
