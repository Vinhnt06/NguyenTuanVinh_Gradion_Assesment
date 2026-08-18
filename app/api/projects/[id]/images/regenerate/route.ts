import { NextResponse } from 'next/server';
import path from 'path';
import { getSessionFromCookies } from '@/lib/auth';
import { readProjectState, writeProjectState, getProjectDir } from '@/lib/storage';
import { generateAndSaveImage } from '@/lib/gemini';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { type, index } = body; // type: 'character' | 'illustration', index: number

    const state = await readProjectState(session.userId, params.id);
    if (!state) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectDir = getProjectDir(session.userId, params.id);
    const style = state.stepResults[0]?.style || 'Classic watercolor';

    if (type === 'character') {
      const chars = state.stepResults[2]?.portraits || state.stepResults[1]?.characters || [];
      if (!chars[index]) {
        return NextResponse.json({ error: 'Character not found' }, { status: 404 });
      }

      const char = chars[index];
      const fullPrompt = `${char.prompt}. Art style: ${style}. Character portrait, high quality.`;
      const imageFileName = `portrait-${index}.jpg`;
      const imagePath = path.join(projectDir, imageFileName);

      const savedPath = await generateAndSaveImage(fullPrompt, imagePath, '3:4');
      const savedFileName = path.basename(savedPath);
      const relativePath = `/api/projects/${params.id}/images/${savedFileName}?t=${Date.now()}`;

      if (!state.stepResults[2]) {
        state.stepResults[2] = { portraits: [] };
      }
      if (!state.stepResults[2].portraits) {
        state.stepResults[2].portraits = [];
      }

      state.stepResults[2].portraits[index] = { ...char, imagePath: relativePath };
      await writeProjectState(session.userId, params.id, state);

      return NextResponse.json({ success: true, project: state, imagePath: relativePath });
    } else if (type === 'illustration') {
      const chapters = state.stepResults[4]?.illustrations || state.stepResults[3]?.chapters || [];
      if (!chapters[index]) {
        return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
      }

      const chap = chapters[index];
      const fullPrompt = `${chap.prompt}. Art style: ${style}. Detailed book scene illustration.`;
      const imageFileName = `illustration-${index}.jpg`;
      const imagePath = path.join(projectDir, imageFileName);

      const savedPath = await generateAndSaveImage(fullPrompt, imagePath, '16:9');
      const savedFileName = path.basename(savedPath);
      const relativePath = `/api/projects/${params.id}/images/${savedFileName}?t=${Date.now()}`;

      if (!state.stepResults[4]) {
        state.stepResults[4] = { illustrations: [] };
      }
      if (!state.stepResults[4].illustrations) {
        state.stepResults[4].illustrations = [];
      }

      state.stepResults[4].illustrations[index] = { ...chap, illustrationPath: relativePath };
      await writeProjectState(session.userId, params.id, state);

      return NextResponse.json({ success: true, project: state, illustrationPath: relativePath });
    }

    return NextResponse.json({ error: 'Invalid item type' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Regeneration failed' }, { status: 500 });
  }
}
