import { redirect } from 'next/navigation';

/**
 * /shop 页面已整合到 /customer 用户端页面
 * 统一使用 /customer 作为用户端商城入口
 */
export default function ShopPage() {
  redirect('/customer');
}
