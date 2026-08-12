'use client';

import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ClipboardList,
  CheckSquare,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Bell,
  AlertCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

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

  const statCards = [
    {
      label: '总订单数',
      value: stats.totalOrders,
      icon: ClipboardList,
      color: 'text-[#1677FF]',
      bg: 'bg-[#E6F1FB]',
    },
    {
      label: '待审核',
      value: stats.pendingAudit,
      icon: Clock,
      color: 'text-[#854F0B]',
      bg: 'bg-[#FAEEDA]',
    },
    {
      label: '已通过',
      value: stats.approved,
      icon: CheckCircle2,
      color: 'text-[#3B6D11]',
      bg: 'bg-[#EAF3DE]',
    },
    {
      label: '已驳回',
      value: stats.rejected,
      icon: XCircle,
      color: 'text-[#A32D2D]',
      bg: 'bg-[#FCEBEB]',
    },
  ];

  const todoItems = [
    {
      icon: AlertCircle,
      text: `${stats.pendingAudit} 笔订单待审核`,
      href: '/channel/audit',
      color: 'bg-[#FAEEDA]',
      iconColor: 'text-[#854F0B]',
    },
    {
      icon: ClipboardList,
      text: '查看全部订单列表',
      href: '/channel/orders',
      color: 'bg-[#E6F1FB]',
      iconColor: 'text-[#1677FF]',
    },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#000]">工作台</h1>
        <p className="text-sm text-[#999] mt-1">欢迎回来，{profile?.name || '渠道方'}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <Card key={index} className="rounded-xl border-[#E5E7EB] shadow-none">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#999]">{card.label}</p>
                  <p className={cn('text-2xl font-bold mt-1', card.color)}>{card.value}</p>
                </div>
                <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', card.bg)}>
                  <card.icon className={cn('h-5 w-5', card.color)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quick Actions */}
        <Card className="rounded-xl border-[#E5E7EB] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">快捷操作</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link
              href="/channel/orders"
              className="flex items-center justify-between p-4 rounded-lg border border-[#E5E7EB] hover:bg-[#F5F7FA] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#E6F1FB] flex items-center justify-center">
                  <ClipboardList className="h-5 w-5 text-[#1677FF]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#000]">订单管理</p>
                  <p className="text-xs text-[#999]">查看所有订单</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#ccc]" />
            </Link>

            <Link
              href="/channel/audit"
              className="flex items-center justify-between p-4 rounded-lg border border-[#E5E7EB] hover:bg-[#F5F7FA] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[#FAEEDA] flex items-center justify-center">
                  <CheckSquare className="h-5 w-5 text-[#854F0B]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[#000]">订单审核</p>
                  <p className="text-xs text-[#999]">审核号卡办理状态</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-[#ccc]" />
            </Link>
          </CardContent>
        </Card>

        {/* Todo List */}
        <Card className="rounded-xl border-[#E5E7EB] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">待办事项</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {todoItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F5F7FA] transition-colors"
              >
                <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center', item.color)}>
                  <item.icon className={cn('h-4 w-4', item.iconColor)} />
                </div>
                <span className="text-sm text-[#333] flex-1">{item.text}</span>
                <ChevronRight className="h-4 w-4 text-[#ccc]" />
              </Link>
            ))}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F7FA]">
              <div className="h-8 w-8 rounded-lg bg-[#EEEDFE] flex items-center justify-center">
                <Bell className="h-4 w-4 text-[#534AB7]" />
              </div>
              <span className="text-sm text-[#666] flex-1">暂无其他通知</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
