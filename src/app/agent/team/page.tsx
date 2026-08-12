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
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-semibold text-[#000]">我的团队</h1>
        <p className="text-sm text-[#999] mt-1">管理您的代理团队和分销网络</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#0C1A2E] rounded-xl p-5 text-white">
          <p className="text-[11px] text-white/40">团队总人数</p>
          <p className="text-2xl font-bold font-mono mt-1">{totalTeamSize}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[#E5E7EB]">
          <p className="text-[11px] text-[#999]">今日新增</p>
          <p className="text-2xl font-bold font-mono text-[#3B6D11] mt-1">{todayNew}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-[#E5E7EB]">
          <p className="text-[11px] text-[#999]">直推人数</p>
          <p className="text-2xl font-bold font-mono text-[#1677FF] mt-1">{directCount}</p>
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

      {/* 邀请按钮 */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleCopyInvite}
          className="px-6 py-3 bg-[#1677FF] rounded-lg flex items-center gap-2 text-white hover:bg-[#185FA5] transition-colors"
        >
          {copied ? <CheckCircle2 className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
          <span className="text-sm font-medium">{copied ? '已复制邀请码' : '复制邀请码'}</span>
        </button>
      </div>
    </div>
  );
}
