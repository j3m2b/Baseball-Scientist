import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * GET /api/patterns
 * Fetches all detected patterns, ordered by confidence (highest first)
 */
export async function GET() {
  const supabase = supabaseServer;

  const { data: patterns, error } = await supabase
    .from('detected_patterns')
    .select('*')
    .order('confidence', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    patterns: patterns || [],
    count: patterns?.length || 0
  });
}
