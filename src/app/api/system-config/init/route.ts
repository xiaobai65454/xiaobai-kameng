import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const defaultConfigs = [
  { config_key: 'site_name', config_value: '小白卡盟', description: '网站名称' },
  { config_key: 'site_description', config_value: '专业号卡分销平台', description: '网站描述' },
  { config_key: 'contact_phone', config_value: '', description: '联系电话' },
  { config_key: 'contact_email', config_value: '', description: '联系邮箱' },
  { config_key: 'commission_rate_1', config_value: '30', description: '一级佣金比例(%)' },
  { config_key: 'commission_rate_2', config_value: '15', description: '二级佣金比例(%)' },
  { config_key: 'commission_rate_3', config_value: '5', description: '三级佣金比例(%)' },
  { config_key: 'min_withdraw', config_value: '10', description: '最低提现金额' },
  { config_key: 'withdraw_fee', config_value: '0', description: '提现手续费(%)' },
];

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();

    for (const config of defaultConfigs) {
      const { data: existing } = await supabase
        .from('system_config')
        .select('id')
        .eq('config_key', config.config_key)
        .single();

      if (!existing) {
        await supabase.from('system_config').insert(config);
      }
    }

    return NextResponse.json({ success: true, message: '配置初始化完成' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}