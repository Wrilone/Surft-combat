import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY is not set' }, { status: 500 });
    }

    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}` ,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
        'X-Title': 'Surft Combat',
      },
      body: JSON.stringify({
        model: body.model ?? 'openai/gpt-4o-mini',
        messages: body.messages ?? [{ role: 'user', content: 'Play Surft Combat' }],
      }),
    });

    const text = await upstream.text();

    if (!upstream.ok) {
      return NextResponse.json({ error: text }, { status: upstream.status });
    }

    return new NextResponse(text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'OpenRouter request failed' }, { status: 500 });
  }
}
