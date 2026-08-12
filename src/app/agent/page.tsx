'use client';

import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  TrendingUp,
  Users,
  ShoppingCart,
  Package,
  FileText,
  UserCircle,
  DollarSign,
  Bell,
  QrCode,
  CheckCircle2,
  ArrowUpRight,
  ChevronRight,
  ClipboardList,
  Share2,
  Copy,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AgentHomePage() {
  const { profile, getAuthHeaders } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard', {
          headers: getAuthHeaders(),
        });
        if (res.ok) {
          const data = await res.json();
          setDashboard(data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, [getAuthHeaders]);

  const handleCopyInvite = () => {
    if (profile?.invite_code) {
      navigator.clipboard.writeText(profile.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyShopLink = () => {
    if (profile?.invite_code) {
      const url = `${window.location.origin}/customer?ref=${profile.invite_code}`;
      navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const formatMoney = (amount: number) => {
    return `¥${(amount || 0).toFixed(2)}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1677FF]"></div>
      </div>
    );
  }

  const quickActions = [
    { href: '/agent/report', label: '号卡报单', icon: ClipboardList, color: 'bg-[#E6F1FB] text-[#1677FF]' },
    { href: '/agent/products', label: '号卡列表', icon: Package, color: 'bg-[#E1F5EE] text-[#0F6E56]' },
    { href: '/agent/orders', label: '我的订单', icon: FileText, color: 'bg-[#FAEEDA] text-[#854F0B]' },
    { href: '/agent/team', label: '我的团队', icon: Users, color: 'bg-[#EEEDFE] text-[#534AB7]' },
    { href: '/agent/withdraw', label: '提现管理', icon: DollarSign, color: 'bg-[#FAECE7] text-[#993C1D]' },
    { href: '/agent/commissions', label: '佣金明细', icon: Receipt, color: 'bg-[#E6F1FB] text-[#185FA5]' },
    { href: '/agent/invite', label: '邀请管理', icon: Share2, color: 'bg-[#E1F5EE] text-[#1D9E75]' },
    { href: '/agent/profile', label: '个人资料', icon: UserCircle, color: 'bg-[#F1EFE8] text-[#5F5E5A]' },
  ];

  const dataCards = [
    { label: '今日激活', value: dashboard?.todayOrders || 0, icon: TrendingUp, color: 'text-[#1677FF]', bg: 'bg-[#E6F1FB]' },
    { label: '昨日激活', value: dashboard?.yesterdayOrders || 0, icon: ArrowUpRight, color: 'text-[#3B6D11]', bg: 'bg-[#EAF3DE]' },
    { label: '累计激活', value: dashboard?.totalOrders || 0, icon: CheckCircle2, color: 'text-[#854F0B]', bg: 'bg-[#FAEEDA]' },
    { label: '号卡总数', value: dashboard?.totalProducts || 0, icon: Package, color: 'text-[#534AB7]', bg: 'bg-[#EEEDFE]' },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#000]">我的看板</h1>
        <p className="text-sm text-[#999] mt-1">欢迎回来，{profile?.name || '代理人'}</p>
      </div>

      {/* Revenue + Stats Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Card - Dark */}
        <Card className="lg:col-span-1 bg-[#0C1A2E] border-0 rounded-xl overflow-hidden">
          <CardContent className="p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-white/50">累计收益 (元)</p>
              <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-[#1677FF]" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono text-white">
              {formatMoney(dashboard?.totalCommissions || profile?.balance || 0)}
            </p>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="h-3 w-3 text-[#52C41A]" />
              <span className="text-xs text-[#52C41A]">
                {dashboard?.yesterdayGrowth ? `+${dashboard.yesterdayGrowth}%` : '+0%'} 较上月
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-white/10">
              <div>
                <p className="text-[11px] text-white/40">本年度收益</p>
                <p className="text-sm font-bold font-mono text-white mt-0.5">
                  {formatMoney(dashboard?.yearCommissions || 0)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-white/40">昨日收益</p>
                <p className="text-sm font-bold font-mono text-white mt-0.5">
                  {formatMoney(dashboard?.yesterdayCommissions || 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-3">
          {dataCards.map((card, index) => (
            <Card key={index} className="rounded-xl border-[#E5E7EB] shadow-none">
              <CardContent className="p-4">
                <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center mb-2', card.bg)}>
                  <card.icon className={cn('h-[18px] w-[18px]', card.color)} />
                </div>
                <p className="text-2xl font-bold font-mono text-[#000]">{card.value}</p>
                <p className="text-xs text-[#999] mt-0.5">{card.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="rounded-xl border-[#E5E7EB] shadow-none">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">快捷操作</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 lg:grid-cols-8 gap-3">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                href={action.href}
                className="flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-[#F5F7FA] transition-colors"
              >
                <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center', action.color)}>
                  <action.icon className="h-5 w-5" />
                </div>
                <span className="text-xs text-[#666]">{action.label}</span>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Two columns: Revenue trend + Promotion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue trend placeholder */}
        <Card className="rounded-xl border-[#E5E7EB] shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">近期收益</CardTitle>
              <Link href="/agent/commissions" className="text-xs text-[#1677FF] hover:underline">
                查看全部
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-center justify-center">
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-[#F5F7FA] flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-[#ccc]" />
                </div>
                <p className="text-sm text-[#999]">暂无收益数据</p>
                <p className="text-xs text-[#ccc] mt-1">推广号卡后收益将展示在这里</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Promotion links */}
        <Card className="rounded-xl border-[#E5E7EB] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">推广与邀请</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Invite code */}
            <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
              <div>
                <p className="text-xs text-[#999]">我的邀请码</p>
                <p className="font-mono font-semibold text-[#000] mt-0.5">
                  {profile?.invite_code || '-'}
                </p>
              </div>
              <button
                onClick={handleCopyInvite}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1',
                  copied
                    ? 'bg-[#E1F5EE] text-[#0F6E56]'
                    : 'bg-[#1677FF] text-white hover:bg-[#185FA5]'
                )}
              >
                <Copy className="h-3 w-3" />
                {copied ? '已复制' : '复制'}
              </button>
            </div>

            {/* Shop link */}
            <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
              <div className="min-w-0 flex-1">
                <p className="text-xs text-[#999]">推广店铺链接</p>
                <p className="text-xs text-[#666] mt-0.5 truncate">
                  {typeof window !== 'undefined'
                    ? `${window.location.origin}/customer?ref=${profile?.invite_code || ''}`
                    : ''}
                </p>
              </div>
              <button
                onClick={handleCopyShopLink}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 shrink-0 ml-2',
                  linkCopied
                    ? 'bg-[#E1F5EE] text-[#0F6E56]'
                    : 'bg-[#1677FF] text-white hover:bg-[#185FA5]'
                )}
              >
                <Share2 className="h-3 w-3" />
                {linkCopied ? '已复制' : '复制'}
              </button>
            </div>

            <Link
              href="/agent/invite"
              className="flex items-center justify-between p-3 bg-[#E6F1FB] rounded-lg hover:bg-[#B5D4F4] transition-colors"
            >
              <div className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-[#1677FF]" />
                <span className="text-sm text-[#1677FF] font-medium">生成推广海报</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#1677FF]" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Notification bar */}
      <Card className="rounded-xl border-[#E5E7EB] shadow-none">
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-full bg-[#FAEEDA] flex items-center justify-center shrink-0">
              <Bell className="h-3.5 w-3.5 text-[#854F0B]" />
            </div>
            <span className="text-sm text-[#666]">平台通知：新产品已上架，去号卡列表查看</span>
            <ChevronRight className="h-4 w-4 text-[#ccc] ml-auto" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
