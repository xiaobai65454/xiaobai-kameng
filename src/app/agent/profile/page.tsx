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
  ShoppingCart,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export default function ProfilePage() {
  const { profile, logout, getAuthHeaders } = useAuth();
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

  const functionButtons = [
    { label: '提现管理', icon: Wallet, href: '/agent/withdraw' },
    { label: '收入明细', icon: FileText, href: '/agent/commissions' },
    { label: '通知设置', icon: Bell, href: '#' },
    { label: '分佣设置', icon: Settings, href: '#' },
  ];

  const menuItems = [
    { label: '个人中心', sublabel: '基本信息/改密码/实名', icon: User, href: '#' },
    { label: '操作日志', sublabel: '查看操作记录', icon: ClipboardList, href: '#' },
    { label: '设置', sublabel: '店铺/隐私/分佣', icon: Settings, href: '#' },
  ];

  const inviteCodes = [
    { name: '默认推荐码', code: profile?.invite_code || '-' },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f5] pb-20">
      {/* 顶部用户信息栏 - 蓝色渐变 */}
      <div className="bg-gradient-to-r from-[#1890ff] to-[#0d6efd] px-4 pt-6 pb-8 text-white">
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

        {/* 余额显示 */}
        <div className="mt-4">
          <p className="text-xs text-white/70 mb-1">账户余额 (元)</p>
          <p className="text-2xl font-bold font-mono">
            ¥{Number(profile?.balance || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {/* 功能按钮区 */}
      <div className="px-4 -mt-4">
        <div className="bg-white rounded-lg p-4 grid grid-cols-4 gap-4 shadow-[0_0_20px_rgba(0,0,0,0.05)]">
          {functionButtons.map((btn, index) => (
            <a
              key={index}
              href={btn.href}
              className="flex flex-col items-center gap-2"
            >
              <div className="w-10 h-10 rounded-full border border-[#0d6efd]/30 flex items-center justify-center">
                <btn.icon className="w-5 h-5 text-[#0d6efd]" />
              </div>
              <span className="text-xs text-gray-600">{btn.label}</span>
            </a>
          ))}
        </div>
      </div>

      {/* 推荐码区域 */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-lg p-4 shadow-[0_0_20px_rgba(0,0,0,0.05)]">
          <h3 className="font-medium text-gray-900 mb-3">我的推荐码</h3>
          {inviteCodes.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
              <div>
                <p className="text-sm text-gray-600">{item.name}</p>
                <p className="font-mono font-medium text-gray-900">{item.code}</p>
              </div>
              <button
                onClick={() => handleCopy(item.code, index)}
                className={cn(
                  'px-4 py-1.5 rounded-full text-xs font-medium transition-colors',
                  copiedIndex === index
                    ? 'bg-[#f6ffed] text-[#52c41a]'
                    : 'bg-[#fff2f0] text-[#f5222d] hover:bg-[#ffccc7]'
                )}
              >
                {copiedIndex === index ? '已复制' : '复制'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 菜单列表 */}
      <div className="px-4 mt-3">
        <div className="bg-white rounded-lg overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.05)]">
          {menuItems.map((item, index) => (
            <a
              key={index}
              href={item.href}
              className="flex items-center justify-between px-4 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-[#e6f7ff] flex items-center justify-center">
                  <item.icon className="w-4 h-4 text-[#0d6efd]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.label}</p>
                  <p className="text-xs text-gray-500">{item.sublabel}</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-400" />
            </a>
          ))}
        </div>
      </div>

      {/* 退出登录 */}
      <div className="px-4 mt-3">
        <button
          onClick={handleLogout}
          className="w-full bg-white rounded-lg py-3 flex items-center justify-center gap-2 text-[#f5222d] font-medium hover:bg-red-50 transition-colors shadow-[0_0_20px_rgba(0,0,0,0.05)]"
        >
          <LogOut className="w-4 h-4" />
          退出登录
        </button>
      </div>

      {/* 底部 Tab 栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50">
        <a href="/agent" className="flex flex-col items-center gap-1 px-3 py-1">
          <Wallet className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">首页</span>
        </a>
        <a href="/agent/orders" className="flex flex-col items-center gap-1 px-3 py-1">
          <FileText className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">订单</span>
        </a>
        <a href="/agent/products" className="flex flex-col items-center gap-1 px-3 py-1">
          <ShoppingCart className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">商品</span>
        </a>
        <a href="/agent/team" className="flex flex-col items-center gap-1 px-3 py-1">
          <Users className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">代理</span>
        </a>
        <a href="/agent/profile" className="flex flex-col items-center gap-1 px-3 py-1">
          <UserCircle className="w-5 h-5 text-[#0d6efd]" />
          <span className="text-xs text-[#0d6efd] font-medium">我的</span>
        </a>
      </div>
    </div>
  );
}
