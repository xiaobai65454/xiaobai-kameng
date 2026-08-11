'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ChannelLoginForm() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, profile, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/channel';

  useEffect(() => {
    if (isAuthenticated && profile) {
      if (profile.role === 'channel') {
        router.push(redirectTo);
      } else {
        setError('该账号不是渠道方，请使用渠道方账号登录');
      }
    }
  }, [isAuthenticated, profile, router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password) {
      setError('请输入账号和密码');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const result = await login(account, password);
      if (result.error) {
        setError(result.error);
      } else if (result.profile) {
        if (result.profile.role === 'channel') {
          router.push(redirectTo);
        } else {
          setError('该账号不是渠道方，请使用渠道方账号登录');
        }
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">加载中...</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-purple-100">
            <ShieldCheck className="h-7 w-7 text-purple-600" />
          </div>
          <CardTitle className="text-2xl font-bold">渠道方登录</CardTitle>
          <CardDescription>号卡渠道方管理后台</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="account">账号</Label>
              <Input
                id="account"
                type="text"
                placeholder="请输入用户名或邮箱"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                disabled={loading}
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
                disabled={loading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
            <div className="flex items-center justify-between w-full text-sm">
              <Link href="/" className="text-purple-600 hover:underline flex items-center">
                <ArrowLeft className="mr-1 h-4 w-4" />
                返回首页
              </Link>
              <div className="flex gap-2">
                <Link href="/portal/admin" className="text-gray-500 hover:text-purple-600">
                  管理员登录
                </Link>
                <span className="text-gray-300">|</span>
                <Link href="/portal/agent" className="text-gray-500 hover:text-purple-600">
                  代理登录
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

export default function ChannelLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">加载中...</div>}>
      <ChannelLoginForm />
    </Suspense>
  );
}
