'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Shield, User, ArrowRight, ClipboardCheck, Smartphone } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading, isAdmin, profile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    // 如果已登录，自动跳转到对应的门户
    if (isAuthenticated) {
      if (isAdmin) {
        router.push('/admin');
      } else if (profile?.role === 'channel') {
        router.push('/channel');
      } else {
        router.push('/agent');
      }
    }
  }, [isAuthenticated, isLoading, isAdmin, profile, router]);

  // 已登录时显示加载状态
  if (isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">正在跳转...</p>
        </div>
      </div>
    );
  }

  // 未登录时显示门户选择页面
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">小白卡盟</h1>
          <p className="text-slate-400 text-lg">号卡分销代理平台</p>
        </div>

        {/* Portal Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {/* Customer Shop */}
          <a
            href="/customer"
            className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-cyan-500/50 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-600/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-500 mb-4">
                <Smartphone className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">号卡商城</h2>
              <p className="text-slate-400 text-sm mb-4">
                浏览号卡产品、在线下单、分享赚取佣金
              </p>
              <div className="flex items-center text-cyan-400 group-hover:text-cyan-300 transition-colors">
                <span className="font-medium text-sm">进入商城</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>

          {/* Admin Portal */}
          <a
            href="/portal/admin"
            className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-blue-500/50 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
                <Shield className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">管理后台</h2>
              <p className="text-slate-400 text-sm mb-4">
                商品管理、订单审核、代理管理等全局管理功能
              </p>
              <div className="flex items-center text-blue-400 group-hover:text-blue-300 transition-colors">
                <span className="font-medium text-sm">进入管理后台</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>

          {/* Channel Portal */}
          <a
            href="/portal/channel"
            className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-600/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-600 mb-4">
                <ClipboardCheck className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">渠道方</h2>
              <p className="text-slate-400 text-sm mb-4">
                订单审核、号卡办理状态确认等渠道专属功能
              </p>
              <div className="flex items-center text-purple-400 group-hover:text-purple-300 transition-colors">
                <span className="font-medium text-sm">进入渠道后台</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>

          {/* Agent Portal */}
          <a
            href="/portal/agent"
            className="group relative bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-emerald-500/50 transition-all duration-300"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-600 mb-4">
                <User className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">代理中心</h2>
              <p className="text-slate-400 text-sm mb-4">
                订单提交、佣金查看、团队管理等代理专属功能
              </p>
              <div className="flex items-center text-emerald-400 group-hover:text-emerald-300 transition-colors">
                <span className="font-medium text-sm">进入代理中心</span>
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </a>
        </div>

        {/* Footer */}
        <div className="text-center mt-12">
          <p className="text-slate-500 text-sm">
            © 2024 小白卡盟
          </p>
        </div>
      </div>
    </div>
  );
}
