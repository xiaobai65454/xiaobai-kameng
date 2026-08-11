'use client';

import { useState, useEffect, Suspense } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { UserPlus, Crown, Shield } from 'lucide-react';

interface InvitationInfo {
  id: string;
  inviter_id: string;
  invite_code: string;
  level_id: string | null;
  note: string | null;
  inviter_profile?: {
    name: string;
    email: string;
  };
  agent_levels?: {
    id: string;
    name: string;
    level: number;
  };
}

function RegisterForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteCode = searchParams.get('invite') || '';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [invite, setInvite] = useState(inviteCode);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null);
  const [loadingInvitation, setLoadingInvitation] = useState(!!inviteCode);

  // Fetch invitation info when page loads with invite code
  useEffect(() => {
    if (!inviteCode) {
      setLoadingInvitation(false);
      return;
    }

    const fetchInvitation = async () => {
      try {
        const res = await fetch(`/api/invitations/by-code/${inviteCode}`);
        if (res.ok) {
          const data = await res.json();
          setInvitationInfo(data.invitation);
        } else {
          // Invitation not found, but still allow registration with the code
          setInvite(inviteCode);
        }
      } catch (err) {
        console.error('Failed to fetch invitation info:', err);
      } finally {
        setLoadingInvitation(false);
      }
    };

    fetchInvitation();
  }, [inviteCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    if (password.length < 6) {
      setError('密码至少6个字符');
      return;
    }

    setLoading(true);
    const result = await register(email, password, name, invite || undefined);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      router.push('/');
    }
  };

  // Loading state for invitation info
  if (loadingInvitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="text-white mt-4">正在加载邀请信息...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">分销代理管理系统</h1>
          <p className="text-slate-400 mt-2">注册成为代理，开启您的分销之旅</p>
        </div>

        {/* Invitation Info Card */}
        {invitationInfo && (
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 border-0 shadow-2xl mb-6">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Crown className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-lg">您收到一份代理邀请</h3>
                  <p className="text-white/80 text-sm">注册后即成为下级代理</p>
                </div>
              </div>
              
              <div className="space-y-3 bg-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">邀请人</span>
                  <span className="text-white font-medium">
                    {invitationInfo.inviter_profile?.name || '代理'}
                  </span>
                </div>
                {invitationInfo.agent_levels && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">代理等级</span>
                    <span className="text-white font-medium flex items-center gap-1">
                      <Shield className="h-4 w-4" />
                      {invitationInfo.agent_levels.name}
                    </span>
                  </div>
                )}
                {invitationInfo.note && (
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">备注</span>
                    <span className="text-white font-medium">{invitationInfo.note}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-white/95 backdrop-blur border-0 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <UserPlus className="h-6 w-6" />
              {invitationInfo ? '接受邀请并注册' : '注册'}
            </CardTitle>
            <CardDescription>
              {invitationInfo 
                ? '填写以下信息完成注册，注册后将自动成为邀请人的下级代理'
                : '填写以下信息完成注册'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-200">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  placeholder="请输入姓名"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">邮箱</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="请输入邮箱"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码（至少6个字符）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">确认密码</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              {!invitationInfo && (
                <div className="space-y-2">
                  <Label htmlFor="invite">邀请码（可选）</Label>
                  <Input
                    id="invite"
                    placeholder="请输入邀请码"
                    value={invite}
                    onChange={(e) => setInvite(e.target.value)}
                  />
                </div>
              )}
              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
                size="lg"
              >
                {loading ? '注册中...' : (invitationInfo ? '接受邀请并注册' : '注册')}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <span className="text-slate-600">已有账号？</span>
              <Button 
                variant="link" 
                onClick={() => router.push('/login')}
                className="p-0 h-auto"
              >
                立即登录
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
