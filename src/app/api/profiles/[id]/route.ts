import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth-middleware';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const isAdmin = user?.role === 'admin';

    // Users can only view their own profile; admins can view any
    if (!isAdmin && user!.id !== id) {
      return NextResponse.json({ error: '无权查看其他用户信息' }, { status: 403 });
    }

    const { data: profile, error: queryError } = await client
      .from('profiles')
      .select('*, agent_levels(name, level, commission_rate)')
      .eq('id', id)
      .maybeSingle();
    if (queryError) throw new Error(queryError.message);

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get profile by id error:', error);
    return NextResponse.json({ error: '获取用户信息失败' }, { status: 500 });
  }
}
