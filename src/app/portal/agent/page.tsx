'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSupabaseConfig } from '@/lib/supabase-browser';
import { User, Lock, AlertCircle } from 'lucide-react';

export default function AgentLoginPage() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, isAdmin } = useAuth();
  const { isReady } = useSupabaseConfig();

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      router.push('/agent');
    } else if (isAuthenticated && isAdmin) {
      router.push('/portal/admin');
    }
  }, [isAuthenticated, isAdmin, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!isReady) return;
    
    setError('');
    setLoading(true);

    try {
      const { error, profile } = await login(account, password);
      if (error) {
        setError(error === 'Invalid login credentials' ? '账号或密码错误' : error);
      } else if (profile?.role === 'admin') {
        // 管理员用户，跳转到管理登录页
        router.push('/portal/admin');
      } else if (profile) {
        router.push('/agent');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-600 mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">小白卡盟</h1>
          <p className="text-slate-400 mt-2">代理中心</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">代理登录</h2>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">账号</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  placeholder="请输入邮箱或用户名"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isReady}
              className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center space-y-3">
            <p className="text-sm text-slate-500">
              还没有账号？
              <a href="/register" className="text-emerald-600 hover:underline ml-1">
                立即注册
              </a>
            </p>
            <p className="text-sm text-slate-500">
              管理员登录？
              <a href="/portal/admin" className="text-blue-600 hover:underline ml-1">
                点击这里
              </a>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-sm mt-6">
          © 2024 多级分销代理管理系统
        </p>
      </div>
    </div>
  );
}
