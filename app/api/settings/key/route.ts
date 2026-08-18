import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * GET /api/settings/key
 * Returns current API Key configuration status and masked key
 */
export async function GET() {
  const cookieStore = cookies();
  const sessionKey = cookieStore.get('gemini_api_key')?.value;
  const envKey = process.env.GEMINI_API_KEY;

  const activeKey = sessionKey || envKey || '';
  const isConfigured = activeKey.length > 5;

  let maskedKey = '';
  if (isConfigured) {
    maskedKey = activeKey.substring(0, 6) + '...' + activeKey.substring(activeKey.length - 4);
  }

  return NextResponse.json({
    isConfigured,
    source: sessionKey ? 'ui_session' : envKey ? 'env_file' : 'none',
    maskedKey,
  });
}

/**
 * POST /api/settings/key
 * Validates evaluator's submitted API Key against Google Gemini API and saves to session cookie
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { apiKey } = body;

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 10) {
      return NextResponse.json(
        { error: 'Please provide a valid Gemini API Key string' },
        { status: 400 }
      );
    }

    const cleanKey = apiKey.trim();

    // Validate key against Google Gemini API
    const ai = new GoogleGenerativeAI(cleanKey);
    const model = ai.getGenerativeModel({ model: 'gemini-3.5-flash-lite' });

    try {
      const res = await model.generateContent('Ping');
      await res.response;
    } catch (err: any) {
      return NextResponse.json(
        {
          error: `Invalid Gemini API Key: ${
            err.message?.includes('API_KEY_INVALID') || err.message?.includes('400')
              ? 'Google returned API_KEY_INVALID. Please check your key on Google AI Studio.'
              : err.message
          }`,
        },
        { status: 400 }
      );
    }

    // Key is valid! Save to HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      message: 'Gemini API Key validated and connected successfully!',
      maskedKey: cleanKey.substring(0, 6) + '...' + cleanKey.substring(cleanKey.length - 4),
    });

    response.cookies.set('gemini_api_key', cleanKey, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save API key' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/settings/key
 * Clears custom session API Key
 */
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Custom API Key cleared' });
  response.cookies.delete('gemini_api_key');
  return response;
}
