import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth-middleware';

export async function GET(req: NextRequest) {
  try {
    const { user, client, error } = await authenticate(req);
    if (error) return error;

    const isAdmin = user?.role === 'admin';

    if (isAdmin) {
      // Admin dashboard: global stats
      const [
        { count: totalAgents },
        { count: totalOrders },
        { data: recentOrders },
        { data: topAgents },
        { data: orderTrend },
      ] = await Promise.all([
        client.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'agent'),
        client.from('orders').select('*', { count: 'exact', head: true }),
        client.from('orders').select('*, profiles(name)').order('created_at', { ascending: false }).limit(5),
        client.from('profiles').select('id, name, total_sales, total_orders, team_count').eq('role', 'agent').order('total_sales', { ascending: false }).limit(10),
        client.from('orders').select('commission_amount, created_at').order('created_at', { ascending: true }),
      ]);

      return NextResponse.json({
        stats: {
          totalAgents: totalAgents || 0,
          totalOrders: totalOrders || 0,
          recentOrders: recentOrders || [],
          topAgents: topAgents || [],
          orderTrend: orderTrend || [],
        },
      });
    } else {
      // Agent dashboard: own stats
      const [
        { data: agentProfile },
        { count: myOrders },
        { data: recentCommissions },
        { data: teamMembers },
        { data: myOrdersList },
      ] = await Promise.all([
        client.from('profiles').select('*, agent_levels(name, commission_rate)').eq('id', user!.id).maybeSingle(),
        client.from('orders').select('*', { count: 'exact', head: true }).eq('agent_id', user!.id),
        client.from('commissions').select('*, orders(order_no)').eq('agent_id', user!.id).order('created_at', { ascending: false }).limit(10),
        client.from('profiles').select('id, name, email, total_orders, created_at').eq('parent_id', user!.id).order('created_at', { ascending: false }).limit(10),
        client.from('orders').select('*, products(name)').eq('agent_id', user!.id).order('created_at', { ascending: false }).limit(10),
      ]);

      return NextResponse.json({
        stats: {
          profile: agentProfile,
          myOrders: myOrders || 0,
          recentCommissions: recentCommissions || [],
          teamMembers: teamMembers || [],
          myOrdersList: myOrdersList || [],
        },
      });
    }
  } catch (error) {
    console.error('Dashboard error:', error);
    return NextResponse.json({ error: '获取看板数据失败' }, { status: 500 });
  }
}
