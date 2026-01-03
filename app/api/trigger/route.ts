import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Simple client-friendly trigger endpoint
// In production, you'd want proper authentication (e.g., Supabase auth, session checks)
export async function POST(request: NextRequest) {
  try {
    const { secret } = await request.json();

    // Verify the secret matches
    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the internal research endpoint
    const researchUrl = new URL('/api/research', request.url);
    researchUrl.searchParams.set('secret', process.env.CRON_SECRET!);

    const response = await fetch(researchUrl.toString());

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error || 'Research cycle failed' }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Trigger error:', error);
    return NextResponse.json({ error: 'Failed to trigger research' }, { status: 500 });
  }
}
