import fs from 'fs/promises';
import path from 'path';

export type StepState = 'pending' | 'running' | 'done' | 'failed';

export interface CharacterItem {
  name: string;
  prompt: string;
  imagePath?: string;
}

export interface ChapterItem {
  name: string;
  prompt: string;
  illustrationPath?: string;
}

export interface ProjectState {
  id: string;
  userId: string;
  title: string;
  bookFileUri?: string;
  bookText: string;
  createdAt: string;
  status: 'draft' | 'in_progress' | 'done';
  currentStep: number;
  stepStates: Record<number, StepState>;
  stepStartedAt: string | null;
  stepError: string | null;
  stepResults: {
    0?: { style: string } | null;
    1?: { characters: CharacterItem[] } | null;
    2?: { portraits: CharacterItem[] } | null;
    3?: { chapters: ChapterItem[] } | null;
    4?: { illustrations: ChapterItem[] } | null;
  };
}

const STORAGE_BASE = process.env.STORAGE_PATH || './storage';

// Per-project in-memory write mutex to prevent race conditions within the process
const projectLocks = new Map<string, Promise<void>>();

async function withLock<T>(projectId: string, fn: () => Promise<T>): Promise<T> {
  const currentLock = projectLocks.get(projectId) || Promise.resolve();
  let release: () => void;
  const nextLock = new Promise<void>((resolve) => {
    release = resolve;
  });
  
  // Chain the lock
  projectLocks.set(projectId, currentLock.then(() => nextLock));

  try {
    await currentLock;
    return await fn();
  } finally {
    release!();
    if (projectLocks.get(projectId) === nextLock) {
      projectLocks.delete(projectId);
    }
  }
}

export function getProjectDir(userId: string, projectId: string): string {
  return path.resolve(STORAGE_BASE, 'users', userId, 'projects', projectId);
}

export function getUserDir(userId: string): string {
  return path.resolve(STORAGE_BASE, 'users', userId, 'projects');
}

export async function ensureProjectDir(userId: string, projectId: string): Promise<string> {
  const dir = getProjectDir(userId, projectId);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

export async function readProjectState(userId: string, projectId: string): Promise<ProjectState | null> {
  const filePath = path.join(getProjectDir(userId, projectId), 'state.json');
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data) as ProjectState;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function writeProjectState(userId: string, projectId: string, state: ProjectState): Promise<void> {
  return withLock(projectId, async () => {
    const dir = await ensureProjectDir(userId, projectId);
    const filePath = path.join(dir, 'state.json');
    const tempPath = path.join(dir, `state.tmp.${Date.now()}`);

    const content = JSON.stringify(state, null, 2);
    await fs.writeFile(tempPath, content, 'utf-8');
    await fs.rename(tempPath, filePath);
  });
}

export async function deleteProjectDir(userId: string, projectId: string): Promise<boolean> {
  const dir = getProjectDir(userId, projectId);
  try {
    await fs.rm(dir, { recursive: true, force: true });
    return true;
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

export async function listUserProjects(userId: string): Promise<ProjectState[]> {
  const userProjectsDir = getUserDir(userId);
  try {
    const entries = await fs.readdir(userProjectsDir, { withFileTypes: true });
    const projects: ProjectState[] = [];

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const state = await readProjectState(userId, entry.name);
        if (state) {
          projects.push(state);
        }
      }
    }

    // Sort newest first
    return projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

export function createInitialState(params: {
  id: string;
  userId: string;
  title: string;
  bookText: string;
  bookFileUri?: string;
}): ProjectState {
  return {
    id: params.id,
    userId: params.userId,
    title: params.title,
    bookText: params.bookText,
    bookFileUri: params.bookFileUri,
    createdAt: new Date().toISOString(),
    status: 'draft',
    currentStep: 0,
    stepStates: {
      0: 'pending',
      1: 'pending',
      2: 'pending',
      3: 'pending',
      4: 'pending',
    },
    stepStartedAt: null,
    stepError: null,
    stepResults: {},
  };
}
