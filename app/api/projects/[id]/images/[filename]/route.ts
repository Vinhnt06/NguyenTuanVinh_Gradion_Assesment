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
  
  let targetPath = path.join(projectDir, safeFilename);

  // Check if file exists; if requested .png doesn't exist, check for .svg fallback on disk
  try {
    await fs.access(targetPath);
  } catch {
    const svgPath = targetPath.replace(/\.png$/, '.svg');
    try {
      await fs.access(svgPath);
      targetPath = svgPath;
    } catch {
      // Keep targetPath for 404 handler below
    }
  }

  try {
    const fileBuffer = await fs.readFile(targetPath);
    const ext = path.extname(targetPath).toLowerCase();
    let contentType = 'image/png';
    if (ext === '.svg') {
      contentType = 'image/svg+xml';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    }

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: 'Image not found' }, { status: 404 });
  }
}
