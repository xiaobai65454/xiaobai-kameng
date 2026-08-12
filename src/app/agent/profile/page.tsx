'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import {
  UserCircle,
  Wallet,
  FileText,
  Bell,
  Settings,
  User,
  ClipboardList,
  LogOut,
  ChevronRight,
  Copy,
  CheckCircle2,
  ShoppingBag,
  Link2,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function ProfilePage() {
  const { profile, logout } = useAuth();
  const router = useRouter();
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const quickLinks = [
    { label: '提现管理', icon: Wallet, href: '/agent/withdraw', color: 'bg-[#FAEEDA] text-[#854F0B]' },
    { label: '收入明细', icon: FileText, href: '/agent/commissions', color: 'bg-[#E6F1FB] text-[#1677FF]' },
    { label: '我的订单', icon: ShoppingBag, href: '/agent/orders', color: 'bg-[#E1F5EE] text-[#0F6E56]' },
    { label: '我的团队', icon: Users, href: '/agent/team', color: 'bg-[#EEEDFE] text-[#534AB7]' },
  ];

  const menuItems = [
    { label: '个人中心', sublabel: '基本信息 / 修改密码 / 实名认证', icon: User, href: '#' },
    { label: '操作日志', sublabel: '查看操作记录', icon: ClipboardList, href: '#' },
    { label: '通知设置', sublabel: '消息推送 / 提醒方式', icon: Bell, href: '#' },
    { label: '系统设置', sublabel: '店铺 / 隐私 / 分佣', icon: Settings, href: '#' },
  ];

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#000]">个人资料</h1>
        <p className="text-sm text-[#999] mt-1">管理您的账户信息和安全设置</p>
      </div>

      {/* User Info Card - Dark */}
      <Card className="bg-[#0C1A2E] border-0 rounded-xl overflow-hidden">
        <CardContent className="p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-white/10 flex items-center justify-center">
              <UserCircle className="h-9 w-9 text-white/80" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-white">{profile?.name || '用户'}</span>
                <span className="px-2 py-0.5 bg-[#E1F5EE] text-[#0F6E56] rounded text-xs font-medium">已实名</span>
              </div>
              <p className="text-sm text-white/50 mt-0.5">{profile?.email || '未设置邮箱'}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-[11px] text-white/40">账户余额</p>
              <p className="text-lg font-bold font-mono text-white mt-0.5">
                ¥{Number(profile?.balance || 0).toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-white/40">邀请码</p>
              <p className="text-lg font-bold font-mono text-white mt-0.5">
                {profile?.invite_code || '-'}
              </p>
            </div>
            <div>
              <p className="text-[11px] text-white/40">账户状态</p>
              <p className="text-lg font-bold text-white mt-0.5">正常</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {quickLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E5E7EB] hover:bg-[#F5F7FA] transition-colors"
          >
            <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', link.color)}>
              <link.icon className="h-5 w-5" />
            </div>
            <span className="text-sm font-medium text-[#333]">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Invite Code */}
        <Card className="rounded-xl border-[#E5E7EB] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">推广码管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-[#F5F7FA] rounded-lg">
              <div>
                <p className="text-xs text-[#999]">默认推荐码</p>
                <p className="font-mono font-semibold text-[#000] mt-0.5">
                  {profile?.invite_code || '-'}
                </p>
              </div>
              <button
                onClick={() => handleCopy(profile?.invite_code || '', 0)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1',
                  copiedIndex === 0
                    ? 'bg-[#E1F5EE] text-[#0F6E56]'
                    : 'bg-[#1677FF] text-white hover:bg-[#185FA5]'
                )}
              >
                <Copy className="h-3 w-3" />
                {copiedIndex === 0 ? '已复制' : '复制'}
              </button>
            </div>
            <Link
              href="/agent/invite"
              className="flex items-center justify-between p-3 bg-[#E6F1FB] rounded-lg hover:bg-[#B5D4F4] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Link2 className="h-4 w-4 text-[#1677FF]" />
                <span className="text-sm text-[#1677FF] font-medium">邀请管理</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[#1677FF]" />
            </Link>
          </CardContent>
        </Card>

        {/* Menu List */}
        <Card className="rounded-xl border-[#E5E7EB] shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium">账户管理</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {menuItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="flex items-center justify-between p-3 rounded-lg hover:bg-[#F5F7FA] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[#E6F1FB] flex items-center justify-center">
                    <item.icon className="h-4 w-4 text-[#1677FF]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#333]">{item.label}</p>
                    <p className="text-xs text-[#999]">{item.sublabel}</p>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#ccc]" />
              </a>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-white rounded-xl py-3.5 flex items-center justify-center gap-2 text-[#A32D2D] font-medium hover:bg-[#FCEBEB] transition-colors border border-[#E5E7EB]"
      >
        <LogOut className="h-4 w-4" />
        退出登录
      </button>
    </div>
  );
}
