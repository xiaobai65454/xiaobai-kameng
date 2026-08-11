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
  Copy,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const agentMenuItems = [
  { href: '/agent', label: '我的看板', icon: LayoutDashboard },
  { href: '/agent/orders', label: '我的订单', icon: ShoppingCart },
  { href: '/agent/team', label: '我的团队', icon: Users },
  { href: '/agent/commissions', label: '佣金明细', icon: Receipt },
  { href: '/agent/withdraw', label: '提现管理', icon: Wallet },
  { href: '/agent/invite', label: '邀请管理', icon: Link2 },
];

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="p-6 border-b border-slate-700">
          <h1 className="text-lg font-bold">小白卡盟</h1>
          <p className="text-xs text-slate-400 mt-1">代理中心</p>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {agentMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="px-3 py-2 mb-2 bg-slate-800 rounded-lg">
            <p className="text-xs text-slate-400">我的邀请码</p>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm font-mono font-medium flex-1">{profile?.invite_code || '-'}</p>
              <button
                onClick={() => {
                  if (profile?.invite_code) {
                    navigator.clipboard.writeText(profile.invite_code);
                  }
                }}
                className="text-slate-400 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-medium">
              {profile?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.name || 'Agent'}</p>
              <p className="text-xs text-slate-400 truncate">{profile?.email || ''}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-slate-300 hover:text-white hover:bg-slate-800"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-4 lg:px-6 sticky top-0 z-30">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex-1" />
          <div className="text-sm text-slate-500">
            欢迎，{profile?.name || 'Agent'}
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
