import { HeartFilled, HeartOutlined, ShareAltOutlined, ShoppingCartOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Spin, Button, Image, InputNumber, Layout, Radio, Rate, Tabs } from "antd";
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IProduct, IVariation } from '../interface/product.interface';
import { productService } from '../services/product.service';
import { formatCurrency } from "../utils/function";

const { Sider } = Layout;
const { TabPane } = Tabs;

export default function DetailProduct() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [color, setColor] = useState<string>("");
  const [size, setSize] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [liked, setLiked] = useState<boolean>(false);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState(false);

  // Lấy sản phẩm theo slug
  const { data: product, isLoading: isLoadingProduct } = useQuery<any>({
    queryKey: ['product', slug],
    queryFn: () => slug ? productService.getProductBySlug(slug) : Promise.resolve(undefined),
    enabled: !!slug,
  });

  const { data: relatedProducts, isLoading: isLoadingRelated } = useQuery<{ docs: IProduct[] }>({
    queryKey: ['relatedProducts', product?.categoryId],
    queryFn: () => productService.getAllProducts(),
    enabled: !!product?.categoryId
  });

  const { data: newProducts, isLoading: isLoadingNew } = useQuery<{ docs: IProduct[] }>({
    queryKey: ['newProducts'],
    queryFn: productService.getAllProducts
  });

  const scrollToTop = (smooth = false) => {
    window.scrollTo({ top: 0, behavior: smooth ? "smooth" : "auto" });
  };

  useEffect(() => {
    scrollToTop();
  }, []);

  useEffect(() => {
    scrollToTop(true);
    setIsNavigating(false);
    setSelectedImage('');
  }, [slug]);

  const handleNavigateProduct = (slug: string) => {
    setIsNavigating(true);
    scrollToTop(true);
    setTimeout(() => {
      navigate(`/products/${slug}`);
    }, 300);
  };

  // Lấy thuộc tính màu và size từ product
  const colorAttr = product?.attributes?.find((a: IProduct) => a.attributeName === "Màu sắc");
  const sizeAttr = product?.attributes?.find((a: IProduct) => a.attributeName === "Kích thước");
  const colors = colorAttr?.values || [];
  const sizes = sizeAttr?.values || [];

  const thumbnails = product?.image || [];
  const mainImage = product?.image?.[0];

  const firstActiveVariation = product?.variation?.find((v: IVariation) => v.isActive) || product?.variation?.[0];
  const price = firstActiveVariation?.salePrice ?? firstActiveVariation?.regularPrice
  const inStock = product?.variation?.some((v: IVariation) => v.stock > 0);

  // Lọc sản phẩm cùng danh mục - chỉ hiển thị sản phẩm có isActive = true
  const filteredRelatedProducts = React.useMemo(() => {
    if (!relatedProducts?.docs) return [];
    return relatedProducts.docs
      .filter(p => p.isActive && p.categoryId === product?.categoryId && p._id !== product?._id)
      .slice(0, 3);
  }, [relatedProducts?.docs, product]);

  // Lọc sản phẩm mới - chỉ hiển thị sản phẩm có isActive = true
  const filteredNewProducts = React.useMemo(() => {
    if (!newProducts?.docs) return [];
    return newProducts.docs
      .filter(p => p.isActive && p.slug !== slug)
      .slice(0, 3);
  }, [newProducts?.docs, slug]);


  return (
    <div className="container mx-auto max-w-7xl p-6 font-roboto">
      {(isLoadingProduct || isNavigating) ? (
        <div className="flex justify-center items-center min-h-[400px]">
          <Spin size="large" tip="Đang tải sản phẩm..." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="md:col-span-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {/* Hình ảnh */}
              <div key={product?._id} className="relative">
                {/* Main image */}
                <div className="aspect-square overflow-hidden rounded-lg">
                  <Image
                    src={selectedImage || mainImage || '/placeholder.jpg'}
                    alt={product?.name}
                    className="w-full h-full object-cover transition-transform duration-300"
                  />
                </div>

                {/* Thumbnail images */}
                <div className="mt-4 grid grid-cols-4 gap-4">
                  {thumbnails.slice(0, 4).map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(img)}
                      className={`
                        relative 
                        aspect-square 
                        overflow-hidden 
                        rounded-lg 
                        cursor-pointer
                        transition-all 
                        duration-200
                        ${selectedImage === img
                          ? 'ring-2 ring-green-300 scale-95 shadow-lg'
                          : 'ring-1 ring-gray-200 hover:ring-green-300 hover:scale-105'
                        }
                        `}
                    >
                      <img
                        src={img}
                        alt={`${product?.name} - View ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      {selectedImage === img && (
                        <div className="absolute inset-0 bg-green-500/10 flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 text-white"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Thông tin sản phẩm */}
              <div>
                <h1 className="text-2xl font-bold mb-2">{product?.name}</h1>
                <div className="flex items-center mb-4">
                  <Rate disabled defaultValue={product?.averageRating || 0} />
                </div>
                <div className="text-3xl font-bold mb-4" style={{ color: '#8BC42D', border: 0 }}>
                  {price.toLocaleString('vi-VN')}đ
                </div>
                <div className="space-y-2 text-gray-700 text-sm mb-6">
                  <div><strong>Tình trạng:</strong> {inStock ? "Còn hàng" : "Hết hàng"}</div>
                  <div><strong>Mã số SP:</strong> {product?._id}</div>
                  <div><strong>Danh mục:</strong> {product?.categoryName}</div>
                  <div><strong>Thương hiệu:</strong> {product?.brandName}</div>
                  {/* <div><strong>Từ khóa:</strong> {product?.attributes?.map((a: any) => a.values.join(', ')).join(', ')}</div> */}
                </div>
                {/* Chọn màu */}
                <div className="mb-6">
                  <div className="font-semibold mb-2">MÀU:</div>
                  <div className="flex gap-3">
                    {colors.map((item: string) => (
                      <div
                        key={item}
                        className={`w-8 h-8 rounded-full cursor-pointer border ${color === item ? "ring-2 ring-yellow-500" : ""}`}
                        style={{ background: item }}
                        onClick={() => setColor(item)}
                      />
                    ))}
                  </div>
                </div>
                {/* Chọn size */}
                <div className="mb-6">
                  <div className="font-semibold mb-2">SIZE:</div>
                  <Radio.Group
                    value={size}
                    onChange={(e) => setSize(e.target.value)}
                    className="flex gap-3"
                  >
                    {sizes.map((s: string) => (
                      <Radio.Button key={s} value={s}>
                        {s}
                      </Radio.Button>
                    ))}
                  </Radio.Group>
                </div>
                {/* Số lượng và nút */}
                <div className="flex items-center gap-4 mb-6">
                  <InputNumber
                    min={1}
                    max={10}
                    type="number"
                    value={quantity}
                    onChange={(value) => setQuantity(value || 1)}
                  />
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingCartOutlined />}
                    className="bg-yellow-400 hover:bg-yellow-500 border-0"
                  >
                    Thêm vào giỏ
                  </Button>
                  <Button
                    type="primary"
                    size="large"
                    icon={<ShoppingOutlined />}
                    style={{ backgroundColor: '#8BC42D', border: 0 }}
                    className="hover:bg-yellow-500"
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
                <div className="flex items-center justify-between border-t pt-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2 cursor-pointer hover:text-green-600">
                    <span>📋</span> HƯỚNG DẪN CHỌN SIZE
                  </div>
                  <div className="flex items-center gap-2 cursor-pointer hover:text-green-600">
                    <ShareAltOutlined /> CHIA SẺ
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs mô tả - nhận xét */}
            <div className="mt-12">
              <Tabs defaultActiveKey="1" centered>
                <TabPane tab="MÔ TẢ" key="1">
                  <div className="mt-4 text-gray-700 leading-relaxed space-y-6 text-justify">
                    <p>{product?.description}</p>
                    <div className="flex justify-center">
                      {product?.image?.[0] && (
                        <img src={product.image[0]} alt="Chi tiết sản phẩm 1" className="w-full max-w-md rounded-lg shadow-md" />
                      )}
                    </div>
                  </div>
                </TabPane>

                <TabPane tab="NHẬN XÉT" key="2">
                  <p className="mt-4 text-gray-700 leading-relaxed">
                    Chưa có nhận xét nào.
                  </p>
                </TabPane>
              </Tabs>
            </div>

            {/* Sản phẩm cùng danh mục */}
            <div className="related-products mt-16">
              <h2 className="text-2xl font-bold mb-6 border-b-2 border-orange-400 inline-block pb-2">
                Sản phẩm cùng danh mục
              </h2>

              {isLoadingRelated ? (
                <div className="flex justify-center py-8">
                  <Spin tip="Đang tải sản phẩm liên quan..." />
                </div>
              ) : filteredRelatedProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Không có sản phẩm cùng danh mục nào khác
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {filteredRelatedProducts.map((product) => (
                    <div
                      key={product._id}
                      className="border p-4 rounded-lg hover:shadow-lg transition cursor-pointer"
                      onClick={() => handleNavigateProduct(product.slug)}
                    >
                      <div className="relative aspect-[7/6] overflow-hidden">
                        <img
                          src={product.image[0]}
                          alt={product.name}
                          className="w-full h-full object-cover rounded"
                        />
                        {product.isActive && (
                          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-bl-md rounded-tr-md">
                            Mới
                          </span>
                        )}
                        {product.variation && product.variation[0]?.salePrice < product.variation[0]?.regularPrice && (
                          <span className="absolute top-10 left-2 bg-red-500 text-white text-xs font-semibold px-1 py-1 rounded-bl-md rounded-tr-md">
                            -{Math.round((1 - product.variation[0].salePrice / product.variation[0].regularPrice) * 100)}%
                          </span>
                        )}
                      </div>

                      <div className="mt-4">
                        <h3 className="text-sm font-semibold truncate">{product.name}</h3>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-red-500 font-bold">
                            {(product.variation?.[0]?.salePrice ?? product.variation?.[0]?.regularPrice)?.toLocaleString('vi-VN')}đ
                          </span>
                          {product.variation?.[0]?.salePrice < product.variation?.[0]?.regularPrice && (
                            <span className="text-gray-400 line-through text-xs ml-2">
                              {product.variation?.[0]?.regularPrice.toLocaleString('vi-VN')}đ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* Sidebar */}
          <Sider width={250} className="bg-white p-4">

            {/* Thư mục */}
            <div className="mb-6 bg-gray-100 relative p-5">
              <h2 className="text-base font-bold uppercase ">THƯ MỤC</h2>

              <div className="relative mb-4 ">
                <div className="h-1 w-20 bg-orange-400"></div>
                <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
              </div>

              <ul className="divide-y divide-gray-200 w-full">
                {Array(5).fill(0).map((_, index) => {
                  const key = `category-${index}`;
                  return (
                    <li
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`flex justify-between items-center cursor-pointer px-2 py-3 transition-all duration-200 ${selectedCategory === key ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
                        }`}
                    >
                      <span className="text-gray-800 text-sm font-medium">Tin khuyến mãi</span>
                      <span className="text-gray-400 text-base font-bold">+</span>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Sản phẩm mới */}
            <div className="mb-6">
              <h2 className="text-base font-bold mb-4">Các sản phẩm mới ra mắt</h2>
              <div className="relative mb-4">
                <div className="h-1 w-20 bg-orange-400"></div>
                <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
              </div>

              {isLoadingNew ? (
                <div className="flex justify-center py-4">
                  <Spin size="small" tip="Đang tải..." />
                </div>
              ) : filteredNewProducts.length === 0 ? (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Không có sản phẩm mới nào
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredNewProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex space-x-3 border-b pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleNavigateProduct(product.slug)}
                    >
                      <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded">
                        <img
                          src={product.image[0]}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {product.name}
                        </h3>
                        <p className="mt-1 text-sm font-medium text-red-500">
                          {formatCurrency(product.variation?.[0]?.salePrice || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Từ khóa */}
            <div>
              <h2 className="text-base font-bold mb-4 uppercase">TỪ KHÓA</h2>
              <div className="relative mb-4 ">
                <div className="h-1 w-20 bg-orange-400"></div>
                <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
              </div>
              <div className="flex flex-wrap gap-2">
                {["Thể thao", "Xu hướng", "Trang trí", "Nam", "Nữ", "Giày thể thao", "Sport"].map((label) => (
                  <a
                    key={label}
                    href="#"
                    className="px-2 py-1 border border-gray-300 rounded text-sm text-gray-700 cursor-pointer hover:bg-gray-100"
                  >
                    {label}
                  </a>
                ))}
              </div>
            </div>
          </Sider>
        </div>
      )}
    </div>
  );
}