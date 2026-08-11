import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// PUT /api/messages/[id]/read - 标记已读
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = req.headers.get('x-session');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const client = getSupabaseClient();
    const { data: { user }, error: authError } = await client.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 });

    const { error } = await client
      .from('messages')
      .update({ is_read: true })
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Mark message read error:', error);
    return NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 });
  }
}
