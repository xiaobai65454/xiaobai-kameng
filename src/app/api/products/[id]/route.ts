import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';

/**
 * Transform database product to frontend format.
 * Handles both schema-correct fields and legacy column names.
 */
function transformProduct(dbProduct: Record<string, unknown>): Record<string, unknown> {
  return {
    ...dbProduct,
    general_data: dbProduct.general_data ?? dbProduct.data_amount ?? 0,
    call_minutes: dbProduct.call_minutes ?? dbProduct.talk_time ?? 0,
    commission_amount: dbProduct.commission_amount ?? dbProduct.commission ?? '0',
    monthly_rent: dbProduct.monthly_rent ?? dbProduct.price ?? '0',
  };
}

/**
 * Transform and sanitize frontend data to database format.
 * Only allows fields that exist in the schema.
 */
function transformToDatabase(frontendData: Record<string, unknown>): Record<string, unknown> {
  const allowedFields = [
    'name', 'description', 'operator', 'monthly_rent',
    'general_data', 'directed_data', 'call_minutes', 'validity_months',
    'commission_amount', 'age_limit', 'area_limit',
    'status', 'sort_order', 'tags', 'image_url', 'promo_url',
  ];

  const dbData: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (frontendData[field] !== undefined) {
      dbData[field] = frontendData[field];
    }
  }

  // Handle legacy field names
  if (frontendData.data_amount !== undefined && dbData.general_data === undefined) {
    dbData.general_data = frontendData.data_amount;
  }
  if (frontendData.talk_time !== undefined && dbData.call_minutes === undefined) {
    dbData.call_minutes = frontendData.talk_time;
  }
  if (frontendData.price !== undefined && dbData.monthly_rent === undefined) {
    dbData.monthly_rent = frontendData.price;
  }
  if (frontendData.commission !== undefined && dbData.commission_amount === undefined) {
    dbData.commission_amount = frontendData.commission;
  }

  return dbData;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { client, error } = await requireAdmin(_req);
    if (error) return error;

    const { data: product, error: queryError } = await client
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (queryError) throw new Error(queryError.message);

    return NextResponse.json({ product: product ? transformProduct(product) : null });
  } catch (error) {
    console.error('Get product error:', error);
    return NextResponse.json({ error: '获取商品详情失败' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { client, error } = await requireAdmin(req);
    if (error) return error;

    const body = await req.json();
    const dbData = transformToDatabase(body);

    const { data, error: updateError } = await client
      .from('products')
      .update({ ...dbData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ product: transformProduct(data) });
  } catch (error) {
    console.error('Update product error:', error);
    return NextResponse.json({ error: '更新商品失败' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { client, error } = await requireAdmin(req);
    if (error) return error;

    // Soft delete: set status to 'inactive' instead of hard delete
    const { error: updateError } = await client
      .from('products')
      .update({ status: 'inactive', updated_at: new Date().toISOString() })
      .eq('id', id);
    if (updateError) throw new Error(updateError.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete product error:', error);
    return NextResponse.json({ error: '删除商品失败' }, { status: 500 });
  }
}
