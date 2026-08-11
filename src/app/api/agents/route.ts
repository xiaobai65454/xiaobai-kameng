import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, clampPagination } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const { client, error } = await requireAdmin(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const { page, pageSize } = clampPagination(searchParams.get('page'), searchParams.get('pageSize'));
    const search = searchParams.get('search');
    const parentId = searchParams.get('parent_id');

    let query = client
      .from('profiles')
      .select('*, agent_levels(name, level)', { count: 'exact' })
      .eq('role', 'agent')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }
    if (parentId) {
      query = query.eq('parent_id', parentId);
    }

    const { data, error: queryError, count } = await query;
    if (queryError) throw new Error(queryError.message);

    return NextResponse.json({ agents: data, total: count });
  } catch (error) {
    console.error('Get agents error:', error);
    return NextResponse.json({ error: '获取代理列表失败' }, { status: 500 });
  }
}
