'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Cog, Save, RefreshCw, Shield, Users, ScrollText } from 'lucide-react';

interface SystemConfig {
  id: string;
  config_key: string;
  config_value: string;
  config_type: string;
  description: string;
}

export default function SystemPage() {
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [configs, setConfigs] = useState<SystemConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'config' | 'logs'>('config');
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    loadConfigs();
    loadLogs();
  }, []);

  const loadConfigs = async () => {
    try {
      const res = await fetch('/api/system-config', { headers: await getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setConfigs(data.data || []);
      }
    } catch (err) {
      console.error('加载配置失败', err);
    } finally {
      setLoading(false);
    }
  };

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/operation-logs?limit=50', { headers: await getAuthHeaders() });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error('加载日志失败', err);
    }
  };

  const handleSave = async (config: SystemConfig) => {
    try {
      const res = await fetch('/api/system-config', {
        method: 'PUT',
        headers: { ...(await getAuthHeaders()), 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: config.config_key, value: config.config_value }),
      });
      if (res.ok) {
        toast({ title: '保存成功', description: `${config.config_key} 已更新` });
      } else {
        toast({ title: '保存失败', description: '操作失败，请重试', variant: 'destructive' });
      }
    } catch (err) {
      toast({ title: '保存失败', description: '网络错误', variant: 'destructive' });
    }
  };

  const configGroups = [
    {
      title: '系统基础配置',
      icon: Cog,
      configs: configs.filter(c => ['site_name', 'site_logo', 'site_description', 'contact_phone', 'contact_email'].includes(c.config_key)),
    },
    {
      title: '佣金配置',
      icon: Shield,
      configs: configs.filter(c => ['commission_rate_1', 'commission_rate_2', 'commission_rate_3', 'min_withdraw', 'withdraw_fee'].includes(c.config_key)),
    },
    {
      title: '其他配置',
      icon: ScrollText,
      configs: configs.filter(c => !['site_name', 'site_logo', 'site_description', 'contact_phone', 'contact_email', 'commission_rate_1', 'commission_rate_2', 'commission_rate_3', 'min_withdraw', 'withdraw_fee'].includes(c.config_key)),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1677FF]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Cog className="h-6 w-6 text-[#1677FF]" />
        <div>
          <h1 className="text-xl font-bold">系统管理</h1>
          <p className="text-sm text-[#999]">系统配置、操作日志</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white rounded-xl p-1 w-fit">
        {[
          { key: 'config', label: '系统配置', icon: Cog },
          { key: 'logs', label: '操作日志', icon: ScrollText },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[#1677FF] text-white shadow'
                : 'text-[#666] hover:text-[#333]'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'config' ? (
        <div className="space-y-6">
          {configs.length === 0 ? (
            <Card className="p-12 text-center">
              <Cog className="h-12 w-12 text-[#ccc] mx-auto mb-4" />
              <p className="text-[#999]">暂无配置项</p>
              <p className="text-sm text-[#ccc] mt-1">可手动添加系统配置项</p>
            </Card>
          ) : (
            configGroups.map((group) => {
              if (group.configs.length === 0) return null;
              return (
                <Card key={group.title} className="p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <group.icon className="h-5 w-5 text-[#1677FF]" />
                    <h2 className="font-semibold">{group.title}</h2>
                  </div>
                  <div className="space-y-3">
                    {group.configs.map((config) => (
                      <div key={config.id} className="flex items-center gap-3">
                        <label className="w-36 text-sm text-[#666] shrink-0">{config.config_key}</label>
                        <Input
                          value={config.config_value || ''}
                          onChange={(e) => {
                            setConfigs(prev =>
                              prev.map(c => c.id === config.id ? { ...c, config_value: e.target.value } : c)
                            );
                          }}
                          className="flex-1"
                        />
                        <span className="text-xs text-[#ccc] w-24 shrink-0">{config.description || ''}</span>
                        <Button
                          size="sm"
                          onClick={() => handleSave(config)}
                        >
                          <Save className="h-3 w-3 mr-1" />
                          保存
                        </Button>
                      </div>
                    ))}
                  </div>
                </Card>
              );
            })
          )}

          <Card className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-[#1677FF]" />
                <span className="font-medium text-sm">初始化默认配置</span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={async () => {
                  try {
                    const res = await fetch('/api/system-config/init', {
                      method: 'POST',
                      headers: await getAuthHeaders(),
                    });
                    if (res.ok) {
                      toast({ title: '初始化成功' });
                      loadConfigs();
                    }
                  } catch (err) {
                    toast({ title: '初始化失败', variant: 'destructive' });
                  }
                }}
              >
                初始化配置
              </Button>
            </div>
            <p className="text-xs text-[#999]">如果系统配置项缺失，点击初始化将自动创建默认配置项</p>
          </Card>
        </div>
      ) : (
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#fafafa] text-left">
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">用户</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">操作</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">模块</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">详情</th>
                  <th className="px-4 py-3 text-xs font-medium text-[#999]">时间</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0f0f0]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-12 text-center text-[#999]">
                      <ScrollText className="h-8 w-8 mx-auto mb-2 text-[#ccc]" />
                      暂无操作日志
                    </td>
                  </tr>
                ) : (
                  logs.map((log: any) => (
                    <tr key={log.id} className="hover:bg-[#fafafa]">
                      <td className="px-4 py-3 text-sm">{log.user_name || '-'}</td>
                      <td className="px-4 py-3 text-sm">{log.action}</td>
                      <td className="px-4 py-3 text-sm text-[#666]">{log.module || '-'}</td>
                      <td className="px-4 py-3 text-sm text-[#666] max-w-[200px] truncate">{log.detail || '-'}</td>
                      <td className="px-4 py-3 text-sm text-[#999]">{new Date(log.created_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}