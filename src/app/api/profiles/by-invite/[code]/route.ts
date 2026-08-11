import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const client = getSupabaseClient();

    const { data: profile, error } = await client
      .from('profiles')
      .select('id, name, invite_code')
      .eq('invite_code', code)
      .eq('is_active', true)
      .maybeSingle();
    if (error) throw new Error(error.message);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get profile by invite code error:', error);
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 });
  }
}
