'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Level {
  id: string;
  name: string;
  level: number;
  commission_rate: string;
  min_orders: number;
  min_team_size: number;
  min_sales: string;
}

export default function LevelsPage() {
  const { session } = useAuth();
  const [levels, setLevels] = useState<Level[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const [form, setForm] = useState({
    name: '', level: 1, commission_rate: '0', min_orders: 0, min_team_size: 0, min_sales: '0',
  });

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLevels();
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingLevel ? `/api/agent-levels/${editingLevel.id}` : '/api/agent-levels';
      const method = editingLevel ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setDialogOpen(false);
        setEditingLevel(null);
        fetchLevels();
      }
    } catch (err) {
      console.error('Failed to save level:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除该等级吗？')) return;
    try {
      const res = await fetch(`/api/agent-levels/${id}`, { method: 'DELETE' });
      if (res.ok) fetchLevels();
    } catch (err) {
      console.error('Failed to delete level:', err);
    }
  };

  const openEdit = (level: Level) => {
    setEditingLevel(level);
    setForm({
      name: level.name,
      level: level.level,
      commission_rate: level.commission_rate,
      min_orders: level.min_orders,
      min_team_size: level.min_team_size,
      min_sales: level.min_sales,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">等级管理</h1>
          <p className="text-slate-500 mt-1">配置代理等级和升级条件</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingLevel(null); }}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm({ name: '', level: 1, commission_rate: '0', min_orders: 0, min_team_size: 0, min_sales: '0' })}>
              <Plus className="h-4 w-4 mr-2" />
              添加等级
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingLevel ? '编辑等级' : '添加等级'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>等级名称</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>等级序号</Label>
                  <Input type="number" value={form.level} onChange={(e) => setForm({ ...form, level: parseInt(e.target.value) })} required />
                </div>
                <div className="space-y-2">
                  <Label>佣金比例(%)</Label>
                  <Input type="number" step="0.01" value={form.commission_rate} onChange={(e) => setForm({ ...form, commission_rate: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>最低订单数</Label>
                  <Input type="number" value={form.min_orders} onChange={(e) => setForm({ ...form, min_orders: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>最低团队人数</Label>
                  <Input type="number" value={form.min_team_size} onChange={(e) => setForm({ ...form, min_team_size: parseInt(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>最低销售额</Label>
                  <Input type="number" step="0.01" value={form.min_sales} onChange={(e) => setForm({ ...form, min_sales: e.target.value })} />
                </div>
              </div>
              <Button type="submit" className="w-full">{editingLevel ? '保存修改' : '添加等级'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {levels.map((level) => (
          <Card key={level.id} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{level.name}</CardTitle>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">Lv.{level.level}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">佣金比例</span>
                  <span className="font-medium text-green-600">{level.commission_rate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">最低订单</span>
                  <span>{level.min_orders} 单</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">最低团队</span>
                  <span>{level.min_team_size} 人</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">最低销售额</span>
                  <span>¥{parseFloat(level.min_sales).toFixed(2)}</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => openEdit(level)}>
                  <Edit className="h-3 w-3 mr-1" />
                  编辑
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(level.id)}>
                  <Trash2 className="h-3 w-3 text-red-500" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
