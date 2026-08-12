import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

const defaultConfigs = [
  // 基础配置
  { config_key: 'site_name', config_value: '小白卡盟', description: '网站名称' },
  { config_key: 'site_description', config_value: '专业号卡分销平台', description: '网站描述' },
  { config_key: 'contact_phone', config_value: '', description: '联系电话' },
  { config_key: 'contact_email', config_value: '', description: '联系邮箱' },
  // 佣金配置
  { config_key: 'commission_rate_1', config_value: '30', description: '一级佣金比例(%)' },
  { config_key: 'commission_rate_2', config_value: '15', description: '二级佣金比例(%)' },
  { config_key: 'commission_rate_3', config_value: '5', description: '三级佣金比例(%)' },
  { config_key: 'min_withdraw', config_value: '10', description: '最低提现金额' },
  { config_key: 'withdraw_fee', config_value: '0', description: '提现手续费(%)' },
  // 用户端链接与内容配置
  { config_key: 'customer_service_wechat', config_value: 'xiaobai-kameng', description: '客服微信号' },
  { config_key: 'customer_service_url', config_value: '', description: '客服跳转链接(填写后点击客服将跳转,留空则显示微信号)' },
  { config_key: 'order_query_url', config_value: '', description: '查单跳转链接(填写后点击查单将跳转,留空则提示输入手机号)' },
  { config_key: 'logistics_query_url', config_value: '', description: '物流查询跳转链接(填写后点击物流将跳转,留空则提示)' },
  { config_key: 'shop_rating', config_value: '4.98', description: '店铺口碑评分' },
  { config_key: 'shop_badge', config_value: '官方正品保障', description: '店铺徽章文字' },
  { config_key: 'banner_title', config_value: '小白卡盟', description: 'Banner主标题' },
  { config_key: 'banner_subtitle', config_value: '四运营商全品类 | 官方授权 | 极速开卡', description: 'Banner副标题' },
  { config_key: 'notice_items', config_value: '官方授权 正品保障 四运营商全覆盖|联通惠派卡限时活动 月租低至9元|支持选号 实名认证 极速开卡|全国发货 免邮到家 售后无忧', description: '公告内容(多条用|分隔)' },
  { config_key: 'auth_badge_1', config_value: '官方授权', description: '认证徽章1' },
  { config_key: 'auth_badge_2', config_value: '实名认证', description: '认证徽章2' },
  { config_key: 'auth_badge_3', config_value: '极速开卡', description: '认证徽章3' },
  { config_key: 'auth_badge_4', config_value: '售后保障', description: '认证徽章4' },
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