'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Search, ToggleLeft, ToggleRight, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  description: string | null;
  operator: string;
  monthly_rent: string;
  general_data: number;
  directed_data: number;
  call_minutes: number;
  validity_months: number;
  commission_amount: string;
  age_limit: string | null;
  area_limit: string | null;
  status: string;
  sort_order: number;
  tags: string | null;
  image_url: string | null;
  promo_url: string | null;
  created_at: string;
}

const operatorMap: Record<string, { name: string; color: string }> = {
  mobile: { name: '中国移动', color: 'bg-green-100 text-green-800' },
  unicom: { name: '中国联通', color: 'bg-red-100 text-red-800' },
  telecom: { name: '中国电信', color: 'bg-blue-100 text-blue-800' },
  broadnet: { name: '中国广电', color: 'bg-purple-100 text-purple-800' },
};

export default function ProductsPage() {
  const { user, getAuthHeaders } = useAuth();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [operatorFilter, setOperatorFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    operator: 'mobile',
    monthly_rent: '',
    general_data: '',
    directed_data: '',
    call_minutes: '',
    validity_months: '12',
    commission_amount: '',
    age_limit: '',
    area_limit: '',
    sort_order: '0',
    tags: '',
    promo_url: '',
    image_url: '',
  });

  const fetchProducts = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (operatorFilter && operatorFilter !== 'all') params.append('operator', operatorFilter);
      
      const res = await fetch(`/api/products?${params.toString()}`, {
        headers: { ...getAuthHeaders() },
      });
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (error) {
      console.error('Fetch products error:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, operatorFilter]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: '上传失败',
        description: '只支持 JPG、PNG、GIF、WebP 格式的图片',
        variant: 'destructive',
      });
      return;
    }

    // 验证文件大小（最大 5MB）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: '上传失败',
        description: '图片大小不能超过 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || '上传失败');
      }

      const data = await res.json();
      setFormData({ ...formData, image_url: data.url });
      toast({
        title: '上传成功',
        description: '图片已上传',
      });
    } catch (error) {
      toast({
        title: '上传失败',
        description: error instanceof Error ? error.message : '图片上传失败',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        monthly_rent: formData.monthly_rent || '0',
        general_data: parseInt(formData.general_data) || 0,
        directed_data: parseInt(formData.directed_data) || 0,
        call_minutes: parseInt(formData.call_minutes) || 0,
        validity_months: parseInt(formData.validity_months) || 12,
        commission_amount: formData.commission_amount || '0',
        sort_order: parseInt(formData.sort_order) || 0,
      };

      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(submitData),
      });

      if (!res.ok) throw new Error('Failed to save product');

      toast({
        title: editingProduct ? '更新成功' : '创建成功',
        description: `号卡产品已${editingProduct ? '更新' : '创建'}`,
      });
      setDialogOpen(false);
      fetchProducts();
    } catch (error) {
      toast({
        title: '操作失败',
        description: '保存产品失败',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个产品吗？')) return;
    try {
      await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      toast({
        title: '删除成功',
        description: '产品已删除',
      });
      fetchProducts();
    } catch (error) {
      toast({
        title: '删除失败',
        description: '删除产品失败',
        variant: 'destructive',
      });
    }
  };

  const handleToggleStatus = async (product: Product) => {
    try {
      await fetch(`/api/products/${product.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status: product.status === 'active' ? 'inactive' : 'active' }),
      });
      toast({
        title: '状态更新成功',
        description: `产品已${product.status === 'active' ? '下架' : '上架'}`,
      });
      fetchProducts();
    } catch (error) {
      toast({
        title: '操作失败',
        description: '更新状态失败',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      operator: product.operator,
      monthly_rent: product.monthly_rent,
      general_data: product.general_data.toString(),
      directed_data: product.directed_data.toString(),
      call_minutes: product.call_minutes.toString(),
      validity_months: product.validity_months.toString(),
      commission_amount: product.commission_amount,
      age_limit: product.age_limit || '',
      area_limit: product.area_limit || '',
      sort_order: product.sort_order.toString(),
      tags: product.tags || '',
      promo_url: product.promo_url || '',
      image_url: product.image_url || '',
    });
    setDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      description: '',
      operator: 'mobile',
      monthly_rent: '',
      general_data: '',
      directed_data: '',
      call_minutes: '',
      validity_months: '12',
      commission_amount: '',
      age_limit: '',
      area_limit: '',
      sort_order: '0',
      tags: '',
      promo_url: '',
      image_url: '',
    });
    setDialogOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">号卡产品管理</h1>
          <p className="text-muted-foreground">管理号卡产品，配置佣金和套餐信息</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="w-4 h-4 mr-2" />
              添加号卡
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProduct ? '编辑号卡' : '添加号卡'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {/* 图片上传 */}
              <div className="space-y-2">
                <Label>套餐图片</Label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                />
                {formData.image_url ? (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border">
                    <img
                      src={formData.image_url}
                      alt="套餐图片"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={() => setFormData({ ...formData, image_url: '' })}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-48 border-dashed flex flex-col items-center justify-center gap-2"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                        <span className="text-sm text-muted-foreground">上传中...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">点击上传套餐图片</span>
                        <span className="text-xs text-muted-foreground">支持 JPG、PNG、GIF、WebP，最大 5MB</span>
                      </>
                    )}
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>号卡名称</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="如：移动飞轮卡"
                  />
                </div>
                <div className="space-y-2">
                  <Label>运营商</Label>
                  <Select
                    value={formData.operator}
                    onValueChange={(value) => setFormData({ ...formData, operator: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mobile">中国移动</SelectItem>
                      <SelectItem value="unicom">中国联通</SelectItem>
                      <SelectItem value="telecom">中国电信</SelectItem>
                      <SelectItem value="broadnet">中国广电</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>月租（元）</Label>
                  <Input
                    type="number"
                    value={formData.monthly_rent}
                    onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                    placeholder="29"
                  />
                </div>
                <div className="space-y-2">
                  <Label>佣金（元）</Label>
                  <Input
                    type="number"
                    value={formData.commission_amount}
                    onChange={(e) => setFormData({ ...formData, commission_amount: e.target.value })}
                    placeholder="150"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>通用流量（GB）</Label>
                  <Input
                    type="number"
                    value={formData.general_data}
                    onChange={(e) => setFormData({ ...formData, general_data: e.target.value })}
                    placeholder="200"
                  />
                </div>
                <div className="space-y-2">
                  <Label>定向流量（GB）</Label>
                  <Input
                    type="number"
                    value={formData.directed_data}
                    onChange={(e) => setFormData({ ...formData, directed_data: e.target.value })}
                    placeholder="30"
                  />
                </div>
                <div className="space-y-2">
                  <Label>通话（分钟）</Label>
                  <Input
                    type="number"
                    value={formData.call_minutes}
                    onChange={(e) => setFormData({ ...formData, call_minutes: e.target.value })}
                    placeholder="2000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>有效期（月）</Label>
                  <Input
                    type="number"
                    value={formData.validity_months}
                    onChange={(e) => setFormData({ ...formData, validity_months: e.target.value })}
                    placeholder="12"
                  />
                </div>
                <div className="space-y-2">
                  <Label>排序</Label>
                  <Input
                    type="number"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>年龄限制</Label>
                <Input
                  value={formData.age_limit}
                  onChange={(e) => setFormData({ ...formData, age_limit: e.target.value })}
                  placeholder="如：18-60岁"
                />
              </div>
              <div className="space-y-2">
                <Label>地区限制</Label>
                <Input
                  value={formData.area_limit}
                  onChange={(e) => setFormData({ ...formData, area_limit: e.target.value })}
                  placeholder="如：新疆、西藏不发"
                />
              </div>
              <div className="space-y-2">
                <Label>标签（主推/新品等）</Label>
                <Input
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="主推,新品"
                />
              </div>
              <div className="space-y-2">
                <Label>推广链接</Label>
                <Input
                  value={formData.promo_url}
                  onChange={(e) => setFormData({ ...formData, promo_url: e.target.value })}
                  placeholder="运营商推广链接"
                />
              </div>
              <div className="space-y-2">
                <Label>描述</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="号卡描述"
                />
              </div>
              <Button onClick={handleSubmit} className="w-full">
                {editingProduct ? '更新' : '创建'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>号卡列表 ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索号卡名称..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={operatorFilter} onValueChange={setOperatorFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="运营商" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部</SelectItem>
                <SelectItem value="mobile">中国移动</SelectItem>
                <SelectItem value="unicom">中国联通</SelectItem>
                <SelectItem value="telecom">中国电信</SelectItem>
                <SelectItem value="broadnet">中国广电</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>图片</TableHead>
                <TableHead>名称</TableHead>
                <TableHead>运营商</TableHead>
                <TableHead>月租</TableHead>
                <TableHead>流量</TableHead>
                <TableHead>通话</TableHead>
                <TableHead>佣金</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      {product.name}
                      {product.tags && (
                        <span className="ml-2 text-xs text-orange-500">
                          {product.tags.split(',').map(tag => `#${tag}`).join(' ')}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={operatorMap[product.operator]?.color || 'bg-gray-100'}>
                      {operatorMap[product.operator]?.name || product.operator}
                    </Badge>
                  </TableCell>
                  <TableCell>¥{product.monthly_rent}/月</TableCell>
                  <TableCell>
                    {product.general_data}G通用
                    {product.directed_data > 0 && ` + ${product.directed_data}G定向`}
                  </TableCell>
                  <TableCell>{product.call_minutes}分钟</TableCell>
                  <TableCell className="text-green-600 font-bold">¥{product.commission_amount}</TableCell>
                  <TableCell>
                    <Badge variant={product.status === 'active' ? 'default' : 'secondary'}>
                      {product.status === 'active' ? '上架' : '下架'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(product)}
                        title={product.status === 'active' ? '下架' : '上架'}
                      >
                        {product.status === 'active' ? (
                          <ToggleRight className="w-4 h-4 text-green-500" />
                        ) : (
                          <ToggleLeft className="w-4 h-4 text-gray-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
