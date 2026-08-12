import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';

// 公开可读取的配置项白名单（不含敏感信息）
const PUBLIC_CONFIG_KEYS = [
  'site_name',
  'site_description',
  'customer_service_wechat',
  'customer_service_url',
  'order_query_url',
  'logistics_query_url',
  'shop_rating',
  'shop_badge',
  'banner_title',
  'banner_subtitle',
  'notice_items',
  'auth_badge_1',
  'auth_badge_2',
  'auth_badge_3',
  'auth_badge_4',
];

export async function GET() {
  try {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('system_config')
      .select('config_key, config_value')
      .in('config_key', PUBLIC_CONFIG_KEYS);

    if (error) throw new Error(error.message);

    // 转为 key-value 对象方便前端使用
    const configMap: Record<string, string> = {};
    for (const row of data || []) {
      configMap[row.config_key] = row.config_value || '';
    }

    return NextResponse.json({ data: configMap });
  } catch (error) {
    console.error('Get public config error:', error);
    return NextResponse.json({ error: '获取配置失败' }, { status: 500 });
  }
}
