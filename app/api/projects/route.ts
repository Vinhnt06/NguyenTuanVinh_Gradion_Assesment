import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { createInitialState, listUserProjects, writeProjectState } from '@/lib/storage';

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const projects = await listUserProjects(session.userId);
    return NextResponse.json({ projects });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to list projects' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, bookText } = body;

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ error: 'Project title is required' }, { status: 400 });
    }

    if (!bookText || typeof bookText !== 'string' || bookText.trim().length === 0) {
      return NextResponse.json({ error: 'Book text is required' }, { status: 400 });
    }

    const projectId = 'proj_' + Math.random().toString(36).substring(2, 10);
    const initialState = createInitialState({
      id: projectId,
      userId: session.userId,
      title: title.trim(),
      bookText: bookText.trim(),
    });

    await writeProjectState(session.userId, projectId, initialState);

    return NextResponse.json({ project: initialState }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create project' }, { status: 500 });
  }
}
