import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET /api/messages/unread-count - 未读消息数
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('x-session');
    if (!token) return NextResponse.json({ count: 0 });

    const client = getSupabaseClient();
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ count: 0 });

    const { count, error } = await client
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    if (error) throw new Error(error.message);

    return NextResponse.json({ count: count || 0 });
  } catch (error) {
    console.error('Get unread count error:', error);
    return NextResponse.json({ count: 0 });
  }
}
