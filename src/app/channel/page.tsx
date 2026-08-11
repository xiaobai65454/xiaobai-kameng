'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, CheckSquare, Clock, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Stats {
  totalOrders: number;
  pendingAudit: number;
  approved: number;
  rejected: number;
}

export default function ChannelDashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalOrders: 0,
    pendingAudit: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/orders?channel_audit=true');
      if (res.ok) {
        const data = await res.json();
        const orders = data.orders || [];
        setStats({
          totalOrders: orders.length,
          pendingAudit: orders.filter((o: any) => o.status === 'pending_audit').length,
          approved: orders.filter((o: any) => o.channel_status === 'approved').length,
          rejected: orders.filter((o: any) => o.channel_status === 'rejected').length,
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">工作台</h1>
        <p className="text-gray-500">欢迎回来，{profile?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总订单数</CardTitle>
            <ClipboardList className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待审核</CardTitle>
            <Clock className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.pendingAudit}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已通过</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已驳回</CardTitle>
            <CheckSquare className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>快捷操作</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <a
            href="/channel/orders"
            className="flex items-center rounded-lg border p-4 hover:bg-gray-50 transition-colors"
          >
            <ClipboardList className="mr-3 h-8 w-8 text-purple-600" />
            <div>
              <div className="font-medium">订单管理</div>
              <div className="text-sm text-gray-500">查看所有订单</div>
            </div>
          </a>
          <a
            href="/channel/audit"
            className="flex items-center rounded-lg border p-4 hover:bg-gray-50 transition-colors"
          >
            <CheckSquare className="mr-3 h-8 w-8 text-orange-600" />
            <div>
              <div className="font-medium">订单审核</div>
              <div className="text-sm text-gray-500">审核号卡办理状态</div>
            </div>
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
