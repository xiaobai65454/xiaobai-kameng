'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, TrendingUp, Award, Package, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts';
import { useAuth } from '@/lib/auth-context';

interface DashboardData {
  stats: {
    totalAgents: number;
    totalOrders: number;
    recentOrders: Array<{
      id: string;
      order_no: string;
      total_amount: string;
      status: string;
      created_at: string;
      profiles: { name: string };
    }>;
    topAgents: Array<{
      id: string;
      name: string;
      total_sales: string;
      total_orders: number;
      team_count: number;
    }>;
    orderTrend: Array<{
      total_amount: string;
      created_at: string;
    }>;
  };
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  pending: { label: '待审核', color: 'bg-[#FA541C]/10 text-[#FA541C]' },
  approved: { label: '已开卡', color: 'bg-[#1677FF]/10 text-[#1677FF]' },
  shipped: { label: '已寄出', color: 'bg-[#722ED1]/10 text-[#722ED1]' },
  completed: { label: '已完成', color: 'bg-[#52C41A]/10 text-[#52C41A]' },
  cancelled: { label: '已取消', color: 'bg-[#F5222D]/10 text-[#F5222D]' },
};

export default function AdminDashboard() {
  const { session } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!session) return;
      try {
        const res = await fetch('/api/dashboard', {
          headers: { 'x-session': session.access_token },
        });
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1677FF]"></div>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center text-[#999]">加载失败</div>;
  }

  const { totalAgents, totalOrders, recentOrders, topAgents, orderTrend } = data.stats;

  const trendData = orderTrend.reduce((acc: Array<{ date: string; amount: number }>, item) => {
    const date = new Date(item.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing.amount += parseFloat(item.total_amount);
    } else {
      acc.push({ date, amount: parseFloat(item.total_amount) });
    }
    return acc;
  }, []).slice(-30);

  const totalSales = orderTrend.reduce((sum, item) => sum + parseFloat(item.total_amount), 0);

  const statusCounts = recentOrders.reduce((acc: Record<string, number>, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = Object.entries(statusCounts).map(([key, value]) => ({
    name: STATUS_MAP[key]?.label || key,
    value,
  }));

  const COLORS = ['#FA541C', '#1677FF', '#722ED1', '#52C41A', '#F5222D'];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[#000]">数据看板</h1>
        <p className="text-sm text-[#666] mt-1">系统运营数据概览</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#666]">代理总数</p>
                <p className="text-2xl font-bold text-[#000] mt-1">{totalAgents}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-[#52C41A]" />
                  <span className="text-xs text-[#52C41A]">+12%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#1677FF]/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#1677FF]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#666]">订单总数</p>
                <p className="text-2xl font-bold text-[#000] mt-1">{totalOrders}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-[#52C41A]" />
                  <span className="text-xs text-[#52C41A]">+8%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#52C41A]/10 flex items-center justify-center">
                <ShoppingCart className="h-5 w-5 text-[#52C41A]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#666]">总销售额</p>
                <p className="text-2xl font-bold text-[#F5222D] mt-1">¥{totalSales.toFixed(2)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowUpRight className="h-3 w-3 text-[#52C41A]" />
                  <span className="text-xs text-[#52C41A]">+15%</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#722ED1]/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-[#722ED1]" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-[#666]">在售商品</p>
                <p className="text-2xl font-bold text-[#000] mt-1">-</p>
                <div className="flex items-center gap-1 mt-1">
                  <ArrowDownRight className="h-3 w-3 text-[#666]" />
                  <span className="text-xs text-[#666]">持平</span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-lg bg-[#FA541C]/10 flex items-center justify-center">
                <Package className="h-5 w-5 text-[#FA541C]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">销售趋势</CardTitle>
          </CardHeader>
          <CardContent>
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1677FF" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1677FF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" fontSize={12} stroke="#999" />
                  <YAxis fontSize={12} stroke="#999" />
                  <Tooltip 
                    formatter={(value: number) => [`¥${value.toFixed(2)}`, '销售额']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#1677FF" strokeWidth={2} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-[#999]">暂无数据</div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">订单状态分布</CardTitle>
          </CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label>
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[280px] flex items-center justify-center text-[#999]">暂无数据</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">最近订单</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-[#999] text-center py-8">暂无订单</p>
              ) : (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-[#F0F5FF] rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-[#000]">{order.order_no}</p>
                      <p className="text-xs text-[#666]">{order.profiles?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#F5222D]">¥{parseFloat(order.total_amount).toFixed(2)}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_MAP[order.status]?.color || ''}`}>
                        {STATUS_MAP[order.status]?.label || order.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] border-0">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">代理排名</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topAgents.length === 0 ? (
                <p className="text-[#999] text-center py-8">暂无数据</p>
              ) : (
                topAgents.map((agent, index) => (
                  <div key={agent.id} className="flex items-center justify-between p-3 bg-[#F0F5FF] rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        index === 0 ? 'bg-[#FA541C] text-white' :
                        index === 1 ? 'bg-[#FA8C16] text-white' :
                        index === 2 ? 'bg-[#FAAD14] text-white' :
                        'bg-[#E5E7EB] text-[#666]'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#000]">{agent.name}</p>
                        <p className="text-xs text-[#666]">团队 {agent.team_count} 人</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-[#F5222D]">¥{parseFloat(agent.total_sales).toFixed(2)}</p>
                      <p className="text-xs text-[#666]">{agent.total_orders} 单</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
