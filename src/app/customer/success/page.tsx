'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function SuccessPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#f5f5f5] flex flex-col items-center justify-center px-4">
      <div className="bg-white rounded-xl p-8 shadow-sm w-full max-w-sm text-center">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="h-8 w-8 text-green-500" />
        </div>

        <h1 className="text-xl font-bold text-gray-900 mb-2">提交成功</h1>
        <p className="text-gray-500 mb-6">您的订单已提交成功，请等待审核</p>

        <div className="space-y-3">
          <Button
            onClick={() => router.push('/customer')}
            className="w-full bg-[#0d6efd] hover:bg-[#0d6efd]/90 text-white h-12"
          >
            继续选购
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="w-full h-12"
          >
            <Home className="h-4 w-4 mr-2" />
            返回首页
          </Button>
        </div>
      </div>

      <p className="text-gray-400 text-sm mt-8">审核通过后，号卡将免费邮寄到您填写的地址</p>
    </div>
  );
}
