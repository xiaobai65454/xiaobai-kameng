'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Copy, Link, Users, Plus, CheckCircle } from 'lucide-react';

interface AgentLevel {
  id: string;
  name: string;
}

interface Invitation {
  id: string;
  invite_code: string;
  level_id: string | null;
  note: string | null;
  created_at: string;
  invited_profile?: {
    id: string;
    name: string;
    email: string;
    level_id: string | null;
    agent_levels?: { name: string };
  } | null;
}

export default function InvitePage() {
  const { profile, getAuthHeaders } = useAuth();
  const [levels, setLevels] = useState<AgentLevel[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  // 生成邀请表单
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [note, setNote] = useState('');
  const [generatedLink, setGeneratedLink] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchLevels();
    fetchInvitations();
  }, []);

  const fetchLevels = async () => {
    try {
      const res = await fetch('/api/agent-levels');
      if (res.ok) {
        const data = await res.json();
        setLevels(data.levels || []);
      }
    } catch (error) {
      console.error('Fetch levels error:', error);
    }
  };

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/invitations', {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setInvitations(data.invitations || []);
      }
    } catch (error) {
      console.error('Fetch invitations error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteLink = async () => {
    if (!profile?.invite_code) {
      setError('无法获取邀请码，请重新登录');
      return;
    }
    
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          level_id: selectedLevel || null,
          note: note || null,
        }),
      });

      const data = await res.json();
      
      if (res.ok) {
        const inviteCode = data.invitation.invite_code;
        const baseUrl = window.location.origin;
        const link = `${baseUrl}/register?invite=${inviteCode}`;
        setGeneratedLink(link);
        fetchInvitations(); // 刷新列表
      } else {
        setError(data.error || '生成邀请链接失败');
      }
    } catch (error) {
      console.error('Generate invite error:', error);
      setError('网络错误，请稍后重试');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (error) {
      console.error('Copy error:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6" />
          邀请管理
        </h1>
        <p className="text-muted-foreground">生成邀请链接，邀请新代理加入您的团队</p>
      </div>

      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate">生成邀请链接</TabsTrigger>
          <TabsTrigger value="history">邀请记录</TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>创建邀请链接</CardTitle>
              <CardDescription>设置邀请等级和备注，生成专属邀请链接</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>邀请等级</Label>
                <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择代理等级（可选）" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">不设置等级</SelectItem>
                    {levels.map((level) => (
                      <SelectItem key={level.id} value={level.id}>
                        {level.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  被邀请人注册后将自动设置为该等级
                </p>
              </div>

              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea
                  placeholder="添加备注信息（可选）"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  maxLength={200}
                />
              </div>

              <Button 
                onClick={generateInviteLink} 
                className="w-full"
                disabled={generating}
              >
                <Plus className="h-4 w-4 mr-2" />
                {generating ? '生成中...' : '生成邀请链接'}
              </Button>

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-900">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {generatedLink && (
                <div className="space-y-2 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-900">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">链接已生成</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={generatedLink}
                      readOnly
                      className="flex-1 font-mono text-sm"
                    />
                    <Button
                      size="sm"
                      onClick={() => copyToClipboard(generatedLink, 'generated')}
                      variant="outline"
                    >
                      {copied === 'generated' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    将此链接发送给被邀请人，点击后即可注册成为您的下级代理
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>我的邀请码</CardTitle>
              <CardDescription>您的专属邀请码</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-lg text-center">
                  {profile?.invite_code || '-'}
                </div>
                <Button
                  size="sm"
                  onClick={() => copyToClipboard(profile?.invite_code || '', 'code')}
                  variant="outline"
                >
                  {copied === 'code' ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>邀请记录</CardTitle>
              <CardDescription>您创建的所有邀请链接</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Link className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>暂无邀请记录</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invitations.map((inv) => {
                    const link = `${window.location.origin}/register?invite=${inv.invite_code}`;
                    return (
                      <div
                        key={inv.id}
                        className="p-4 border rounded-lg space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">
                              {inv.invited_profile ? '已使用' : '待使用'}
                            </Badge>
                            {inv.level_id && (
                              <Badge variant="secondary">
                                {inv.invited_profile?.agent_levels?.name || '已设置等级'}
                              </Badge>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(inv.created_at)}
                          </span>
                        </div>
                        
                        {inv.invited_profile && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">被邀请人：</span>
                            <span className="font-medium">{inv.invited_profile.name}</span>
                            <span className="text-muted-foreground ml-2">({inv.invited_profile.email})</span>
                          </div>
                        )}

                        {inv.note && (
                          <div className="text-sm text-muted-foreground">
                            备注：{inv.note}
                          </div>
                        )}

                        <div className="flex items-center gap-2">
                          <Input
                            value={link}
                            readOnly
                            className="flex-1 font-mono text-xs"
                          />
                          <Button
                            size="sm"
                            onClick={() => copyToClipboard(link, inv.id)}
                            variant="outline"
                          >
                            {copied === inv.id ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
