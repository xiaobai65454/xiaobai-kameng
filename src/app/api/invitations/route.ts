import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// GET: 获取邀请列表
export async function GET(request: Request) {
  try {
    const token = request.headers.get('x-session');
    const isAdminRequest = request.headers.get('x-admin-request') === 'true';
    
    if (!token && !isAdminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string | null = null;
    
    if (token) {
      const client = await getSupabaseClient(token);
      const { data: { user } } = await client.auth.getUser();
      userId = user?.id || null;
    }
    
    if (!userId && !isAdminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 使用服务角色客户端查询（无token时使用service role key）
    const serviceClient = getSupabaseClient();

    // 获取邀请列表
    let query = serviceClient
      .from('invitations')
      .select(`
        *,
        agent_levels (
          id,
          name,
          level
        )
      `)
      .order('created_at', { ascending: false });

    if (!isAdminRequest && userId) {
      query = query.eq('inviter_id', userId);
    }

    const { data: invitations, error } = await query;

    if (error) {
      console.error('Failed to fetch invitations:', error);
      return NextResponse.json({ error: 'Failed to fetch invitations' }, { status: 500 });
    }

    return NextResponse.json({ invitations: invitations || [] });
  } catch (error) {
    console.error('Error fetching invitations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST: 创建邀请链接
export async function POST(request: Request) {
  try {
    const token = request.headers.get('x-session');
    const isAdminRequest = request.headers.get('x-admin-request') === 'true';
    
    if (!token && !isAdminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string | null = null;
    
    if (token) {
      const client = await getSupabaseClient(token);
      const { data: { user } } = await client.auth.getUser();
      userId = user?.id || null;
    }
    
    if (!userId && !isAdminRequest) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { level_id, note, inviter_id } = body;

    // 获取当前用户信息（使用服务角色客户端）
    const serviceClient = getSupabaseClient();
    
    // 如果是管理员请求，使用传入的 inviter_id；否则使用当前用户 ID
    const targetUserId = isAdminRequest && inviter_id ? inviter_id : userId;
    
    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, name, invite_code, role')
      .eq('id', targetUserId || '')
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // 验证等级是否存在
    if (level_id) {
      const { data: level } = await serviceClient
        .from('agent_levels')
        .select('id')
        .eq('id', level_id)
        .single();

      if (!level) {
        return NextResponse.json({ error: 'Invalid level' }, { status: 400 });
      }
    }

    // 创建邀请记录
    const { data: invitation, error } = await serviceClient
      .from('invitations')
      .insert({
        inviter_id: profile.id,
        invite_code: profile.invite_code,
        level_id: level_id || null,
        note: note || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create invitation:', error);
      return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
    }

    return NextResponse.json({ invitation });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
