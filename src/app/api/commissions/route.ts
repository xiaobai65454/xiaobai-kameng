import { NextRequest, NextResponse } from 'next/server';
import { authenticate, clampPagination } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const isAdmin = user?.role === 'admin';
    const { searchParams } = new URL(req.url);
    const { page, pageSize } = clampPagination(searchParams.get('page'), searchParams.get('pageSize'));

    let query = client
      .from('commissions')
      .select('*, orders(order_no), profiles(name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    // Non-admin users can only see their own commissions
    if (!isAdmin && user) {
      query = query.eq('agent_id', user.id);
    }

    const { data, error: queryError, count } = await query;
    if (queryError) throw new Error(queryError.message);

    return NextResponse.json({ commissions: data, total: count });
  } catch (error) {
    console.error('Get commissions error:', error);
    return NextResponse.json({ error: '获取佣金记录失败' }, { status: 500 });
  }
}
