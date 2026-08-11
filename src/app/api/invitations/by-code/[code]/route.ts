import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    
    // 使用服务角色查询，无需认证
    const supabaseUrl = process.env.COZE_SUPABASE_URL;
    const serviceKey = process.env.COZE_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, serviceKey);

    // 查找最新的邀请记录（按邀请码）
    const { data: invitation, error } = await supabase
      .from('invitations')
      .select(`
        *,
        inviter_profile:inviter_id(id, name, email),
        agent_levels:level_id(id, name, level)
      `)
      .eq('invite_code', code)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    return NextResponse.json({
      invitation: {
        id: invitation.id,
        inviter_id: invitation.inviter_id,
        invite_code: invitation.invite_code,
        level_id: invitation.level_id,
        note: invitation.note,
        inviter_profile: invitation.inviter_profile,
        agent_levels: invitation.agent_levels,
      },
    });
  } catch (error) {
    console.error('Get invitation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
