import { HeartFilled, HeartOutlined, ShareAltOutlined, ShoppingCartOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Spin, Button, Image, InputNumber, Layout, Rate, Tabs, message, Radio } from "antd";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IProduct, IVariation } from '../interface/product.interface';
import { productService } from '../services/product.service';
import { cartService } from '../services/cart.service';
import { useAuth } from '../auth/AuthContext ';

const { Sider } = Layout;

export default function DetailProduct() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  const { data: product, isLoading } = useQuery<IProduct>({
    queryKey: ['product', slug],
    queryFn: () => productService.getProductBySlug(slug!),
    enabled: !!slug,
  });

  const { data: relatedProducts, isLoading: isLoadingRelated } = useQuery<{ docs: IProduct[] }>({
    queryKey: ['relatedProducts', product?.categoryId],
    queryFn: productService.getAllProducts,
    enabled: !!product?.categoryId,
  });

  const { data: newProducts, isLoading: isLoadingNew } = useQuery<{ docs: IProduct[] }>({
    queryKey: ['newProducts'],
    queryFn: productService.getAllProducts,
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSelectedImage("");
    setColor("");
    setSize("");
  }, [slug]);

  const handleNavigateProduct = (slug: string) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => navigate(`/products/${slug}`), 300);
  };

  const activeVariations: IVariation[] = product?.variation?.filter(v => v.isActive) || [];
  const minPrice = Math.min(...activeVariations.map(v => v.salePrice > 0 ? v.salePrice : v.regularPrice));
  const maxPrice = Math.max(...activeVariations.map(v => v.salePrice > 0 ? v.salePrice : v.regularPrice));
  const firstActiveVariation = activeVariations[0];
  
  const colors = [...new Set(activeVariations
    .filter(v => v.stock > 0)
    .flatMap(v => v.attributes?.find(a => a.attributeName === "Màu sắc")?.values || []))];
  const sizes = [...new Set(activeVariations
    .filter(v => v.stock > 0)
    .flatMap(v => v.attributes?.find(a => a.attributeName === "Kích thước")?.values || []))];
  const variationImages = activeVariations.flatMap(v => Array.isArray(v.image) ? v.image : [v.image || '']).filter(img => img);

  const selectedVariation = activeVariations.find(v => {
    const colorMatch = !color || v.attributes?.some(a => a.attributeName === "Màu sắc" && a.values.includes(color));
    const sizeMatch = !size || v.attributes?.some(a => a.attributeName === "Kích thước" && a.values.includes(size));
    return colorMatch && sizeMatch;
  }) || firstActiveVariation;

  const thumbnails = Array.isArray(selectedVariation?.image)
    ? selectedVariation.image
    : Array.isArray(product?.image)
      ? product.image
      : [selectedVariation?.image || product?.image?.[0] || '/placeholder.jpg'];
  const mainImage = selectedImage || thumbnails[0];

  const price = selectedVariation?.salePrice > 0 ? selectedVariation.salePrice : selectedVariation?.regularPrice;
  const inStock = activeVariations.some(v => v.stock > 0);
  const stock = selectedVariation?.stock ?? 0;
  const filteredRelatedProducts = relatedProducts?.docs
    .filter(p => p.isActive && p.categoryId === product?.categoryId && p._id !== product?._id)
    .slice(0, 3) || [];

  const filteredNewProducts = newProducts?.docs
    .filter(p => p.isActive && p.slug !== slug)
    .slice(0, 3) || [];

  const handleAddToCart = async () => {
    if (!user) {
      message.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return navigate('/login');
    }
    if (!size || !color) return message.error('Vui lòng chọn màu sắc và kích thước');
    if (!stock) return message.error('Sản phẩm đã hết hàng!');

    try {
      await cartService.addToCart({
        productId: product!._id,
        variantId: selectedVariation?._id || firstActiveVariation?._id,
        quantity,
      });
      message.success('Thêm vào giỏ hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      navigate('/cart');
    } catch (error) {
      console.error(error);
      message.error('Thêm vào giỏ hàng thất bại!');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" tip="Đang tải sản phẩm..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 font-roboto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <Image
                src={mainImage}
                alt={product?.name}
                className="w-full aspect-square object-cover rounded-lg"
              />
              <div className="mt-4 grid grid-cols-4 gap-4">
                {variationImages.slice(0, 4).map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square rounded-lg overflow-hidden ${mainImage === img ? 'ring-2 ring-green-300' : 'ring-1 ring-gray-200 hover:ring-green-300'}`}
                  >
                    <img src={img} alt={`${product?.name} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">{product?.name}</h1>
              <Rate disabled value={product?.averageRating || 0} className="mb-4" />
              <div className="text-3xl font-bold mb-4" style={{ color: '#8BC42D' }}>
                {(!color && !size) && minPrice && maxPrice && minPrice !== maxPrice ? (
                  <span>
                    {minPrice.toLocaleString('vi-VN')}đ - {maxPrice.toLocaleString('vi-VN')}đ
                  </span>
                ) : (
                  <span>
                    {price?.toLocaleString('vi-VN')}đ
                  </span>
                )}
              </div>
              <div className="space-y-2 text-gray-700 text-sm mb-6">
                <div><strong>Tình trạng:</strong> {inStock ? "Còn hàng" : "Hết hàng"}</div>
                <div><strong>Danh mục:</strong> {product?.categoryName}</div>
                <div><strong>Thương hiệu:</strong> {product?.brandName}</div>
              </div>
              <div className="mb-6">
                <div className="font-semibold mb-2">MÀU:</div>
                <div className="flex gap-3">
                  {colors.map(c => {
                    const variation = activeVariations.find(v => v.attributes?.some(a => a.attributeName === "Màu sắc" && a.values.includes(c)));
                    const variationStock = variation?.stock || 0;
                    return (
                      <div
                        key={c}
                        className={`w-8 h-8 rounded-full cursor-pointer border ${variationStock === 0 ? 'opacity-50 cursor-not-allowed' : color === c ? 'ring-2 ring-yellow-500' : ''}`}
                        style={{ background: c }}
                        onClick={() => {
                          if (variationStock > 0) {
                            setColor(prev => (prev === c ? "" : c));
                          }
                        }}
                      />
                    );
                  })}
                </div>
              </div>
              <div className="mb-6">
                <div className="font-semibold mb-2">SIZE:</div>
                <Radio.Group value={size} className="flex gap-3">
                  {sizes.map(s => {
                    const variation = activeVariations.find(v => v.attributes?.some(a => a.attributeName === "Kích thước" && a.values.includes(s)));
                    const variationStock = variation?.stock || 0;
                    return (
                      <Radio.Button
                        key={s}
                        value={s}
                        disabled={variationStock === 0}
                        className={variationStock === 0 ? 'opacity-50 cursor-not-allowed' : ''}
                        onClick={() => {
                          if (variationStock > 0) {
                            setSize(prev => (prev === s ? "" : s));
                          }
                        }}
                      >
                        {s} {variationStock > 0 && <span className="ml-1 text-red-500 text-xs">({variationStock} còn)</span>}
                      </Radio.Button>
                    );
                  })}
                </Radio.Group>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <InputNumber min={1} max={stock || 10} value={quantity} onChange={v => setQuantity(v || 1)} />
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined />}
                  className="bg-yellow-400 hover:bg-yellow-500"
                  onClick={handleAddToCart}
                  disabled={!stock}
                >
                  Thêm vào giỏ
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingOutlined />}
                  style={{ backgroundColor: '#8BC42D' }}
                  disabled={!stock}
                >
                  Mua ngay
                </Button>
                <Button
                  size="large"
                  icon={liked ? <HeartFilled style={{ color: "red" }} /> : <HeartOutlined />}
                  className="border border-gray-300"
                  onClick={() => setLiked(!liked)}
                />
              </div>
              <div className="flex justify-between border-t pt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2 cursor-pointer hover:text-green-600">📋 HƯỚNG DẪN CHỌN SIZE</div>
                <div className="flex items-center gap-2 cursor-pointer hover:text-green-600"><ShareAltOutlined /> CHIA SẺ</div>
              </div>
            </div>
          </div>
          <Tabs defaultActiveKey="1" centered className="mt-12">
            <Tabs.TabPane tab="MÔ TẢ" key="1">
              <div className="mt-4 text-gray-700 space-y-6 text-justify">
                <p>{product?.description}</p>
                {product?.image?.[0] && (
                  <div className="flex justify-center">
                    <img src={product.image[0]} alt="Chi tiết sản phẩm" className="w-full max-w-md rounded-lg shadow-md" />
                  </div>
                )}
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="NHẬN XÉT" key="2">
              <p className="mt-4 text-gray-700">Chưa có nhận xét nào.</p>
            </Tabs.TabPane>
          </Tabs>
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 border-b-2 border-orange-400 inline-block pb-2">Sản phẩm cùng danh mục</h2>
            {isLoadingRelated ? (
              <div className="flex justify-center py-8"><Spin tip="Đang tải sản phẩm liên quan..." /></div>
            ) : !filteredRelatedProducts.length ? (
              <div className="text-center py-8 text-gray-500">Không có sản phẩm cùng danh mục nào khác</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredRelatedProducts.map(p => {
                  const price = p.variation?.[0]?.salePrice > 0 ? p.variation[0].salePrice : p.variation?.[0]?.regularPrice;
                  const discount = p.variation?.[0]?.salePrice > 0 && p.variation[0].salePrice < p.variation[0].regularPrice
                    ? Math.round((1 - p.variation[0].salePrice / p.variation[0].regularPrice) * 100)
                    : 0;
                  return (
                    <div
                      key={p._id}
                      className="border p-4 rounded-lg hover:shadow-lg cursor-pointer"
                      onClick={() => handleNavigateProduct(p.slug)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded">
                        <img src={p.image[0]} alt={p.name} className="w-full h-full object-cover" />
                        {p.isActive && <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-md rounded-tr-md">Mới</span>}
                        {discount > 0 && <span className="absolute top-10 left-2 bg-red-500 text-white text-xs px-1 py-1 rounded-bl-md rounded-tr-md">-{discount}%</span>}
                      </div>
                      <h3 className="text-sm font-semibold truncate mt-4">{p.name}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-red-500 font-bold">{price?.toLocaleString('vi-VN')}đ</span>
                        {discount > 0 && <span className="text-gray-400 line-through text-xs">{p.variation?.[0]?.regularPrice.toLocaleString('vi-VN')}đ</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        <Sider width={250} className="bg-white p-4">
          <div className="mb-6 bg-gray-100 p-5">
            <h2 className="text-base font-bold uppercase">THƯ MỤC</h2>
            <div className="relative mb-4">
              <div className="h-1 w-20 bg-orange-400" />
              <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300" />
            </div>
            <ul className="divide-y divide-gray-200">
              {Array(5).fill(0).map((_, i) => {
                const key = `category-${i}`;
                return (
                  <li
                    key={key}
                    onClick={() => setSelectedCategory(key)}
                    className={`flex justify-between items-center cursor-pointer px-2 py-3 ${selectedCategory === key ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"}`}
                  >
                    <span className="text-gray-800 text-sm font-medium">Tin khuyến mãi</span>
                    <span className="text-gray-400 text-base font-bold">+</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="mb-6">
            <h2 className="text-base font-bold mb-4">Các sản phẩm mới ra mắt</h2>
            <div className="relative mb-4">
              <div className="h-1 w-20 bg-orange-400" />
              <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300" />
            </div>
            {isLoadingNew ? (
              <div className="flex justify-center py-4"><Spin size="small" tip="Đang tải..." /></div>
            ) : !filteredNewProducts.length ? (
              <div className="text-center py-4 text-gray-500 text-sm">Không có sản phẩm mới nào</div>
            ) : (
              <div className="space-y-4">
                {filteredNewProducts.map(p => {
                  const price = p.variation?.[0]?.salePrice > 0 ? p.variation[0].salePrice : p.variation?.[0]?.regularPrice;
                  return (
                    <div
                      key={p._id}
                      className="flex space-x-3 border-b pb-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleNavigateProduct(p.slug)}
                    >
                      <img src={p.image[0]} alt={p.name} className="w-16 h-16 object-cover rounded" />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{p.name}</h3>
                        <p className="mt-1 text-sm font-medium text-red-500">{price?.toLocaleString('vi-VN')}đ</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div>
            <h2 className="text-base font-bold mb-4 uppercase">TỪ KHÓA</h2>
            <div className="relative mb-4">
              <div className="h-1 w-20 bg-orange-400" />
              <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300" />
            </div>
            <div className="flex flex-wrap gap-2">
              {["Thể thao", "Xu hướng", "Trang trí", "Nam", "Nữ", "Giày thể thao", "Sport"].map(label => (
                <a key={label} href="#" className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </Sider>
      </div>
    </div>
  );
}