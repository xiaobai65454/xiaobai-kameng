'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Award,
  Wallet,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Bell,
  ClipboardList,
  Cog,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const adminMenuItems = [
  { href: '/admin', label: '数据看板', icon: LayoutDashboard },
  { href: '/admin/system', label: '系统管理', icon: Cog },
  { href: '/admin/products', label: '号卡管理', icon: Package },
  { href: '/admin/orders', label: '订单管理', icon: ShoppingCart },
  { href: '/admin/report-orders', label: '报单审核', icon: ClipboardList },
  { href: '/admin/agents', label: '代理管理', icon: Users },
  { href: '/admin/levels', label: '等级配置', icon: Award },
  { href: '/admin/finance', label: '财务管理', icon: Wallet },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, logout, isAdmin, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!isAdmin) {
      router.push('/portal/admin');
    }
  }, [isAdmin, isLoading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F0F5FF]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1677FF]"></div>
      </div>
    );
  }

  const getBreadcrumb = () => {
    const item = adminMenuItems.find((i) => i.href === pathname);
    return item?.label || '数据看板';
  };

  return (
    <div className="min-h-screen bg-[#F0F5FF] flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-60 bg-gradient-to-b from-[#001529] to-[#002140] text-white flex flex-col transition-transform duration-300',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#1677FF] flex items-center justify-center">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold">小白卡盟</h1>
              <p className="text-xs text-white/50">分销管理系统</p>
            </div>
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {adminMenuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all',
                  isActive
                    ? 'bg-[#1677FF] text-white shadow-lg shadow-[#1677FF]/30'
                    : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 px-3 py-2 mb-3 bg-white/5 rounded-xl">
            <div className="h-9 w-9 rounded-full bg-[#1677FF] flex items-center justify-center text-sm font-bold">
              {profile?.name?.charAt(0) || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{profile?.name || 'Admin'}</p>
              <p className="text-xs text-white/50 truncate">管理员</p>
            </div>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-white/60 hover:text-white hover:bg-white/10"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-16 bg-white border-b border-[#E5E7EB] flex items-center px-4 lg:px-6 sticky top-0 z-30 shadow-sm">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden mr-4"
            onClick={() => setSidebarOpen(true)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
          <div className="flex items-center gap-2 text-sm text-[#666]">
            <span>首页</span>
            <ChevronRight className="h-4 w-4" />
            <span className="text-[#000] font-medium">{getBreadcrumb()}</span>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5 text-[#666]" />
              <span className="absolute top-1 right-1 h-2 w-2 bg-[#F5222D] rounded-full" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-[#1677FF] flex items-center justify-center text-sm font-medium text-white">
              {profile?.name?.charAt(0) || 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
