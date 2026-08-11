'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { cn } from '@/lib/utils';
import {
  Users,
  UserPlus,
  ChevronDown,
  ChevronRight,
  Wallet,
  FileText,
  ShoppingCart,
  UserCircle,
  Copy,
  CheckCircle2,
} from 'lucide-react';

interface TreeNode {
  id: string;
  name: string;
  email: string;
  parent_id: string | null;
  total_orders: number;
  total_sales: string;
  team_count: number;
  created_at: string;
  agent_levels: { name: string } | null;
  children: TreeNode[];
}

export default function TeamPage() {
  const { profile, getAuthHeaders } = useAuth();
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  const fetchTree = async () => {
    try {
      const res = await fetch(`/api/team-tree?parent_id=${profile?.id}`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setTree(data.tree || []);
      }
    } catch (err) {
      console.error('Failed to fetch team tree:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.id) {
      fetchTree();
    }
  }, [profile?.id, getAuthHeaders]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCopyInvite = () => {
    if (profile?.invite_code) {
      navigator.clipboard.writeText(profile.invite_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded.has(node.id);

    return (
      <div key={node.id} style={{ marginLeft: depth * 12 }}>
        <div
          className="bg-white rounded-xl p-3 flex items-center gap-3"
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
        >
          {hasChildren ? (
            <button onClick={() => toggleExpand(node.id)} className="text-gray-400 hover:text-gray-600">
              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-4" />
          )}
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-medium text-[#1677FF]">
              {node.name.charAt(0)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-gray-900 truncate">{node.name}</p>
              {node.agent_levels && (
                <span className="px-2 py-0.5 bg-blue-50 text-[#1677FF] text-xs rounded-full">
                  {node.agent_levels.name}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{node.email}</p>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-gray-500">{node.total_orders}单</p>
            <p className="text-sm font-bold text-red-600 font-mono">
              ¥{(parseFloat(node.total_sales || '0') || 0).toFixed(0)}
            </p>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-2 space-y-2 border-l-2 border-gray-200 ml-5 pl-3">
            {node.children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // 统计数据
  const totalTeamSize = tree.reduce((sum, node) => sum + 1 + countAllChildren(node), 0);
  const todayNew = 0; // 需要从 API 获取
  const directCount = tree.length;

  function countAllChildren(node: TreeNode): number {
    if (!node.children || node.children.length === 0) return 0;
    return node.children.reduce((sum, child) => sum + 1 + countAllChildren(child), 0);
  }

  return (
    <div className="min-h-screen bg-[#F0F5FF] pb-20">
      {/* 顶部数据概览 */}
      <div className="bg-gradient-to-r from-[#1890FF] to-[#1677FF] px-4 pt-6 pb-8 text-white">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">{totalTeamSize}</p>
            <p className="text-xs text-white/70 mt-1">团队总人数</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">{todayNew}</p>
            <p className="text-xs text-white/70 mt-1">今日新增</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold font-mono">{directCount}</p>
            <p className="text-xs text-white/70 mt-1">直推人数</p>
          </div>
        </div>
      </div>

      {/* 团队列表 */}
      <div className="px-4 -mt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1677FF]"></div>
          </div>
        ) : tree.length === 0 ? (
          <div
            className="bg-white rounded-xl p-8 text-center"
            style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
          >
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">暂无团队成员</p>
            <p className="text-sm text-gray-400 mt-1">分享您的邀请码给好友</p>
            <div className="mt-4 p-3 bg-blue-50 rounded-lg inline-block">
              <p className="text-xs text-gray-500">我的邀请码</p>
              <p className="text-lg font-mono font-bold text-[#1677FF]">{profile?.invite_code || '-'}</p>
            </div>
          </div>
        ) : (
          tree.map((node) => renderNode(node))
        )}
      </div>

      {/* 悬浮邀请按钮 */}
      <button
        onClick={handleCopyInvite}
        className="fixed bottom-24 right-4 w-14 h-14 bg-[#1677FF] rounded-full flex items-center justify-center text-white shadow-lg hover:bg-[#1565E0] transition-colors z-40"
        style={{ boxShadow: '0 4px 12px rgba(22,119,255,0.4)' }}
      >
        {copied ? <CheckCircle2 className="w-6 h-6" /> : <UserPlus className="w-6 h-6" />}
      </button>

      {/* 底部 Tab 栏 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-2 py-2 flex justify-around items-center z-50">
        <a href="/agent" className="flex flex-col items-center gap-1 px-3 py-1">
          <Wallet className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">首页</span>
        </a>
        <a href="/agent/orders" className="flex flex-col items-center gap-1 px-3 py-1">
          <FileText className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">订单</span>
        </a>
        <a href="/agent/products" className="flex flex-col items-center gap-1 px-3 py-1">
          <ShoppingCart className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">商品</span>
        </a>
        <a href="/agent/team" className="flex flex-col items-center gap-1 px-3 py-1">
          <Users className="w-5 h-5 text-[#1677FF]" />
          <span className="text-xs text-[#1677FF] font-medium">代理</span>
        </a>
        <a href="/agent/profile" className="flex flex-col items-center gap-1 px-3 py-1">
          <UserCircle className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-400">我的</span>
        </a>
      </div>
    </div>
  );
}
