'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Search, Edit, Users, ToggleLeft, ToggleRight, Eye } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: string;
  invite_code: string;
  parent_id: string | null;
  level_id: string | null;
  total_sales: string;
  total_orders: number;
  team_count: number;
  balance: string;
  is_active: boolean;
  created_at: string;
  agent_levels: { name: string; level: number } | null;
}

interface Level {
  id: string;
  name: string;
  level: number;
}

export default function AgentsPage() {
  const { session } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [form, setForm] = useState({ level_id: '', is_active: true });

  const fetchAgents = async () => {
    if (!session) return;
    try {
      const params = new URLSearchParams({ search });
      const res = await fetch(`/api/agents?${params}`, {
        headers: { 'x-session': session.access_token },
      });
      if (res.ok) {
        const data = await res.json();
        setAgents(data.agents || []);
      }
    } catch (err) {
      console.error('Failed to fetch agents:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/agent-levels', {
        headers: { 'x-session': session.access_token },
      });
      if (res.ok) {
        const data = await res.json();
        setLevels(data.levels || []);
      }
    } catch (err) {
      console.error('Failed to fetch levels:', err);
    }
  };

  useEffect(() => {
    fetchAgents();
    fetchLevels();
  }, [search, session]);

  const handleSave = async () => {
    if (!editingAgent) return;
    try {
      const res = await fetch(`/api/agents/${editingAgent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDialogOpen(false);
        fetchAgents();
      }
    } catch (err) {
      console.error('Failed to update agent:', err);
    }
  };

  const handleToggleActive = async (agent: Agent) => {
    try {
      const res = await fetch(`/api/agents/${agent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !agent.is_active }),
      });
      if (res.ok) fetchAgents();
    } catch (err) {
      console.error('Failed to toggle agent status:', err);
    }
  };

  const openEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setForm({ level_id: agent.level_id || '', is_active: agent.is_active });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">代理管理</h1>
        <p className="text-slate-500 mt-1">查看和管理所有代理信息</p>
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="搜索代理姓名或邮箱..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-medium text-slate-500">姓名</th>
                    <th className="text-left py-3 px-4 font-medium text-slate-500">邮箱</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">等级</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">团队</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">销售额</th>
                    <th className="text-right py-3 px-4 font-medium text-slate-500">余额</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">状态</th>
                    <th className="text-center py-3 px-4 font-medium text-slate-500">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium">{agent.name}</td>
                      <td className="py-3 px-4 text-slate-500">{agent.email}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                          {agent.agent_levels?.name || '未设置'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">{agent.team_count}</td>
                      <td className="py-3 px-4 text-right font-mono">¥{parseFloat(agent.total_sales).toFixed(2)}</td>
                      <td className="py-3 px-4 text-right font-mono">¥{parseFloat(agent.balance).toFixed(2)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          agent.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {agent.is_active ? '正常' : '禁用'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleActive(agent)}
                            title={agent.is_active ? '禁用' : '启用'}
                          >
                            {agent.is_active
                              ? <ToggleRight className="h-4 w-4 text-green-600" />
                              : <ToggleLeft className="h-4 w-4 text-red-400" />
                            }
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEdit(agent)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {agents.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">暂无代理</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑代理</DialogTitle>
          </DialogHeader>
          {editingAgent && (
            <div className="space-y-4">
              <div className="text-sm text-slate-500">
                <p>姓名：{editingAgent.name}</p>
                <p>邀请码：{editingAgent.invite_code}</p>
              </div>
              <div className="space-y-2">
                <Label>代理等级</Label>
                <select
                  className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm"
                  value={form.level_id}
                  onChange={(e) => setForm({ ...form, level_id: e.target.value })}
                >
                  <option value="">未设置</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>{level.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <select
                  className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm"
                  value={form.is_active ? 'true' : 'false'}
                  onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}
                >
                  <option value="true">正常</option>
                  <option value="false">禁用</option>
                </select>
              </div>
              <Button onClick={handleSave} className="w-full">保存修改</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
