import { NextRequest, NextResponse } from 'next/server';
import { authenticate, clampPagination } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get('parent_id');
    const { page, pageSize } = clampPagination(searchParams.get('page'), searchParams.get('pageSize'));

    const isAdmin = user?.role === 'admin';

    // If no parentId specified, return the current user's direct downline
    const targetParentId = parentId || (isAdmin ? null : user!.id);

    if (!targetParentId && !isAdmin) {
      return NextResponse.json({ tree: [] });
    }

    if (targetParentId) {
      // Fetch only direct children of the specified parent (paginated)
      // instead of loading ALL agents into memory
      const { data: children, error: childrenError } = await client
        .from('profiles')
        .select('id, name, email, parent_id, level_id, total_sales, total_orders, team_count, created_at')
        .eq('role', 'agent')
        .eq('parent_id', targetParentId)
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (childrenError) throw new Error(childrenError.message);

      // Also get the parent node info
      const { data: parentNode } = await client
        .from('profiles')
        .select('id, name, email, parent_id, level_id, total_sales, total_orders, team_count, created_at')
        .eq('id', targetParentId)
        .maybeSingle();

      // Count total children for pagination
      const { count } = await client
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'agent')
        .eq('parent_id', targetParentId);

      return NextResponse.json({
        tree: parentNode ? [{ ...parentNode, children: children || [] }] : (children || []),
        total: count,
        page,
        pageSize,
      });
    }

    // Admin requesting full root list
    const { data: roots, error: rootsError } = await client
      .from('profiles')
      .select('id, name, email, parent_id, level_id, total_sales, total_orders, team_count, created_at')
      .eq('role', 'agent')
      .is('parent_id', null)
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (rootsError) throw new Error(rootsError.message);

    return NextResponse.json({ tree: roots || [], page, pageSize });
  } catch (error) {
    console.error('Get team tree error:', error);
    return NextResponse.json({ error: '获取团队树失败' }, { status: 500 });
  }
}
