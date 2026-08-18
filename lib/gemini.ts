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
 * Generate text or structured JSON with automatic Gemini Model Fallback (3.7 Flash -> 3.6 Flash -> 3.5 Flash Lite)
 * Automatically recovers if one model hits the 20 RPD free tier quota limit or transient 503 error
 */
export async function generateText(params: {
  prompt: string;
  bookText?: string;
  fileUri?: string;
  responseSchema?: any;
}): Promise<string> {
  const ai = getGeminiAI();

  const candidateModels = [
    'gemini-flash-latest',
    'gemini-3.6-flash',
    'gemini-3.5-flash-lite',
  ];

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

  let lastError: any;

  for (const modelName of candidateModels) {
    try {
      const model = ai.getGenerativeModel({
        model: modelName,
        generationConfig: params.responseSchema
          ? {
              responseMimeType: 'application/json',
              responseSchema: params.responseSchema,
            }
          : undefined,
      });

      const result = await model.generateContent(parts);
      const response = await result.response;
      return response.text();
    } catch (err: any) {
      lastError = err;
      console.warn(`Gemini model ${modelName} failed or quota exceeded, switching to next candidate:`, err.message);
      // Wait 1s before trying next candidate model
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  throw lastError;
}

/**
 * Generate an image using Google Imagen / FLUX.1 / Turbo / SDXL AI Model APIs or resilient vector artwork SVG fallback
 * Supports both '3:4' (portrait character) and '16:9' (landscape chapter scene) aspect ratios
 */
export async function generateAndSaveImage(
  prompt: string,
  outputPath: string,
  aspectRatio: '3:4' | '16:9' = '3:4'
): Promise<string> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is missing');

  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  // 1. Try Google Imagen REST API endpoints first
  const imagenEndpoints = [
    'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict',
    'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-fast-generate-001:predict',
  ];

  for (const urlEndpoint of imagenEndpoints) {
    try {
      const url = `${urlEndpoint}?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1, aspectRatio },
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
      // Proceed to FLUX / Turbo / SDXL AI Engines
    }
  }

  // 2. Try FLUX.1, Turbo & SDXL AI Model Engines sequentially with 20s timeout per model
  const fluxModels = ['flux', 'turbo', 'sdxl'];
  const width = aspectRatio === '16:9' ? 960 : 600;
  const height = aspectRatio === '16:9' ? 540 : 800;

  for (const fluxModel of fluxModels) {
    try {
      const seed = Math.floor(Math.random() * 1000000);
      const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
        prompt
      )}?width=${width}&height=${height}&model=${fluxModel}&seed=${seed}&nologo=true`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s timeout per engine

      const fluxRes = await fetch(pollinationsUrl, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (fluxRes.ok) {
        const arrayBuffer = await fluxRes.arrayBuffer();
        if (arrayBuffer.byteLength > 1000) {
          const jpgPath = outputPath.endsWith('.png')
            ? outputPath.replace(/\.png$/, '.jpg')
            : outputPath;
          await fs.writeFile(jpgPath, Buffer.from(arrayBuffer));
          return jpgPath;
        }
      }
    } catch (err: any) {
      console.warn(`AI Image engine ${fluxModel} failed/timed out:`, err.message);
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  // 3. Fallback Vector SVG Artwork Card (Ensures pipeline never fails offline)
  const escapedPrompt = prompt.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const shortTitle = prompt.substring(0, 45) + (prompt.length > 45 ? '...' : '');

  let svgContent: string;

  if (aspectRatio === '16:9') {
    // Horizontal Landscape SVG Artwork (16:9 ratio - 960x540 viewBox)
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#141418" />
      <stop offset="45%" stop-color="#2B160C" />
      <stop offset="100%" stop-color="#FF6B00" />
    </linearGradient>
    <radialGradient id="glow" cx="60%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#FFA861" stop-opacity="0.6" />
      <stop offset="100%" stop-color="#FF6B00" stop-opacity="0" />
    </radialGradient>
  </defs>

  <rect width="960" height="540" rx="24" fill="url(#bgGrad)" />
  <circle cx="580" cy="270" r="240" fill="url(#glow)" />
  
  <!-- Outer Frame Line -->
  <rect x="35" y="35" width="890" height="470" rx="18" fill="none" stroke="#FFA861" stroke-width="2" stroke-dasharray="8 6" opacity="0.35" />
  
  <!-- Central Art Landscape Glyph -->
  <circle cx="580" cy="250" r="70" fill="#FF6B00" opacity="0.9" />
  <path d="M545 250 L580 190 L615 250 L580 310 Z" fill="#FFFFFF" opacity="0.95" />

  <!-- Studio Header Tag -->
  <rect x="60" y="55" width="240" height="30" rx="6" fill="#FF6B00" opacity="0.2" />
  <text x="72" y="75" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFA861" letter-spacing="1.5">CHAPTER SCENE LANDSCAPE</text>

  <!-- Bottom Caption Container -->
  <rect x="60" y="400" width="840" height="85" rx="14" fill="#141416" opacity="0.92" stroke="#33333E" stroke-width="1" />
  <text x="80" y="426" font-family="sans-serif" font-size="12" font-weight="bold" fill="#FF6B00" letter-spacing="1.5">CHAPTER SCENE ILLUSTRATION (16:9)</text>
  <text x="80" y="452" font-family="sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">${shortTitle}</text>
  <text x="80" y="474" font-family="sans-serif" font-size="11" fill="#919699">${escapedPrompt.substring(0, 95)}...</text>
</svg>`;
  } else {
    // Vertical Portrait SVG Artwork (3:4 ratio - 600x800 viewBox)
    svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
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
  <text x="82" y="80" font-family="sans-serif" font-size="11" font-weight="bold" fill="#FFA861" letter-spacing="1.5">CHARACTER PORTRAIT (3:4)</text>

  <!-- Bottom Caption Container -->
  <rect x="50" y="640" width="500" height="100" rx="16" fill="#141416" opacity="0.92" stroke="#33333E" stroke-width="1" />
  <text x="70" y="670" font-family="sans-serif" font-size="12" font-weight="bold" fill="#FF6B00" letter-spacing="1.5">BOOK ILLUSTRATION STUDIO</text>
  <text x="70" y="698" font-family="sans-serif" font-size="15" font-weight="bold" fill="#FFFFFF">${shortTitle}</text>
  <text x="70" y="722" font-family="sans-serif" font-size="11" fill="#919699">${escapedPrompt.substring(0, 65)}...</text>
</svg>`;
  }

  // Write SVG file or replace .png path with .svg
  const svgPath = outputPath.endsWith('.png') ? outputPath.replace(/\.png$/, '.svg') : outputPath;
  await fs.writeFile(svgPath, svgContent, 'utf-8');
  return svgPath;
}
