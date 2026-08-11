'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  ClipboardList,
  CheckSquare,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navigation = [
  { name: '工作台', href: '/channel', icon: LayoutDashboard },
  { name: '订单管理', href: '/channel/orders', icon: ClipboardList },
  { name: '订单审核', href: '/channel/audit', icon: CheckSquare },
];

export default function ChannelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, logout, isChannel } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!profile) return;
    if (!isChannel) {
      router.push('/portal/channel');
    }
  }, [profile, isChannel, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/portal/channel');
  };

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!isChannel) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', sidebarOpen ? 'block' : 'hidden')}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-purple-700">
          <div className="flex h-16 items-center justify-between px-4">
            <span className="text-xl font-bold text-white">渠道方后台</span>
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)} className="text-white">
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/channel' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg',
                    isActive ? 'bg-purple-800 text-white' : 'text-purple-100 hover:bg-purple-600'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-purple-700">
          <div className="flex h-16 items-center px-4">
            <span className="text-xl font-bold text-white">渠道方后台</span>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/channel' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center px-4 py-3 text-sm font-medium rounded-lg',
                    isActive ? 'bg-purple-800 text-white' : 'text-purple-100 hover:bg-purple-600'
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-purple-600 p-4">
            <div className="mb-3 text-sm text-purple-200">
              <div className="font-medium text-white">{profile.name}</div>
              <div className="text-xs">渠道方</div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full border-purple-500 text-purple-100 hover:bg-purple-600"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              退出登录
            </Button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex flex-1 items-center justify-end">
            <div className="flex items-center gap-x-4">
              <span className="text-sm text-gray-500">{profile.name}</span>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
