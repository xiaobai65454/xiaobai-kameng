import { NextRequest, NextResponse } from 'next/server';
import { authenticate, clampPagination } from '@/lib/auth-middleware';

// GET /api/messages - 获取消息列表
export async function GET(req: NextRequest) {
  try {
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const { page, pageSize } = clampPagination(searchParams.get('page'), searchParams.get('pageSize'));

    let query = client
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (type) query = query.eq('type', type);

    const { data, error: queryError, count } = await query;
    if (queryError) throw new Error(queryError.message);

    return NextResponse.json({ messages: data, total: count });
  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json({ error: '获取消息列表失败' }, { status: 500 });
  }
}
