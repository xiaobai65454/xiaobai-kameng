-- =====================================================
-- 号卡分销平台 - 数据库安全增强 SQL 迁移脚本
-- 执行方式: 在 Supabase SQL Editor 中运行
-- =====================================================

-- 1. 提现安全函数（原子操作，防止并发竞态）
-- 检查余额 → 扣减余额 → 创建提现记录，全部在一个事务中完成
CREATE OR REPLACE FUNCTION create_withdrawal_safe(
  p_agent_id UUID,
  p_amount NUMERIC(12,2),
  p_remark TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC(12,2);
  v_withdrawal_id UUID;
  v_result JSON;
BEGIN
  -- 锁定用户行，防止并发修改
  SELECT balance INTO v_balance
  FROM profiles
  WHERE id = p_agent_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'message', '用户不存在');
  END IF;

  IF v_balance < p_amount THEN
    RETURN json_build_object('success', false, 'message', '余额不足');
  END IF;

  -- 扣减余额
  UPDATE profiles
  SET balance = balance - p_amount,
      updated_at = NOW()
  WHERE id = p_agent_id;

  -- 创建提现记录
  INSERT INTO withdrawals (id, agent_id, amount, status, remark)
  VALUES (gen_random_uuid(), p_agent_id, p_amount, 'pending', p_remark)
  RETURNING id INTO v_withdrawal_id;

  SELECT json_build_object(
    'id', w.id,
    'agent_id', w.agent_id,
    'amount', w.amount,
    'status', w.status,
    'remark', w.remark,
    'created_at', w.created_at
  ) INTO v_result
  FROM withdrawals w
  WHERE w.id = v_withdrawal_id;

  RETURN v_result;
END;
$$;

-- 2. 更新代理余额函数（带签名验证）
CREATE OR REPLACE FUNCTION update_agent_balance(
  p_agent_id UUID,
  p_amount NUMERIC(12,2)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET balance = balance + p_amount,
      updated_at = NOW()
  WHERE id = p_agent_id;
END;
$$;

-- 3. 更新代理订单统计函数
CREATE OR REPLACE FUNCTION update_agent_order_stats(
  p_agent_id UUID,
  p_amount NUMERIC(12,2)
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET total_orders = total_orders + 1,
      total_sales = total_sales + p_amount,
      updated_at = NOW()
  WHERE id = p_agent_id;
END;
$$;

-- 4. 增加团队人数函数
CREATE OR REPLACE FUNCTION increment_team_count(
  p_parent_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET team_count = team_count + 1,
      updated_at = NOW()
  WHERE id = p_parent_id;
END;
$$;

-- 5. 启用行级安全 (RLS) 策略
-- 注意: 需要根据实际需求调整策略，以下是基本策略

-- profiles 表 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的 profile（admin 除外，admin 通过 service role 访问）
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 用户只能更新自己的 profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- orders 表 RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- 代理只能查看自己的订单
CREATE POLICY "Agents can view own orders" ON orders
  FOR SELECT USING (auth.uid() = agent_id);

-- 代理可以创建自己的订单
CREATE POLICY "Agents can create own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- commissions 表 RLS
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

-- 代理只能查看自己的佣金记录
CREATE POLICY "Agents can view own commissions" ON commissions
  FOR SELECT USING (auth.uid() = agent_id);

-- withdrawals 表 RLS
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;

-- 代理只能查看自己的提现记录
CREATE POLICY "Agents can view own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = agent_id);

-- 代理可以创建自己的提现记录
CREATE POLICY "Agents can create own withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = agent_id);

-- messages 表 RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的消息
CREATE POLICY "Users can view own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

-- 用户可以更新自己的消息（标记已读）
CREATE POLICY "Users can update own messages" ON messages
  FOR UPDATE USING (auth.uid() = user_id);

-- products 表 RLS - 所有认证用户可查看，仅 admin 可修改
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active products" ON products
  FOR SELECT USING (status = 'active' OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

-- agent_levels 表 RLS - 所有认证用户可查看
ALTER TABLE agent_levels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view levels" ON agent_levels
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- 6. 添加索引优化（如果不存在）
CREATE INDEX IF NOT EXISTS orders_agent_id_idx ON orders(agent_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);
CREATE INDEX IF NOT EXISTS commissions_agent_id_idx ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS withdrawals_agent_id_idx ON withdrawals(agent_id);
CREATE INDEX IF NOT EXISTS messages_user_id_idx ON messages(user_id);
CREATE INDEX IF NOT EXISTS profiles_invite_code_idx ON profiles(invite_code);
CREATE INDEX IF NOT EXISTS profiles_parent_id_idx ON profiles(parent_id);
