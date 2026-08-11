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
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const quickActions = [
    { href: '/agent/products', label: '商品', icon: Package, color: 'bg-[#e6f7ff] text-[#0d6efd]' },
    { href: '/agent/orders', label: '订单', icon: FileText, color: 'bg-[#f6ffed] text-[#52c41a]' },
    { href: '/agent/team', label: '代理', icon: Users, color: 'bg-[#f9f0ff] text-[#722ed1]' },
    { href: '/agent/withdraw', label: '财务', icon: DollarSign, color: 'bg-[#fff7e6] text-[#fa8c16]' },
  ];

  const dataCards = [
    { label: '今日激活', value: dashboard?.todayOrders || 0, icon: TrendingUp, color: 'text-[#0d6efd]', bg: 'bg-[#e6f7ff]' },
    { label: '昨日激活', value: dashboard?.yesterdayOrders || 0, icon: ArrowUpRight, color: 'text-[#52c41a]', bg: 'bg-[#f6ffed]' },
    { label: '累计激活', value: dashboard?.totalOrders || 0, icon: CheckCircle2, color: 'text-[#fa8c16]', bg: 'bg-[#fff7e6]' },
    { label: '号卡总数', value: dashboard?.totalProducts || 0, icon: Package, color: 'text-[#722ed1]', bg: 'bg-[#f9f0ff]' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      {/* 顶部用户信息区 - 蓝色渐变 */}
      <div className="bg-gradient-to-r from-[#1890ff] to-[#0d6efd] px-4 pt-6 pb-8 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
              <UserCircle className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-lg">{profile?.name || '用户'}</span>
                <span className="px-2 py-0.5 bg-[#f6ffed] text-[#52c41a] rounded text-xs">已实名</span>
              </div>
              <p className="text-xs text-white/70 mt-0.5">{profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/agent/report">
              <button className="flex items-center gap-1 px-3 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm hover:bg-white/30 transition-colors">
                <ClipboardList className="w-4 h-4" />
                <span>报单</span>
              </button>
            </Link>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 累计收益 */}
        <div className="mt-4">
          <p className="text-xs text-white/70 mb-1">累计收益 (元)</p>
          <p className="text-3xl font-bold font-mono">
            {formatMoney(dashboard?.totalCommissions || profile?.balance || 0)}
          </p>
        </div>

        {/* 三列数据 */}
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div>
            <p className="text-xs text-white/70">本年度收益</p>
            <p className="text-lg font-bold font-mono mt-1">
              {formatMoney(dashboard?.yearCommissions || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/70">昨日收益</p>
            <p className="text-lg font-bold font-mono mt-1">
              {formatMoney(dashboard?.yesterdayCommissions || 0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/70">昨日涨幅</p>
            <p className="text-lg font-bold font-mono mt-1">
              {dashboard?.yesterdayGrowth ? `+${dashboard.yesterdayGrowth}%` : '0%'}
            </p>
          </div>
        </div>
      </div>

      {/* 号卡报单入口 - 醒目大按钮 */}
      <div className="px-4 -mt-4 relative z-10">
        <Link href="/agent/report">
          <div className="bg-white rounded-xl p-4 shadow-[0_0_20px_rgba(0,0,0,0.05)] flex items-center justify-between active:scale-[0.98] transition-transform">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#0d6efd] rounded-xl flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-base">号卡报单</p>
                <p className="text-xs text-gray-500 mt-0.5">提交线下订单信息</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </Link>
      </div>

      {/* 消息通知条 */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-lg p-3 flex items-center justify-between shadow-[0_0_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-[#0d6efd]" />
            <span className="text-sm text-gray-600">产品恢复上架！</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* 号卡数据卡片 */}
      <div className="px-4 mt-3">
        <div className="grid grid-cols-2 gap-3">
          {dataCards.map((card, index) => (
            <div
              key={index}
              className="bg-white rounded-lg p-4 shadow-[0_0_20px_rgba(0,0,0,0.05)]"
            >
              <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center mb-2', card.bg)}>
                <card.icon className={cn('w-5 h-5', card.color)} />
              </div>
              <p className="text-2xl font-bold font-mono text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 快捷功能区 */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-lg p-4 shadow-[0_0_20px_rgba(0,0,0,0.05)]">
          <div className="grid grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href} className="flex flex-col items-center gap-2">
                <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', action.color)}>
                  <action.icon className="w-6 h-6" />
                </div>
                <span className="text-xs text-gray-600">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* 近期收益卡片 */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-lg p-4 shadow-[0_0_20px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900">近期收益</h3>
            <Link href="/agent/commissions" className="text-xs text-[#0d6efd]">
              查看全部
            </Link>
          </div>
          <div className="h-40 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无数据</p>
            </div>
          </div>
        </div>
      </div>

      {/* 推荐码区域 */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-lg p-4 shadow-[0_0_20px_rgba(0,0,0,0.05)]">
          <h3 className="font-medium text-gray-900 mb-3">我的推荐码</h3>
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <p className="text-sm text-gray-600">邀请码</p>
              <p className="font-mono font-medium text-gray-900">{profile?.invite_code || '-'}</p>
            </div>
            <button
              onClick={handleCopyInvite}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-medium transition-colors',
                copied
                  ? 'bg-[#f6ffed] text-[#52c41a]'
                  : 'bg-[#fff2f0] text-[#f5222d] hover:bg-[#ffccc7]'
              )}
            >
              {copied ? '已复制' : '复制'}
            </button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm text-gray-600">店铺链接</p>
              <p className="text-xs text-gray-400 mt-0.5">客户通过此链接下单将关联到您</p>
            </div>
            <button
              onClick={handleCopyShopLink}
              className={cn(
                'px-4 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1',
                linkCopied
                  ? 'bg-[#f6ffed] text-[#52c41a]'
                  : 'bg-[#e6f7ff] text-[#0d6efd] hover:bg-[#bae0ff]'
              )}
            >
              <Share2 className="w-3 h-3" />
              {linkCopied ? '已复制' : '复制链接'}
            </button>
          </div>
        </div>
      </div>

      {/* 底部 Tab 栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50">
        <Link href="/agent" className="flex flex-col items-center gap-1 px-3 py-1">
          <Wallet className="w-5 h-5 text-[#0d6efd]" />
          <span className="text-xs text-[#0d6efd] font-medium">首页</span>
        </Link>
        <Link href="/agent/orders" className="flex flex-col items-center gap-1 px-3 py-1">
          <FileText className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">订单</span>
        </Link>
        <Link href="/agent/products" className="flex flex-col items-center gap-1 px-3 py-1">
          <ShoppingCart className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">商品</span>
        </Link>
        <Link href="/agent/team" className="flex flex-col items-center gap-1 px-3 py-1">
          <Users className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">代理</span>
        </Link>
        <Link href="/agent/profile" className="flex flex-col items-center gap-1 px-3 py-1">
          <UserCircle className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">我的</span>
        </Link>
      </div>
    </div>
  );
}
