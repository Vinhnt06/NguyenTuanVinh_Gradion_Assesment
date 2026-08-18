import { NextResponse } from 'next/server';
import { getSessionFromCookies } from '@/lib/auth';
import { resetStuckStep } from '@/lib/pipeline';

export async function POST(
  request: Request,
  { params }: { params: { id: string; step: string } }
) {
  const session = await getSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const stepNumber = parseInt(params.step, 10);
  if (isNaN(stepNumber) || stepNumber < 0 || stepNumber > 4) {
    return NextResponse.json({ error: 'Invalid step number (must be 0..4)' }, { status: 400 });
  }

  const result = await resetStuckStep(session.userId, params.id, stepNumber);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error, project: result.state },
      { status: result.statusCode || 500 }
    );
  }

  return NextResponse.json({ project: result.state });
}
