'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Wallet,
  Receipt,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  Package,
  UserCircle,
  Link2,
  ClipboardList,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const agentMenuGroups = [
  {
    title: '工作台',
    items: [
      { href: '/agent', label: '我的看板', icon: LayoutDashboard },
    ],
  },
  {
    title: '业务管理',
    items: [
      { href: '/agent/products', label: '号卡列表', icon: Package },
      { href: '/agent/orders', label: '我的订单', icon: ShoppingCart },
      { href: '/agent/report', label: '号卡报单', icon: ClipboardList },
    ],
  },
  {
    title: '团队与收益',
    items: [
      { href: '/agent/team', label: '我的团队', icon: Users },
      { href: '/agent/commissions', label: '佣金明细', icon: Receipt },
      { href: '/agent/withdraw', label: '提现管理', icon: Wallet },
      { href: '/agent/invite', label: '邀请管理', icon: Link2 },
    ],
  },
  {
    title: '账户',
    items: [
      { href: '/agent/profile', label: '个人资料', icon: UserCircle },
    ],
  },
];

const allMenuItems = agentMenuGroups.flatMap((g) => g.items);

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { profile, logout, isAuthenticated, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.push('/portal/agent');
    } else if (isAdmin) {
      router.push('/admin');
    }
  }, [isAuthenticated, isAdmin, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading || !isAuthenticated || isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1677FF]"></div>
      </div>
    );
  }

  const getBreadcrumb = () => {
    const item = allMenuItems.find((i) => i.href === pathname);
    return item?.label || '我的看板';
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-60 bg-[#0C1A2E] text-white flex flex-col transition-transform duration-300 shrink-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="h-16 px-5 flex items-center gap-3 border-b border-white/8 shrink-0">
          <div className="h-9 w-9 rounded-lg bg-[#1677FF] flex items-center justify-center">
            <Package className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-semibold leading-tight">小白卡盟</h1>
            <p className="text-[11px] text-white/40 leading-tight">代理中心</p>
          </div>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {agentMenuGroups.map((group) => (
            <div key={group.title} className="mb-1">
              <p className="px-5 py-1.5 text-[11px] font-medium text-white/30 uppercase tracking-wide">
                {group.title}
              </p>
              {group.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={cn(
                      'flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg text-[13px] transition-colors',
                      isActive
                        ? 'bg-[#1677FF] text-white'
                        : 'text-white/55 hover:bg-white/8 hover:text-white'
                    )}
                  >
                    <item.icon className="h-[18px] w-[18px]" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/8 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg hover:bg-white/8 cursor-pointer">
            <div className="h-9 w-9 rounded-full bg-[#1677FF] flex items-center justify-center text-sm font-semibold">
              {profile?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.name || 'Agent'}</p>
              <p className="text-[11px] text-white/40 truncate">代理商人</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white/50 hover:text-white hover:bg-white/8 text-[13px]"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-3"
            onClick={() => setSidebarOpen(true)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2 text-[13px]">
            <span className="text-[#999]">首页</span>
            <ChevronRight className="h-4 w-4 text-[#ccc]" />
            <span className="text-[#333] font-medium">{getBreadcrumb()}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-lg hover:bg-[#F5F7FA] transition-colors">
              <Bell className="h-[18px] w-[18px] text-[#666]" />
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#F5222D] rounded-full" />
            </button>
            <div className="h-8 w-8 rounded-full bg-[#1677FF] flex items-center justify-center text-sm font-medium text-white">
              {profile?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
