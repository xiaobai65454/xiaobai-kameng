'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { useSupabaseConfig } from '@/lib/supabase-browser';
import { User, Lock, Shield, AlertCircle } from 'lucide-react';

export default function AdminLoginPage() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login, isAuthenticated, isAdmin, isLoading, profile } = useAuth();
  const { isReady } = useSupabaseConfig();

  useEffect(() => {
    // 等待 profile 完全加载后再决定跳转，避免竞态条件
    // isLoading 为 true 表示 auth 或 profile 正在加载中
    if (isLoading || !profile) return;
    if (isAdmin) {
      router.push('/admin');
    } else if (profile.role === 'channel') {
      router.push('/portal/channel');
    } else {
      router.push('/portal/agent');
    }
  }, [isLoading, isAdmin, profile, router]);

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
        router.push('/admin');
      } else if (profile?.role === 'channel') {
        router.push('/portal/channel');
      } else if (profile) {
        // 代理用户，跳转到代理登录页
        router.push('/portal/agent');
      }
    } catch {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">小白卡盟</h1>
          <p className="text-slate-400 mt-2">管理后台</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6">管理员登录</h2>
          
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isReady}
              className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-sm text-slate-500">
              代理登录？
              <a href="/portal/agent" className="text-blue-600 hover:underline ml-1">
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
