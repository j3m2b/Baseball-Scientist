import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

/**
 * POST /api/reset
 * Clears all experiment data from the database
 * CAUTION: This is destructive and cannot be undone!
 *
 * Body: { secret: string, confirm: "DELETE_ALL_DATA" }
 */
export async function POST(request: NextRequest) {
  try {
    const { secret, confirm } = await request.json();

    // Validate the secret
    if (secret !== process.env.CRON_SECRET) {
      console.error('[Reset] Unauthorized: secret does not match');
      return NextResponse.json({ error: 'Unauthorized - Invalid secret' }, { status: 401 });
    }

    // Require explicit confirmation
    if (confirm !== 'DELETE_ALL_DATA') {
      return NextResponse.json({
        error: 'Confirmation required. Send confirm: "DELETE_ALL_DATA" to proceed.'
      }, { status: 400 });
    }

    console.error('[Reset] Confirmed, deleting all experiment data...');

    const supabase = supabaseServer;

    // Delete experiments (CASCADE will delete related records)
    const { error: deleteError, count } = await supabase
      .from('experiments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all (using impossible match)

    if (deleteError) {
      console.error('[Reset] Failed to delete experiments:', deleteError);
      return NextResponse.json({
        error: 'Failed to delete data: ' + deleteError.message
      }, { status: 500 });
    }

    console.error(`[Reset] Successfully deleted all experiment data`);

    return NextResponse.json({
      success: true,
      message: 'All experiment data has been deleted',
      deletedCount: count
    });
  } catch (error) {
    console.error('[Reset] Error:', error);
    return NextResponse.json({
      error: 'Failed to reset database: ' + (error instanceof Error ? error.message : String(error))
    }, { status: 500 });
  }
}
