'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(account, password);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      // 根据角色直接跳转到对应门户
      if (result.profile?.role === 'admin') {
        router.push('/admin');
      } else if (result.profile?.role === 'channel') {
        router.push('/channel');
      } else {
        router.push('/agent');
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">分销代理管理系统</h1>
          <p className="text-slate-400 mt-2">多级分销 · 佣金管理 · 团队协作</p>
        </div>
        <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">登录</CardTitle>
            <CardDescription>使用您的账号和密码登录系统</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="account">账号</Label>
                <Input
                  id="account"
                  type="text"
                  placeholder="请输入邮箱或用户名"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '登录中...' : '登录'}
              </Button>
              <p className="text-center text-sm text-slate-500">
                还没有账号？{' '}
                <a href="/register" className="text-blue-600 hover:underline">立即注册</a>
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
