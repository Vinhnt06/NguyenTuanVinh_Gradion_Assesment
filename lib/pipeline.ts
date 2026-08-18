import path from 'path';
import { SchemaType } from '@google/generative-ai';
import {
  ProjectState,
  readProjectState,
  writeProjectState,
  getProjectDir,
  CharacterItem,
  ChapterItem,
} from './storage';
import { generateText, generateAndSaveImage, uploadBookTextFile } from './gemini';

export interface RunStepResult {
  success: boolean;
  state: ProjectState;
  error?: string;
  statusCode?: number;
}

/**
 * Ensures bookFileUri exists in state.json; uploads to Files API if missing
 */
export async function ensureBookFileUri(
  userId: string,
  project: ProjectState
): Promise<string | undefined> {
  if (project.bookFileUri) return project.bookFileUri;

  try {
    const projectDir = getProjectDir(userId, project.id);
    const localBookPath = path.join(projectDir, 'book.txt');
    const fileUri = await uploadBookTextFile(project.bookText, localBookPath);

    project.bookFileUri = fileUri;
    await writeProjectState(userId, project.id, project);
    return fileUri;
  } catch (err: any) {
    console.warn('Files API upload skipped/failed, falling back to raw text:', err.message);
    return undefined;
  }
}

export async function executePipelineStep(
  userId: string,
  projectId: string,
  stepNumber: number,
  userSuppliedStyle?: string
): Promise<RunStepResult> {
  const state = await readProjectState(userId, projectId);
  if (!state) {
    return { success: false, state: {} as any, error: 'Project not found', statusCode: 404 };
  }

  // 1. Validate step order: step N can only run if step N-1 is 'done' (for N > 0)
  if (stepNumber > 0 && state.stepStates[stepNumber - 1] !== 'done') {
    return {
      success: false,
      state,
      error: `Step ${stepNumber} cannot run before Step ${stepNumber - 1} is completed`,
      statusCode: 400,
    };
  }

  // 2. DUPLICATE CALL GUARD: 409 Conflict if step is already running
  if (state.stepStates[stepNumber] === 'running') {
    return {
      success: false,
      state,
      error: `Step ${stepNumber} is currently running. Duplicate call blocked.`,
      statusCode: 409,
    };
  }

  // 3. Mark step as 'running' immediately & persist to disk before calling Gemini
  state.stepStates[stepNumber] = 'running';
  state.stepStartedAt = new Date().toISOString();
  state.stepError = null;
  state.status = 'in_progress';
  await writeProjectState(userId, projectId, state);

  try {
    const fileUri = await ensureBookFileUri(userId, state);
    const projectDir = getProjectDir(userId, projectId);

    switch (stepNumber) {
      // ----------------------------------------------------
      // STEP 0: STYLE
      // ----------------------------------------------------
      case 0: {
        let styleResult: string;
        if (userSuppliedStyle && userSuppliedStyle.trim().length > 0) {
          styleResult = userSuppliedStyle.trim();
        } else {
          styleResult = await generateText({
            fileUri,
            bookText: state.bookText,
            prompt:
              'Describe an evocative, visually striking art style for illustrating this book in 2-3 sentences. Mention color palette, texture, and mood.',
          });
        }

        state.stepResults[0] = { style: styleResult.trim() };
        break;
      }

      // ----------------------------------------------------
      // STEP 1: CHARACTERS (HARD CAP: MAX 2 ADULTS)
      // ----------------------------------------------------
      case 1: {
        const style = state.stepResults[0]?.style || 'Classic watercolor';
        const characterSchema = {
          type: SchemaType.ARRAY,
          description: 'List of main adult characters (maximum 2)',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: 'Character name' },
              prompt: {
                type: SchemaType.STRING,
                description: 'Detailed visual prompt description of character Appearance for image generation',
              },
            },
            required: ['name', 'prompt'],
          },
        };

        const jsonRaw = await generateText({
          fileUri,
          bookText: state.bookText,
          prompt: `Based on this book, extract the main ADULT characters. For each character, write a detailed image generation prompt incorporating the art style "${style}".`,
          responseSchema: characterSchema,
        });

        let characters: CharacterItem[] = [];
        try {
          characters = JSON.parse(jsonRaw);
        } catch {
          characters = [
            { name: 'Protagonist', prompt: `Main character in style: ${style}` },
            { name: 'Companion', prompt: `Supporting character in style: ${style}` },
          ];
        }

        // SERVER-SIDE HARD CAP ENFORCEMENT: Max 2 characters
        const cappedCharacters = characters.slice(0, 2);
        state.stepResults[1] = { characters: cappedCharacters };
        break;
      }

      // ----------------------------------------------------
      // STEP 2: PORTRAITS (1 per character, max 2)
      // ----------------------------------------------------
      case 2: {
        const chars = state.stepResults[1]?.characters || [];
        const style = state.stepResults[0]?.style || '';
        const portraits: CharacterItem[] = [];

        for (let i = 0; i < chars.length; i++) {
          if (i > 0) {
            await new Promise((r) => setTimeout(r, 3500));
          }
          const char = chars[i];
          const fullPrompt = `${char.prompt}. Art style: ${style}. Character portrait, high quality.`;
          const imageFileName = `portrait-${i}.png`;
          const imagePath = path.join(projectDir, imageFileName);
          const relativePath = `/api/projects/${projectId}/images/${imageFileName}`;

          try {
            let savedPath = await generateAndSaveImage(fullPrompt, imagePath, '3:4', i);
            // If image generation returned an SVG fallback, auto-retry once after 3s recovery pause
            if (savedPath.endsWith('.svg')) {
              await new Promise((r) => setTimeout(r, 3000));
              savedPath = await generateAndSaveImage(fullPrompt, imagePath, '3:4', i + 1);
            }
            const savedFileName = path.basename(savedPath);
            const relativePath = `/api/projects/${projectId}/images/${savedFileName}`;
            portraits.push({ ...char, imagePath: relativePath });
          } catch (err: any) {
            console.warn(`Portrait generation failed for ${char.name}, creating fallback:`, err.message);
            portraits.push({ ...char, imagePath: relativePath });
          }
        }

        state.stepResults[2] = { portraits };
        break;
      }

      // ----------------------------------------------------
      // STEP 3: CHAPTERS (HARD CAP: MAX 1 CHAPTER)
      // ----------------------------------------------------
      case 3: {
        const style = state.stepResults[0]?.style || '';
        const chars = state.stepResults[1]?.characters || [];
        const charNames = chars.map((c) => c.name).join(', ');

        const chapterSchema = {
          type: SchemaType.ARRAY,
          description: 'List of chapter illustration prompts (maximum 1)',
          items: {
            type: SchemaType.OBJECT,
            properties: {
              name: { type: SchemaType.STRING, description: 'Chapter title' },
              prompt: {
                type: SchemaType.STRING,
                description: 'Scene description prompt referencing characters and art style',
              },
            },
            required: ['name', 'prompt'],
          },
        };

        const jsonRaw = await generateText({
          fileUri,
          bookText: state.bookText,
          prompt: `Create 1 key chapter illustration prompt for this book, featuring characters (${charNames}) in the art style "${style}".`,
          responseSchema: chapterSchema,
        });

        let chapters: ChapterItem[] = [];
        try {
          chapters = JSON.parse(jsonRaw);
        } catch {
          chapters = [
            {
              name: 'Chapter 1: The Journey Begins',
              prompt: `Key scene illustration featuring ${charNames} in style: ${style}`,
            },
          ];
        }

        // SERVER-SIDE HARD CAP ENFORCEMENT: Max 1 chapter
        const cappedChapters = chapters.slice(0, 1);
        state.stepResults[3] = { chapters: cappedChapters };
        break;
      }

      // ----------------------------------------------------
      // STEP 4: ILLUSTRATIONS (1 scene illustration)
      // ----------------------------------------------------
      case 4: {
        const chapters = state.stepResults[3]?.chapters || [];
        const style = state.stepResults[0]?.style || '';
        const illustrations: ChapterItem[] = [];

        for (let i = 0; i < chapters.length; i++) {
          if (i > 0) {
            await new Promise((r) => setTimeout(r, 2000));
          }
          const chap = chapters[i];
          const fullPrompt = `${chap.prompt}. Art style: ${style}. Detailed book scene illustration.`;
          const imageFileName = `illustration-${i}.png`;
          const imagePath = path.join(projectDir, imageFileName);

          try {
            let savedPath = await generateAndSaveImage(fullPrompt, imagePath, '16:9', i);
            if (savedPath.endsWith('.svg')) {
              await new Promise((r) => setTimeout(r, 3000));
              savedPath = await generateAndSaveImage(fullPrompt, imagePath, '16:9', i + 1);
            }
            const savedFileName = path.basename(savedPath);
            const relativePath = `/api/projects/${projectId}/images/${savedFileName}`;
            illustrations.push({ ...chap, illustrationPath: relativePath });
          } catch (err: any) {
            console.warn(`Illustration generation failed, creating path:`, err.message);
            const relativePath = `/api/projects/${projectId}/images/${imageFileName}`;
            illustrations.push({ ...chap, illustrationPath: relativePath });
          }
        }

        state.stepResults[4] = { illustrations };
        break;
      }

      default:
        throw new Error(`Invalid step number: ${stepNumber}`);
    }

    // Mark step as 'done'
    state.stepStates[stepNumber] = 'done';
    state.currentStep = Math.max(state.currentStep, stepNumber + 1);

    // Update project overall status
    if (stepNumber === 4 && state.stepStates[4] === 'done') {
      state.status = 'done';
    } else {
      state.status = 'in_progress';
    }

    await writeProjectState(userId, projectId, state);
    return { success: true, state };
  } catch (error: any) {
    // Step failed -> leave project usable & retryable
    state.stepStates[stepNumber] = 'failed';
    state.stepError = error.message || 'Gemini API execution failed';
    await writeProjectState(userId, projectId, state);

    return {
      success: false,
      state,
      error: error.message || 'Step execution failed',
      statusCode: 500,
    };
  }
}

export async function resetStuckStep(
  userId: string,
  projectId: string,
  stepNumber: number
): Promise<RunStepResult> {
  const state = await readProjectState(userId, projectId);
  if (!state) {
    return { success: false, state: {} as any, error: 'Project not found', statusCode: 404 };
  }

  // Reset stranded step state back to 'pending'
  state.stepStates[stepNumber] = 'pending';
  state.stepStartedAt = null;
  state.stepError = null;

  await writeProjectState(userId, projectId, state);
  return { success: true, state };
}
