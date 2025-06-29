import { HeartFilled, HeartOutlined, ShareAltOutlined, ShoppingCartOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Spin, Button, Image, Layout, Rate, Tabs, message, Radio } from "antd";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IProduct, IVariation, IAttribute } from '../interface/product.interface';
import { productService } from '../services/product.service';
import { cartService } from '../services/cart.service';
import { useAuth } from '../auth/AuthContext ';

const { Sider } = Layout;

export default function DetailProduct() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAttributes, setSelectedAttributes] = useState<{ [key: string]: string }>({});
  const [quantity, setQuantity] = useState<number | string>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBuyingNow, setIsBuyingNow] = useState(false);

  const { data: product, isLoading } = useQuery<IProduct>({
    queryKey: ['product', slug],
    queryFn: () => productService.getProductBySlug(slug!),
    enabled: !!slug,
  });

  const { data: attributes, isLoading: isLoadingAttributes } = useQuery<IAttribute[]>({
    queryKey: ['attributes', product?._id],
    queryFn: () => {
      const allAttributes = product?.variation?.flatMap(v => v.attributes || []) || [];
      const uniqueAttributes: IAttribute[] = [];
      const attributeMap = new Map<string, Set<string>>();

      allAttributes.forEach(attr => {
        if (!attributeMap.has(attr.attributeName)) {
          attributeMap.set(attr.attributeName, new Set(attr.values));
        } else {
          attr.values.forEach(value => attributeMap.get(attr.attributeName)!.add(value));
        }
      });

      attributeMap.forEach((values, attributeName) => {
        uniqueAttributes.push({ attributeName, values: Array.from(values) });
      });

      return uniqueAttributes;
    },
    enabled: !!product?._id,
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
    setSelectedImageIndex(0);
    setSelectedAttributes({});
    setQuantity(1);
  }, [slug]);

  const handleNavigateProduct = (slug: string) => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTimeout(() => navigate(`/products/${slug}`), 300);
  };

  const activeVariations: IVariation[] = product?.variation?.filter(v => v.isActive) || [];
  const minPrice = Math.min(...activeVariations.map(v => v.salePrice > 0 ? v.salePrice : v.regularPrice));
  const maxPrice = Math.max(...activeVariations.map(v => v.salePrice > 0 ? v.salePrice : v.regularPrice));
  const firstActiveVariation = activeVariations[0];

  const selectedVariation = useMemo(() => {
    if (Object.keys(selectedAttributes).length === 0) return firstActiveVariation;

    return activeVariations.find(v => {
      return Object.entries(selectedAttributes).every(([attrName, attrValue]) => {
        const variationAttr = v.attributes?.find(a => a.attributeName === attrName);
        return variationAttr?.values.includes(attrValue);
      }) && v.stock > 0;
    }) || activeVariations.find(v => {
      return Object.entries(selectedAttributes).every(([attrName, attrValue]) => {
        const variationAttr = v.attributes?.find(a => a.attributeName === attrName);
        return variationAttr?.values.includes(attrValue);
      });
    }) || firstActiveVariation;
  }, [selectedAttributes, activeVariations, firstActiveVariation]);

  const displayImages = useMemo(() => {
    const productImages = Array.isArray(product?.image) ? product.image : [];
    const allVariantImages: string[] = [];

    activeVariations.forEach(variant => {
      if (variant.image) {
        const variantImages = Array.isArray(variant.image) ? variant.image : [variant.image];
        allVariantImages.push(...variantImages.filter(img => img));
      }
    });

    const allImages = [...productImages, ...allVariantImages];
    return [...new Set(allImages)].filter(img => img);
  }, [product?.image, activeVariations]);

  const mainImage = useMemo(() => {
    if (Object.keys(selectedAttributes).length > 0 && selectedVariation) {
      const selectedVariantImages = Array.isArray(selectedVariation.image)
        ? selectedVariation.image
        : [selectedVariation.image].filter(Boolean);

      if (selectedVariantImages.length > 0) {
        return selectedVariantImages[0];
      }
    }

    return displayImages[selectedImageIndex] || displayImages[0];
  }, [selectedAttributes, selectedVariation, displayImages, selectedImageIndex]);

  useEffect(() => {
    if (Object.keys(selectedAttributes).length > 0 && selectedVariation) {
      const selectedVariantImages = Array.isArray(selectedVariation.image)
        ? selectedVariation.image
        : [selectedVariation.image].filter(Boolean);
      if (selectedVariantImages.length > 0) {
        const mainImageIndex = displayImages.indexOf(selectedVariantImages[0]);
        if (mainImageIndex !== -1) {
          setSelectedImageIndex(mainImageIndex);
        }
      }
    } else {
      setSelectedImageIndex(0);
    }
  }, [selectedAttributes, selectedVariation, displayImages]);

  const price = selectedVariation?.salePrice > 0 ? selectedVariation.salePrice : selectedVariation?.regularPrice;
  const inStock = activeVariations.some(v => v.stock > 0);
  const stock = selectedVariation?.stock ?? 0;

  const filteredRelatedProducts = relatedProducts?.docs
    .filter(p => p.isActive && p.categoryId === product?.categoryId && p._id !== product?._id)
    .slice(0, 3) || [];

  const filteredNewProducts = newProducts?.docs
    .filter(p => p.isActive && p.slug !== slug)
    .slice(0, 3) || [];

  const handleQuantityChange = (type: 'increase' | 'decrease') => {
    const currentQuantity = Number(quantity) || 1;
    if (type === 'increase') {
      if (currentQuantity < (selectedVariation?.stock || 1)) {
        setQuantity(currentQuantity + 1);
      }
    } else {
      if (currentQuantity > 1) {
        setQuantity(currentQuantity - 1);
      }
    }
  };

  const handleManualQuantityChange = (value: string) => {
    if (value === '') {
      setQuantity('');
      return;
    }

    if (!/^\d+$/.test(value)) {
      setQuantity(1);
      message.warning('Vui lòng nhập số hợp lệ');
      return;
    }

    const num = parseInt(value, 10);
    if (num === 0) {
      setQuantity(1);
      message.warning('Số lượng tối thiểu là 1');
    } else if (num > (selectedVariation?.stock || 1)) {
      setQuantity(selectedVariation?.stock || 1);
      message.warning(`Số lượng tối đa là ${selectedVariation?.stock}`);
    } else {
      setQuantity(num);
    }
  };

  const handleThumbnailClick = (img: string, index: number) => {
    setSelectedImageIndex(index);
  };

  const handleAddToCart = async () => {
    if (!user) {
      message.warning('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng');
      return navigate('/login');
    }
    if (Object.keys(selectedAttributes).length !== attributes?.length) {
      return message.error('Vui lòng chọn đầy đủ các thuộc tính');
    }
    if (!stock) return message.error('Sản phẩm đã hết hàng!');

    try {
      await cartService.addToCart({
        productId: product!._id,
        variantId: selectedVariation?._id || firstActiveVariation?._id,
        quantity: Number(quantity),
      });
      message.success('Thêm vào giỏ hàng thành công!');
      queryClient.invalidateQueries({ queryKey: ['cart'] });
    } catch (error) {
      console.error(error);
      message.error('Thêm vào giỏ hàng không thành công!');
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      message.warning('Vui lòng đăng nhập để mua hàng');
      return navigate('/login');
    }
    if (Object.keys(selectedAttributes).length !== attributes?.length) {
      return message.error('Vui lòng chọn đầy đủ các thuộc tính');
    }
    if (!stock) return message.error('Sản phẩm đã hết hàng!');

    setIsBuyingNow(true);
    try {
      await cartService.addToCart({
        productId: product!._id,
        variantId: selectedVariation?._id || firstActiveVariation?._id,
        quantity: Number(quantity),
      });

      const selectedProduct = {
        id: `${product!._id}_${selectedVariation?._id || firstActiveVariation?._id}`,
        productId: product!._id,
        variantId: selectedVariation?._id || firstActiveVariation?._id,
        slug: product!.slug,
        name: product!.name,
        variantName: `${product!.name} - ${Object.entries(selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(' / ')}`,
        image: selectedVariation?.image || product!.image[0],
        size: selectedAttributes['Kích Thước'] || '',
        color: selectedAttributes['Màu sắc'] || '',
        regularPrice: selectedVariation?.regularPrice || firstActiveVariation?.regularPrice,
        salePrice: selectedVariation?.salePrice || firstActiveVariation?.salePrice,
        quantity: Number(quantity),
        stock: selectedVariation?.stock || firstActiveVariation?.stock,
        selected: true,
      };

      localStorage.setItem('selectedCartItems', JSON.stringify([selectedProduct]));
      setTimeout(() => {
        navigate('/checkout');
      }, 1000);

    } catch (error) {
      console.error(error);
      message.error('Có lỗi xảy ra khi mua hàng!');
    } finally {
      setIsBuyingNow(false);
    }
  };

  if (isLoading || isLoadingAttributes) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Spin size="large" tip="Đang tải sản phẩm..." />
      </div>
    );
  }

  if (!product || !attributes) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600">Không tìm thấy sản phẩm</h2>
          <Button type="primary" onClick={() => navigate('/')} className="mt-4">
            Về trang chủ
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl p-6 font-roboto">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div>
              <div className="relative">
                <Image
                  src={mainImage}
                  alt={product?.name}
                  className="w-full aspect-square object-cover rounded-lg"
                />
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {displayImages.indexOf(mainImage) + 1}/{displayImages.length}
                </div>
              </div>
              <div className="mt-4">
                {displayImages.length > 4 ? (
                  <div className="overflow-x-auto">
                    <div className="flex gap-4 pb-2" style={{ width: `${displayImages.length * 80}px` }}>
                      {displayImages.map((img, i) => {
                        const isSelected = i === selectedImageIndex;
                        return (
                          <button
                            key={i}
                            onClick={() => handleThumbnailClick(img, i)}
                            className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200 ${isSelected
                              ? 'ring-2 ring-green-300 shadow-lg'
                              : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-md'
                              }`}
                          >
                            <img
                              src={img}
                              alt={`${product?.name} ${i + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {displayImages.map((img, i) => {
                      const isSelected = i === selectedImageIndex;
                      return (
                        <button
                          key={i}
                          onClick={() => handleThumbnailClick(img, i)}
                          className={`aspect-square rounded-lg overflow-hidden transition-all duration-200 ${isSelected
                            ? 'ring-2 ring-green-300 shadow-lg'
                            : 'ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-md'
                            }`}
                        >
                          <img
                            src={img}
                            alt={`${product?.name} ${i + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2">{product?.name}</h1>
              <Rate disabled value={product?.averageRating || 0} className="mb-4" />
              <div className="text-3xl font-bold mb-4" style={{ color: '#8BC42D' }}>
                {Object.keys(selectedAttributes).length === 0 && minPrice && maxPrice && minPrice !== maxPrice ? (
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
              {attributes?.map(attr => (
                <div key={attr.attributeName} className="mb-6">
                  <div className="font-semibold mb-2">
                    {attr.attributeName === "Test Color" ? "Màu sắc:" : attr.attributeName === "Test Kích Thước" ? "Kích thước:" : attr.attributeName.toUpperCase() + ":"}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {attr.values.map(value => {
                      const isSelected = selectedAttributes[attr.attributeName] === value;
                      const isColor = attr.attributeName.toLowerCase().includes('màu') || attr.attributeName.toLowerCase().includes('color');
                      return isColor ? (
                        <div
                          key={value}
                          className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all duration-200 ${isSelected
                            ? 'ring-2 ring-yellow-500 border-yellow-500 scale-110'
                            : 'border-gray-300 hover:border-yellow-400 hover:scale-105'
                            }`}
                          style={{ background: value }}
                          onClick={() => {
                            setSelectedAttributes(prev => ({
                              ...prev,
                              [attr.attributeName]: prev[attr.attributeName] === value ? '' : value,
                            }));
                          }}
                        />
                      ) : (
                        <Radio.Button
                          key={value}
                          value={value}
                          className={`min-w-[60px] text-center transition-all duration-200 ${isSelected
                            ? 'border-2 border-yellow-500 hover:border-yellow-500'
                            : 'border-gray-300 hover:border-yellow-400'
                            }`}
                          onClick={() => {
                            setSelectedAttributes(prev => ({
                              ...prev,
                              [attr.attributeName]: prev[attr.attributeName] === value ? '' : value,
                            }));
                          }}
                        >
                          {value}
                        </Radio.Button>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="mb-6">
                <div className="font-semibold mb-2">SỐ LƯỢNG:</div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center border border-gray-300 rounded overflow-hidden w-fit">
                    <button
                      type="button"
                      className="w-10 h-10 flex items-center justify-center text-gray-400 text-xl font-bold hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleQuantityChange('decrease')}
                      disabled={Number(quantity) <= 1}
                    >
                      –
                    </button>
                    <input
                      value={quantity}
                      onChange={(e) => handleManualQuantityChange(e.target.value)}
                      onBlur={() => {
                        if (quantity === '' || Number(quantity) < 1) {
                          setQuantity(1);
                        }
                      }}
                      className="w-12 h-10 text-center text-gray-600 font-semibold border-x border-gray-300 focus:outline-none"
                      style={{ borderLeftColor: '#D1D5DB', borderRightColor: '#D1D5DB', borderTopColor: '#F9FAFB', borderBottomColor: '#F9FAFB' }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={String(selectedVariation?.stock || 1).length}
                    />
                    <button
                      type="button"
                      className="w-10 h-10 flex items-center justify-center text-gray-600 text-xl font-light hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleQuantityChange('increase')}
                      disabled={Number(quantity) >= (selectedVariation?.stock || 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {selectedVariation?.stock ? `Tối đa ${selectedVariation.stock} sản phẩm` : 'Vui lòng chọn biến thể'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <Button
                  size="large"
                  icon={
                    liked ? (
                      <HeartFilled style={{ color: "#ff4d4f", fontSize: "24px" }} />
                    ) : (
                      <HeartOutlined style={{ fontSize: "24px", color: "#595959" }} />
                    )
                  }
                  style={{ width: "64px", height: "64px" }}
                  className="border border-gray-300 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center bg-white hover:bg-gray-50"
                  onClick={() => setLiked(!liked)}
                />
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingCartOutlined style={{ fontSize: "24px" }} />}
                  className="rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center px-6 h-16 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAddToCart}
                  disabled={!stock || Object.keys(selectedAttributes).length !== attributes?.length}
                >
                  Thêm vào giỏ
                </Button>
                <Button
                  type="primary"
                  size="large"
                  icon={<ShoppingOutlined style={{ fontSize: "24px" }} />}
                  className="rounded-lg shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center px-6 h-16 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleBuyNow}
                  disabled={!stock || Object.keys(selectedAttributes).length !== attributes?.length || isBuyingNow}
                  loading={isBuyingNow}
                >
                  {isBuyingNow ? 'Đang xử lý...' : 'Mua ngay'}
                </Button>
              </div>
              <div className="flex justify-between border-t pt-4 text-sm text-gray-600">
                <div className="flex items-center gap-2 cursor-pointer hover:text-green-600">
                  📋 HƯỚNG DẪN CHỌN SIZE
                </div>
                <div className="flex items-center gap-2 cursor-pointer hover:text-green-600">
                  <ShareAltOutlined /> CHIA SẺ
                </div>
              </div>
            </div>
          </div>
          <Tabs defaultActiveKey="1" centered className="mt-12">
            <Tabs.TabPane tab="MÔ TẢ" key="1">
              <div className="mt-4 text-gray-700 space-y-6 text-justify">
                <p>{product?.description}</p>
                {product?.image?.[0] && (
                  <div className="flex justify-center">
                    <img
                      src={product.image[0]}
                      alt="Chi tiết sản phẩm"
                      className="w-full max-w-md rounded-lg shadow-md"
                    />
                  </div>
                )}
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="NHẬN XÉT" key="2">
              <p className="mt-4 text-gray-700">Chưa có nhận xét nào.</p>
            </Tabs.TabPane>
          </Tabs>
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 border-b-2 border-orange-400 inline-block pb-2">
              Sản phẩm cùng danh mục
            </h2>
            {isLoadingRelated ? (
              <div className="flex justify-center py-8">
                <Spin tip="Đang tải sản phẩm liên quan..." />
              </div>
            ) : !filteredRelatedProducts.length ? (
              <div className="text-center py-8 text-gray-500">
                Không có sản phẩm cùng danh mục nào khác
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredRelatedProducts.map(p => {
                  const price = p.variation?.[0]?.salePrice > 0
                    ? p.variation[0].salePrice
                    : p.variation?.[0]?.regularPrice;
                  const discount = p.variation?.[0]?.salePrice > 0 &&
                    p.variation[0].salePrice < p.variation[0].regularPrice
                    ? Math.round((1 - p.variation[0].salePrice / p.variation[0].regularPrice) * 100)
                    : 0;

                  return (
                    <div
                      key={p._id}
                      className="border p-4 rounded-lg hover:shadow-lg cursor-pointer transition-shadow"
                      onClick={() => handleNavigateProduct(p.slug)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded">
                        <img
                          src={p.image[0]}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        {p.isActive && (
                          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-md rounded-tr-md">
                            Mới
                          </span>
                        )}
                        {discount > 0 && (
                          <span className="absolute top-10 left-2 bg-red-500 text-white text-xs px-1 py-1 rounded-bl-md rounded-tr-md">
                            -{discount}%
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold truncate mt-4">{p.name}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-red-500 font-bold">
                          {price?.toLocaleString('vi-VN')}đ
                        </span>
                        {discount > 0 && (
                          <span className="text-gray-400 line-through text-xs">
                            {p.variation?.[0]?.regularPrice.toLocaleString('vi-VN')}đ
                          </span>
                        )}
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
                    className={`flex justify-between items-center cursor-pointer px-2 py-3 ${selectedCategory === key
                      ? "bg-gray-200 font-semibold"
                      : "hover:bg-gray-100"
                      }`}
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
              <div className="flex justify-center py-4">
                <Spin size="small" tip="Đang tải..." />
              </div>
            ) : !filteredNewProducts.length ? (
              <div className="text-center py-4 text-gray-500 text-sm">
                Không có sản phẩm mới nào
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNewProducts.map(p => {
                  const price = p.variation?.[0]?.salePrice > 0
                    ? p.variation[0].salePrice
                    : p.variation[0]?.regularPrice;
                  return (
                    <div
                      key={p._id}
                      className="flex space-x-3 border-b pb-3 cursor-pointer hover:bg-gray-50"
                      onClick={() => handleNavigateProduct(p.slug)}
                    >
                      <img
                        src={p.image[0]}
                        alt={p.name}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {p.name}
                        </h3>
                        <p className="text-sm font-medium text-red-500">
                          {price?.toLocaleString('vi-VN')}đ
                        </p>
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
                <a
                  key={label}
                  href="#"
                  className="px-2 py-2 border border-gray-300 rounded text-sm text-gray-600 hover:bg-gray-100"
                >
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