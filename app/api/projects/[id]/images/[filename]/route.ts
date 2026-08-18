import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSessionFromCookies } from '@/lib/auth';
import { getProjectDir } from '@/lib/storage';

export async function GET(
  request: Request,
  { params }: { params: { id: string; filename: string } }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Prevent path traversal attacks
  const safeFilename = path.basename(params.filename);
  const projectDir = getProjectDir(session.userId, params.id);
  const imagePath = path.join(projectDir, safeFilename);

  try {
    const fileBuffer = await fs.readFile(imagePath);
    return new Response(fileBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}
