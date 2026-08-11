import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { authenticate, requireAdmin, clampPagination } from '@/lib/auth-middleware';

/**
 * Transform database product to frontend format.
 * Maps DB column names to the names the frontend expects.
 * This is the single source of truth for DB->frontend transformation.
 */
function transformProduct(dbProduct: Record<string, unknown>): Record<string, unknown> {
  return {
    ...dbProduct,
    // DB uses general_data/call_minutes which match schema.ts, so no mapping needed
    // But some existing DBs may have legacy column names - handle both
    general_data: dbProduct.general_data ?? dbProduct.data_amount ?? 0,
    call_minutes: dbProduct.call_minutes ?? dbProduct.talk_time ?? 0,
    commission_amount: dbProduct.commission_amount ?? dbProduct.commission ?? '0',
    monthly_rent: dbProduct.monthly_rent ?? dbProduct.price ?? '0',
  };
}

/**
 * Transform frontend product data to database format.
 * Filters out non-existent fields and maps frontend names to DB column names.
 */
function transformToDatabase(frontendData: Record<string, unknown>): Record<string, unknown> {
  const dbData: Record<string, unknown> = {};

  // Only allow fields that exist in the schema
  const allowedFields: Record<string, string> = {
    name: 'name',
    description: 'description',
    operator: 'operator',
    monthly_rent: 'monthly_rent',
    general_data: 'general_data',
    directed_data: 'directed_data',
    call_minutes: 'call_minutes',
    validity_months: 'validity_months',
    commission_amount: 'commission_amount',
    age_limit: 'age_limit',
    area_limit: 'area_limit',
    status: 'status',
    sort_order: 'sort_order',
    tags: 'tags',
    image_url: 'image_url',
    promo_url: 'promo_url',
  };

  for (const [frontendKey, dbKey] of Object.entries(allowedFields)) {
    if (frontendData[frontendKey] !== undefined) {
      dbData[dbKey] = frontendData[frontendKey];
    }
  }

  // Handle legacy field names that some frontends may still send
  if (frontendData.data_amount !== undefined) {
    dbData.general_data = frontendData.data_amount;
  }
  if (frontendData.talk_time !== undefined) {
    dbData.call_minutes = frontendData.talk_time;
  }
  if (frontendData.price !== undefined && frontendData.monthly_rent === undefined) {
    dbData.monthly_rent = frontendData.price;
  }
  if (frontendData.commission !== undefined && frontendData.commission_amount === undefined) {
    dbData.commission_amount = frontendData.commission;
  }

  return dbData;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const { page, pageSize } = clampPagination(searchParams.get('page'), searchParams.get('pageSize'));
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const operator = searchParams.get('operator');

    const client = getSupabaseClient();
    let query = client
      .from('products')
      .select('*', { count: 'exact' })
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1);

    if (status) query = query.eq('status', status);
    if (operator) query = query.eq('operator', operator);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);

    const products = (data || []).map(transformProduct);

    return NextResponse.json({ products, total: count });
  } catch (error) {
    console.error('Get products error:', error);
    return NextResponse.json({ error: '获取商品列表失败' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { client, error } = await requireAdmin(req);
    if (error) return error;

    const body = await req.json();

    // Validate required fields
    if (!body.name) {
      return NextResponse.json({ error: '请输入商品名称' }, { status: 400 });
    }

    // Transform and sanitize input
    const dbData = transformToDatabase(body);

    const { data, error: insertError } = await client
      .from('products')
      .insert(dbData)
      .select()
      .single();
    if (insertError) throw new Error(insertError.message);

    return NextResponse.json({ product: transformProduct(data) });
  } catch (error) {
    console.error('Create product error:', error);
    return NextResponse.json({ error: '创建商品失败' }, { status: 500 });
  }
}
