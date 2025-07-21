import { HeartFilled, HeartOutlined, ShareAltOutlined, ShoppingCartOutlined, ShoppingOutlined } from "@ant-design/icons";
import { Button, Image, Layout, message, Modal, Radio, Rate, Spin, Tabs, Tooltip, Avatar } from "antd";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import chon_size from "../assets/image/chon_size.png";
import { useAuth } from "../auth/AuthContext ";
import { IAttribute, IProduct, IVariation } from "../interface/product.interface";
import { cartService } from "../services/cart.service";
import { productService } from "../services/product.service";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { reviewService } from "../services/review.service";

const { Sider } = Layout;

export default function DetailProduct() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [liked, setLiked] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isBuyingNow, setIsBuyingNow] = useState(false);
  const [isManualImageSelection, setIsManualImageSelection] = useState(false);
  const [filterRating, setFilterRating] = useState<string>("all");
  const [isSizeGuideVisible, setIsSizeGuideVisible] = useState(false);
  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const { data: product, isLoading } = useQuery<IProduct>({
    queryKey: ["product", slug],
    queryFn: () => productService.getProductBySlug(slug!),
    enabled: !!slug,
  });

  const { data: attributes, isLoading: isLoadingAttributes } = useQuery<IAttribute[]>({
    queryKey: ["attributes", product?._id],
    queryFn: () => {
      const activeVariations = product?.variation?.filter((v) => v.isActive) || [];
      const attributeMap = new Map<string, Set<string>>();
      activeVariations.forEach((v) => {
        v.attributes?.forEach((attr) => {
          if (!attributeMap.has(attr.attributeName)) {
            attributeMap.set(attr.attributeName, new Set(attr.values));
          } else {
            attr.values.forEach((value) => attributeMap.get(attr.attributeName)!.add(value));
          }
        });
      });
      return Array.from(attributeMap.entries()).map(([attributeName, values]) => ({
        attributeName,
        values: Array.from(values),
      }));
    },
    enabled: !!product?._id,
  });

  const { data: relatedProducts, isLoading: isLoadingRelated } = useQuery<{ docs: IProduct[] }>({
    queryKey: ["relatedProducts", product?.categoryId],
    queryFn: productService.getAllProducts,
    enabled: !!product?.categoryId,
  });

  const { data: newProducts, isLoading: isLoadingNew } = useQuery<{ docs: IProduct[] }>({
    queryKey: ["newProducts"],
    queryFn: productService.getAllProducts,
    enabled: !!product,
  });

  const { data: reviewsData, isLoading: isLoadingReviews } = useQuery<{
    averageRating: number;
    totalComments: number;
    comments: { _id: string; rating: number; content: string; images: string[]; helpfulness: number; adminReply?: string; userId: { fullName: string; avatar?: string }; createdAt: string }[];
  }>({
    queryKey: ["reviews", product?._id],
    queryFn: () => reviewService.getReviewsForClient(product?._id || ""),
    enabled: !!product?._id,
  });

  const ratingDistribution = useMemo(() => {
    const ratingCount: Record<string, number> = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };
    reviewsData?.comments?.forEach((comment) => {
      const rating = Math.floor(comment.rating);
      if (rating >= 1 && rating <= 5) ratingCount[rating.toString()] += 1;
    });
    return ratingCount;
  }, [reviewsData?.comments]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSelectedImageIndex(0);
    setSelectedAttributes({});
    setQuantity(1);
    setIsManualImageSelection(false);
  }, [slug]);

  const activeVariations: IVariation[] = product?.variation?.filter((v) => v.isActive) || [];
  const minPrice = Math.min(...activeVariations.map((v) => (v.salePrice > 0 ? v.salePrice : v.regularPrice)));
  const maxPrice = Math.max(...activeVariations.map((v) => (v.salePrice > 0 ? v.salePrice : v.regularPrice)));
  const firstActiveVariation = activeVariations[0];

  const selectedVariation = useMemo(() => {
    if (Object.keys(selectedAttributes).length === 0) return firstActiveVariation;
    return (
      activeVariations.find((v) => {
        return (
          Object.entries(selectedAttributes).every(([attrName, attrValue]) => {
            const variationAttr = v.attributes?.find((a) => a.attributeName === attrName);
            return variationAttr?.values.includes(attrValue);
          }) && v.isActive
        );
      }) || firstActiveVariation
    );
  }, [selectedAttributes, activeVariations, firstActiveVariation]);

  const displayImages = useMemo(() => {
    const productImages = Array.isArray(product?.image) ? product.image : [];
    const allVariantImages = activeVariations
      .flatMap((v) => (v.image ? (Array.isArray(v.image) ? v.image : [v.image]).filter((img) => img) : []))
      .filter((img) => img);
    return [...new Set([...productImages, ...allVariantImages])];
  }, [product?.image, activeVariations]);

  const mainImage = useMemo(() => {
    if (isManualImageSelection) return displayImages[selectedImageIndex] || displayImages[0];
    if (Object.keys(selectedAttributes).length > 0 && selectedVariation) {
      const selectedVariantImages = Array.isArray(selectedVariation.image)
        ? selectedVariation.image
        : [selectedVariation.image].filter(Boolean);
      return selectedVariantImages[0] || displayImages[selectedImageIndex] || displayImages[0];
    }
    return displayImages[selectedImageIndex] || displayImages[0];
  }, [selectedAttributes, selectedVariation, displayImages, selectedImageIndex, isManualImageSelection]);

  useEffect(() => {
    if (!isManualImageSelection && Object.keys(selectedAttributes).length > 0 && selectedVariation) {
      const selectedVariantImages = Array.isArray(selectedVariation.image)
        ? selectedVariation.image
        : [selectedVariation.image].filter(Boolean);
      const mainImageIndex = displayImages.indexOf(selectedVariantImages[0]);
      if (mainImageIndex !== -1) setSelectedImageIndex(mainImageIndex);
    }
  }, [selectedAttributes, selectedVariation, displayImages, isManualImageSelection]);

  const handleThumbnailClick = (img: string, index: number) => {
    setSelectedImageIndex(index);
    setIsManualImageSelection(true);
  };

  const price = selectedVariation?.salePrice > 0 ? selectedVariation.salePrice : selectedVariation?.regularPrice || 0;
  const inStock = activeVariations.some((v) => v.stock > 0);
  const stock = selectedVariation?.stock ?? 0;

  const filteredRelatedProducts = relatedProducts?.docs
    .filter((p) => p.isActive && p.categoryId === product?.categoryId && p._id !== product?._id)
    .slice(0, 3) || [];

  const filteredNewProducts = useMemo(() => {
    if (!newProducts?.docs) return [];
    return newProducts.docs
      .filter((p) => p.isActive && p.slug !== slug)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [newProducts, slug]);

  const handleQuantityChange = (type: "increase" | "decrease") => {
    const currentQuantity = quantity;
    if (type === "increase" && currentQuantity < (selectedVariation?.stock || 1)) setQuantity(currentQuantity + 1);
    else if (type === "decrease" && currentQuantity > 1) setQuantity(currentQuantity - 1);
  };

  const handleManualQuantityChange = (value: string) => {
    if (value === "") {
      setQuantity(1);
      return;
    }
    if (!/^\d+$/.test(value)) {
      setQuantity(1);
      message.warning("Vui lòng nhập số hợp lệ");
      return;
    }
    const num = parseInt(value, 10);
    if (num === 0) {
      setQuantity(1);
      message.warning("Số lượng tối thiểu là 1");
    } else if (num > (selectedVariation?.stock || 1)) {
      setQuantity(selectedVariation?.stock || 1);
      message.warning(`Số lượng tối đa là ${selectedVariation?.stock}`);
    } else setQuantity(num);
  };

  const handleAddToCart = async () => {
    if (!user) {
      message.warning("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng");
      return navigate("/login");
    }
    if (Object.keys(selectedAttributes).length !== attributes?.length) return message.error("Vui lòng chọn đầy đủ các thuộc tính");
    if (!stock) return message.error("Sản phẩm đã hết hàng!");
    try {
      await cartService.addToCart({
        productId: product!._id,
        variantId: selectedVariation?._id || firstActiveVariation?._id,
        quantity,
      });
      message.success("Thêm vào giỏ hàng thành công!");
      queryClient.invalidateQueries({ queryKey: ["cart"] });
    } catch (error) {
      message.error("Thêm vào giỏ hàng không thành công!");
    }
  };

  const handleBuyNow = async () => {
    if (!user) {
      message.warning("Vui lòng đăng nhập để mua hàng");
      return navigate("/login");
    }
    if (Object.keys(selectedAttributes).length !== attributes?.length) return message.error("Vui lòng chọn đầy đủ các thuộc tính");
    if (!stock) return message.error("Sản phẩm đã hết hàng!");
    setIsBuyingNow(true);
    try {
      await cartService.addToCart({
        productId: product!._id,
        variantId: selectedVariation?._id || firstActiveVariation?._id,
        quantity,
      });
      const selectedProduct = {
        id: `${product!._id}_${selectedVariation?._id || firstActiveVariation?._id}`,
        productId: product!._id,
        variantId: selectedVariation?._id || firstActiveVariation?._id,
        slug: product!.slug,
        name: product!.name,
        variantName: `${product!.name} - ${Object.entries(selectedAttributes).map(([k, v]) => `${k}: ${v}`).join(" / ")}`,
        image: selectedVariation?.image || product!.image[0],
        size: selectedAttributes["Kích Thước"] || "",
        color: selectedAttributes["Màu sắc"] || "",
        regularPrice: selectedVariation?.regularPrice || firstActiveVariation?.regularPrice || 0,
        salePrice: selectedVariation?.salePrice || firstActiveVariation?.salePrice || 0,
        quantity,
        stock: selectedVariation?.stock || firstActiveVariation?.stock || 0,
        selected: true,
      };
      localStorage.setItem("selectedCartItems", JSON.stringify([selectedProduct]));
      setTimeout(() => navigate("/checkout"), 1000);
    } catch (error) {
      message.error("Có lỗi xảy ra khi mua hàng!");
    } finally {
      setIsBuyingNow(false);
    }
  };

  const isVideo = (url: string): boolean => {
    return url.includes('/video/') || url.endsWith('.mp4') || url.endsWith('.mov');
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
          <Button type="primary" onClick={() => navigate("/")} className="mt-4">
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
                <Image src={mainImage} alt={product.name} className="w-full aspect-square object-cover rounded-lg" />
                <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs">
                  {displayImages.indexOf(mainImage) + 1}/{displayImages.length}
                </div>
              </div>
              <div className="mt-4">
                {displayImages.length > 4 ? (
                  <div className="overflow-x-auto">
                    <div className="flex gap-4 pb-2" style={{ width: `${displayImages.length * 80}px` }}>
                      {displayImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => handleThumbnailClick(img, i)}
                          className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden transition-all duration-200 ${i === selectedImageIndex ? "ring-2 ring-green-300 shadow-lg" : "ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-md"
                            }`}
                        >
                          <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-4">
                    {displayImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => handleThumbnailClick(img, i)}
                        className={`aspect-square rounded-lg overflow-hidden transition-all duration-200 ${i === selectedImageIndex ? "ring-2 ring-green-300 shadow-lg" : "ring-1 ring-gray-200 hover:ring-gray-300 hover:shadow-md"
                          }`}
                      >
                        <img src={img} alt={`${product.name} ${i + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold mb-2 text-gray-900">{product.name}</h1>
              <div className="flex items-center gap-6 mb-6 border-b border-gray-200 pb-2">
                <div className="flex items-center gap-2">
                  <Rate disabled value={product.averageRating || 0} className="text-base" />
                  <span className="text-sm font-medium text-yellow-600">{(product.averageRating || 0).toFixed(1)}</span>
                </div>
                <span className="text-sm font-medium text-gray-600">| {reviewsData?.totalComments || 0} đánh giá</span>
                <span className="text-sm font-medium text-gray-600">| Đã bán: {product.selled || 0}</span>
              </div>
              <div className="text-3xl font-bold mb-4" style={{ color: "#8BC42D" }}>
                {Object.keys(selectedAttributes).length === 0 && minPrice && maxPrice && minPrice !== maxPrice
                  ? `${minPrice.toLocaleString("vi-VN")}đ - ${maxPrice.toLocaleString("vi-VN")}đ`
                  : `${price.toLocaleString("vi-VN")}đ`}
              </div>
              <div className="space-y-2 text-gray-700 text-sm mb-6">
                <div><strong>Tình trạng:</strong> {inStock ? "Còn hàng" : "Hết hàng"}</div>
                <div><strong>Danh mục:</strong> {product.categoryName}</div>
                <div><strong>Thương hiệu:</strong> {product.brandName}</div>
              </div>
              {attributes.map((attr) => (
                <div key={attr.attributeName} className="mb-6">
                  <div className="font-semibold mb-2">
                    {attr.attributeName === "Test Color"
                      ? "Màu sắc:"
                      : attr.attributeName === "Test Kích Thước"
                        ? "Kích thước:"
                        : attr.attributeName.toUpperCase() + ":"}
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    {attr.values.map((value) => {
                      const isSelected = selectedAttributes[attr.attributeName] === value;
                      const isColor = attr.attributeName.toLowerCase().includes("màu") || attr.attributeName.toLowerCase().includes("color");
                      return isColor ? (
                        <div
                          key={value}
                          className={`w-8 h-8 rounded-full cursor-pointer border-2 transition-all duration-200 ${isSelected ? "ring-2 ring-yellow-500 border-yellow-500 scale-110" : "border-gray-300 hover:border-yellow-400 hover:scale-105"
                            }`}
                          style={{ background: value }}
                          onClick={() => {
                            setSelectedAttributes((prev) => ({
                              ...prev,
                              [attr.attributeName]: prev[attr.attributeName] === value ? "" : value,
                            }));
                            setIsManualImageSelection(false);
                          }}
                        />
                      ) : (
                        <Radio.Button
                          key={value}
                          value={value}
                          className={`min-w-[60px] text-center transition-all duration-200 ${isSelected ? "border-2 border-yellow-500 hover:border-yellow-500" : "border-gray-300 hover:border-yellow-400"
                            }`}
                          onClick={() => {
                            setSelectedAttributes((prev) => ({
                              ...prev,
                              [attr.attributeName]: prev[attr.attributeName] === value ? "" : value,
                            }));
                            setIsManualImageSelection(false);
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
                      onClick={() => handleQuantityChange("decrease")}
                      disabled={quantity <= 1}
                    >
                      –
                    </button>
                    <input
                      value={quantity}
                      onChange={(e) => handleManualQuantityChange(e.target.value)}
                      onBlur={() => quantity < 1 && setQuantity(1)}
                      className="w-12 h-10 text-center text-gray-600 font-semibold border-x border-gray-300 focus:outline-none"
                      style={{ borderLeftColor: "#D1D5DB", borderRightColor: "#D1D5DB", borderTopColor: "#F9FAFB", borderBottomColor: "#F9FAFB" }}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={String(selectedVariation?.stock || 1).length}
                    />
                    <button
                      type="button"
                      className="w-10 h-10 flex items-center justify-center text-gray-600 text-xl font-light hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => handleQuantityChange("increase")}
                      disabled={quantity >= (selectedVariation?.stock || 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="text-sm text-gray-500">
                    {selectedVariation?.stock ? `Tối đa ${selectedVariation.stock} sản phẩm` : "Hết hàng"}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-6">
                <Button
                  size="large"
                  icon={liked ? <HeartFilled style={{ color: "#ff4d4f", fontSize: "24px" }} /> : <HeartOutlined style={{ fontSize: "24px", color: "#595959" }} />}
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
                  {isBuyingNow ? "Đang xử lý..." : "Mua ngay"}
                </Button>
              </div>
              <div className="flex justify-between border-t pt-4 text-sm text-gray-600">
                <div
                  className="flex items-center gap-2 cursor-pointer hover:text-green-600"
                  onClick={() => setIsSizeGuideVisible(true)}
                >
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
                <p>{product.description}</p>
                {product.image?.[0] && (
                  <div className="flex justify-center">
                    <img src={product.image[0]} alt="Chi tiết sản phẩm" className="w-full max-w-md rounded-lg shadow-md" />
                  </div>
                )}
              </div>
            </Tabs.TabPane>
            <Tabs.TabPane tab="ĐÁNH GIÁ" key="2">
              {isLoadingReviews ? (
                <div className="flex justify-center py-4">
                  <Spin tip="Đang tải đánh giá..." />
                </div>
              ) : reviewsData?.comments.length === 0 ? (
                <div className="text-center text-gray-700 py-4">Sản phẩm chưa có đánh giá</div>
              ) : (
                <div className="mt-4 space-y-6">
                  <div className="bg-gray-50 p-6 rounded-lg shadow-sm">
                    <div className="text-center">
                      <Rate disabled value={reviewsData?.averageRating || 0} className="text-4xl" />
                      <p className="text-3xl font-bold mt-2">{(reviewsData?.averageRating || 0).toFixed(1)} / 5</p>
                      <p className="text-gray-600 mt-1">Dựa trên {reviewsData?.totalComments || 0} đánh giá</p>
                    </div>
                    <div className="mt-6 grid grid-cols-5 gap-4">
                      {[5, 4, 3, 2, 1].map((star) => {
                        const countValue = ratingDistribution[star.toString()];
                        const total = reviewsData?.totalComments || reviewsData?.comments.length || 0;
                        const percentage = total > 0 ? (countValue / total) * 100 : 0;
                        return (
                          <div key={star} className="flex items-center gap-2">
                            <span className="text-sm font-medium">{star} sao</span>
                            <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                              <div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                            <span className="text-sm text-gray-600">{countValue}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex justify-end mb-4">
                    <Radio.Group value={filterRating} onChange={(e) => setFilterRating(e.target.value)} buttonStyle="solid">
                      <Radio.Button value="all">Tất cả</Radio.Button>
                      <Radio.Button value="5">5 sao</Radio.Button>
                      <Radio.Button value="4">4 sao</Radio.Button>
                      <Radio.Button value="3">3 sao</Radio.Button>
                      <Radio.Button value="2">2 sao</Radio.Button>
                      <Radio.Button value="1">1 sao</Radio.Button>
                    </Radio.Group>
                  </div>
                  {reviewsData?.comments
                    .filter((review) => filterRating === "all" || review.rating.toString() === filterRating)
                    .map((review) => {
                      const [reviewText, productQuality] = review.content.split('\nChất lượng sản phẩm: ');
                      return (
                        <div key={review._id} className="border p-4 rounded-lg shadow-sm bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {review.userId?.avatar ? (
                                <img
                                  src={review.userId.avatar}
                                  alt="avatar"
                                  style={{
                                    width: 32,
                                    height: 32,
                                    borderRadius: "50%",
                                    objectFit: "cover",
                                  }}
                                />
                              ) : (
                                <Avatar
                                  size={32}
                                  style={{
                                    backgroundColor: "#7265e6",
                                    verticalAlign: "middle",
                                  }}
                                >
                                  {review.userId?.fullName?.charAt(0)?.toUpperCase() || "A"}
                                </Avatar>
                              )}
                              <span className="text-sm font-medium text-gray-800">{review.userId?.fullName || "Ẩn danh"}</span>
                              <Rate disabled value={review.rating} className="text-sm" />
                            </div>
                            <span className="text-xs text-gray-500">{new Date(review.createdAt).toLocaleDateString("vi-VN")}</span>
                          </div>
                          <p className="text-gray-700 mb-2">Đánh giá: {reviewText || "Không có đánh giá"}</p>
                          <p className="text-gray-700 mb-2">Chất lượng sản phẩm: {productQuality || "Không có đánh giá chất lượng"}</p>
                          {review.images.length > 0 && (
                            <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                              {review.images.map((media, index) => (
                                <div
                                  key={index}
                                  className="relative w-16 h-16 rounded-lg overflow-hidden cursor-pointer"
                                  onClick={() => setPreviewMedia({ url: media, type: isVideo(media) ? "video" : "image" })}
                                >
                                  {isVideo(media) ? (
                                    <>
                                      <video
                                        src={media}
                                        className="w-full h-full object-cover"
                                        muted
                                        onMouseOver={(e) => e.currentTarget.play()}
                                        onMouseOut={(e) => e.currentTarget.pause()}
                                      />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-white text-2xl" style={{ textShadow: "0 0 4px rgba(0, 0, 0, 0.5)" }}>
                                          ▶
                                        </span>
                                      </div>
                                    </>
                                  ) : (
                                    <img src={media} alt={`Hình ảnh đánh giá ${index + 1}`} className="w-full h-full object-cover" />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <Tooltip title="Đánh dấu hữu ích">
                              <Button type="link" size="small" className="text-green-500 hover:text-green-700">
                                Hữu ích ({review.helpfulness || 0})
                              </Button>
                            </Tooltip>
                            <span className="text-xs text-gray-400">{review.adminReply ? "Đã phản hồi" : ""}</span>
                          </div>
                          {review.adminReply && <p className="mt-2 text-green-600 text-sm italic">Phản hồi: {review.adminReply}</p>}
                        </div>
                      );
                    })}
                </div>
              )}
            </Tabs.TabPane>
          </Tabs>
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6 border-b-2 border-orange-400 inline-block pb-2">Sản phẩm cùng danh mục</h2>
            {isLoadingRelated ? (
              <div className="flex justify-center py-8">
                <Spin tip="Đang tải sản phẩm liên quan..." />
              </div>
            ) : !filteredRelatedProducts.length ? (
              <div className="text-center py-8 text-gray-500">Không có sản phẩm cùng danh mục nào khác</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {filteredRelatedProducts.map((p) => {
                  const price = p.variation?.[0]?.salePrice > 0 ? p.variation[0].salePrice : p.variation?.[0]?.regularPrice || 0;
                  const discount =
                    p.variation?.[0]?.salePrice > 0 && p.variation[0].salePrice < p.variation[0].regularPrice
                      ? Math.round((1 - p.variation[0].salePrice / p.variation[0].regularPrice) * 100)
                      : 0;
                  return (
                    <div
                      key={p._id}
                      className="border p-4 rounded-lg hover:shadow-lg cursor-pointer transition-shadow"
                      onClick={() => navigate(`/products/${p.slug}`)}
                    >
                      <div className="relative aspect-square overflow-hidden rounded">
                        <img src={p.image[0]} alt={p.name} className="w-full h-full object-cover" />
                        {p.isActive && (
                          <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-bl-md rounded-tr-md">Mới</span>
                        )}
                        {discount > 0 && (
                          <span className="absolute top-10 left-2 bg-red-500 text-white text-xs px-1 py-1 rounded-bl-md rounded-tr-md">-{discount}%</span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold truncate mt-4">{p.name}</h3>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-red-500 font-bold">{price.toLocaleString("vi-VN")}đ</span>
                        {discount > 0 && <span className="text-gray-400 line-through text-xs">{p.variation?.[0]?.regularPrice.toLocaleString("vi-VN")}đ</span>}
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
              {Array(5)
                .fill(0)
                .map((_, i) => {
                  const key = `category-${i}`;
                  return (
                    <li
                      key={key}
                      onClick={() => setSelectedCategory(key)}
                      className={`flex justify-between items-center cursor-pointer px-2 py-3 ${selectedCategory === key ? "bg-gray-200 font-semibold" : "hover:bg-gray-100"
                        }`}
                    >
                      <span className="text-gray-800 text-sm font-medium">Tin khuyến mãi</span>
                      <span className="text-gray-400 text-base font-bold">+</span>
                    </li>
                  );
                })}
            </ul>
          </div>
          <div className="mb-6 bg-gray-100 p-5">
            <h2 className="text-base font-bold mb-4">Các sản phẩm mới ra mắt</h2>
            <div className="relative mb-4">
              <div className="h-1 w-20 bg-orange-400" />
              <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300" />
            </div>
            {isLoadingNew ? (
              <div className="flex justify-center py-2">
                <Spin size="small" tip="Đang tải sản phẩm mới..." />
              </div>
            ) : !filteredNewProducts.length ? (
              <div className="text-gray-500 text-sm text-center py-2">Chưa có sản phẩm mới</div>
            ) : (
              <div className="space-y-4">
                {filteredNewProducts.map((p) => {
                  const price = p.variation?.[0]?.salePrice > 0 ? p.variation[0].salePrice : p.variation?.[0]?.regularPrice || 0;
                  return (
                    <div
                      key={p._id}
                      className="flex space-x-3 border-b pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => navigate(`/products/${p.slug}`)}
                    >
                      <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded">
                        <img src={p.image[0] || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 truncate">{p.name}</h3>
                        <p className="mt-1 text-sm font-medium text-red-500">{price.toLocaleString("vi-VN")}đ</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Sider>
      </div>
      <Modal
        title="Hướng Dẫn Chọn Size"
        open={isSizeGuideVisible}
        onOk={() => setIsSizeGuideVisible(false)}
        onCancel={() => setIsSizeGuideVisible(false)}
        footer={[
          <Button key="close" onClick={() => setIsSizeGuideVisible(false)}>
            Đóng
          </Button>,
        ]}
      >
        <img src={chon_size} alt="Size Guide" width="100%" />
      </Modal>
      <Modal open={!!previewMedia} onCancel={() => setPreviewMedia(null)} footer={null} width={800}>
        {previewMedia && (
          <div className="flex justify-center">
            {previewMedia.type === "video" ? (
              <video src={previewMedia.url} controls className="w-full max-h-[500px] object-contain" />
            ) : (
              <img src={previewMedia.url} alt="Media preview" className="w-full max-h-[500px] object-contain" />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}