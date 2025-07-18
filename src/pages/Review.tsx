import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Input, message, Modal, Rate, Spin, Upload } from 'antd';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { productService } from '../services/product.service';
import { reviewService } from '../services/review.service';
import { orderService } from '../services/orderServices';
import { useAuth } from '../auth/AuthContext ';
import { OrderItem } from '../interface/order.interfcace';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
const { TextArea } = Input;

const CLOUDINARY_URL = 'https://api.cloudinary.com/v1_1/dtwm0rpqg/auto/upload';

interface Review {
  productId: string;
  rating: number;
  reviewText: string;
  productQuality: string;
  media: string[];
}

const uploadFileToCloudinary = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', 'Binova_Upload');

  const allowedFormats = ['image/jpeg', 'image/png', 'video/mp4', 'video/mov'];
  if (!allowedFormats.includes(file.type)) {
    throw new Error('Định dạng tệp không được hỗ trợ! Chỉ hỗ trợ ảnh (jpg, png) hoặc video (mp4, mov).');
  }

  try {
    const response = await fetch(CLOUDINARY_URL, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
    }
    const result = await response.json();
    return result.secure_url;
  } catch (error) {
    throw new Error('Lỗi khi upload tệp: ' + (error as Error).message);
  }
};

const isVideo = (url: string): boolean => {
  return url.includes('/video/') || url.endsWith('.mp4') || url.endsWith('.mov');
};

const ProductReviewPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, refreshAccessToken } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get('orderId');
  const { state } = location;
  const orderItems: OrderItem[] = state?.items || [];

  const uniqueProducts: OrderItem[] = Array.from(
    new Map(orderItems.map((item) => [item.productId, item])).values()
  );

  const productQueries = uniqueProducts.map((item) =>
    useQuery({
      queryKey: ['product', item.productId],
      queryFn: () => productService.getProductById(item.productId),
      enabled: !!item.productId && isAuthenticated,
    })
  );

  const [reviews, setReviews] = useState<Review[]>(
    uniqueProducts.map((item) => ({
      productId: item.productId,
      rating: 0,
      reviewText: '',
      productQuality: '',
      media: [],
    }))
  );

  const [previewMedia, setPreviewMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);

  const addReviewMutation = useMutation({
    mutationFn: async (reviewData: { productId: string; orderId: string; content: string; rating: number; images: string[] }) => {
      let token = localStorage.getItem('accessToken');
      if (!token) {
        token = await refreshAccessToken();
        if (!token) throw new Error('Không thể làm mới token');
      }
      return reviewService.addReview(reviewData);
    },
    onSuccess: (_, variables) => {
      const product = uniqueProducts.find((item) => item.productId === variables.productId);
      const productName = product ? product.name : 'Sản phẩm';
      message.success(`Đánh giá cho ${productName} thành công!`);
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.productId] });
    },
    onError: (error: any) => {
      message.error(error.response?.data?.message || 'Đã xảy ra lỗi!');
    },
  });

  const handleFileUpload = async (index: number, file: File) => {
    try {
      const fileUrl = await uploadFileToCloudinary(file);
      setReviews((prev) =>
        prev.map((review, i) =>
          i === index ? { ...review, media: [...review.media, fileUrl] } : review
        )
      );
      message.success('Tệp đã được tải lên thành công!');
    } catch (error) {
      console.error('Upload error:', error);
      message.error((error as Error).message || 'Lỗi khi upload tệp');
    }
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user?._id || !orderId) {
      message.error('Vui lòng đăng nhập và chọn đơn hàng!');
      navigate('/login');
      return;
    }

    const invalidReviews = reviews.filter(
      (review) => review.rating === 0 || !review.reviewText.trim() || !review.productQuality.trim()
    );

    if (invalidReviews.length > 0) {
      message.error('Vui lòng điền đầy đủ thông tin đánh giá cho tất cả sản phẩm!');
      return;
    }

    try {
      await orderService.updateReviewStatus(orderId, 1);
    } catch (error) {
      message.error('Lỗi khi cập nhật trạng thái đánh giá!');
      return;
    }

    let successCount = 0;
    const successfulProducts: OrderItem[] = [];
    for (const review of reviews) {
      try {
        await addReviewMutation.mutateAsync({
          productId: review.productId,
          orderId: orderId,
          content: `${review.reviewText}\nChất lượng sản phẩm: ${review.productQuality}`,
          rating: Math.round(review.rating),
          images: review.media,
        });
        successCount++;
        const product = uniqueProducts.find((item) => item.productId === review.productId);
        if (product) successfulProducts.push(product);
      } catch (error) {
        message.error(`Lỗi khi đánh giá sản phẩm ${review.productId}: ${(error as any)?.response?.data?.message || 'Đã xảy ra lỗi!'}`);
      }
    }

    if (successCount === reviews.length) {
      message.success('Tất cả đánh giá đã được gửi!');
      if (successfulProducts.length > 0) {
        const firstProductId = successfulProducts[0].productId;
        const productData = await productService.getProductById(firstProductId);
        if (productData && productData.slug) {
          navigate(`/products/${productData.slug}`);
        } else {
          navigate(`/orders`);
        }
      } else {
        navigate(`/orders`);
      }
    } else if (successCount > 0) {
      message.success(`${successCount} đánh giá đã được gửi thành công, một số gặp lỗi!`);
      navigate(`/orders`);
    } else {
      message.error('Không có đánh giá nào được gửi thành công!');
      navigate(`/orders`);
    }
  };

  const handleChange = (index: number, field: keyof Review, value: string | number) => {
    setReviews((prev) =>
      prev.map((review, i) => (i === index ? { ...review, [field]: value } : review))
    );
  };

  const isLoading = productQueries.some((query) => query.isLoading);
  const hasError = productQueries.some((query) => query.error);
  const products = productQueries.map((query) => query.data as { image?: string[]; name: string } | undefined);

  if (!isAuthenticated) {
    message.error('Vui lòng đăng nhập để đánh giá sản phẩm!');
    navigate('/login');
    return null;
  }
  if (isLoading) return <div className="flex justify-center"><Spin tip="Đang tải sản phẩm..." /></div>;
  if (hasError) return <div className="text-red-500 text-center">Lỗi khi tải sản phẩm</div>;
  if (uniqueProducts.length === 0) return <div className="text-center">Không có sản phẩm để đánh giá</div>;

  return (
    <div className="max-w-2xl mx-auto p-4 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-4">Đánh Giá Sản Phẩm</h2>
      <div className="mb-4 text-green-500">Đánh giá sản phẩm để nhận 200 xu!</div>
      {reviews.map((review, index) => {
        const item = uniqueProducts[index];
        const product = products[index] || { image: ['/default-image.jpg'], name: item.name };
        return (
          <div key={index} className="mb-6 border-b pb-4">
            <div className="mb-4">
              <img src={product.image?.[0] || '/default-image.jpg'} alt={product.name} className="w-32 h-32 object-cover mb-2" />
              <p className="font-semibold">{product.name || item.name}</p>
            </div>
            <div className="mb-4">
              <span className="text-lg font-semibold">Chất lượng sản phẩm:</span>
              <Rate
                allowHalf
                value={review.rating}
                onChange={(value) => handleChange(index, 'rating', value)}
                className="ml-2"
              />
              <span className="ml-2 text-gray-500">{review.rating ? `${review.rating} sao` : ''}</span>
            </div>
            <div className="mb-4">
              <p className="text-gray-700">Đánh giá của bạn:</p>
              <TextArea
                value={review.reviewText}
                onChange={(e) => handleChange(index, 'reviewText', e.target.value)}
                placeholder="Hãy để lại đánh giá"
                rows={4}
                maxLength={500}
                className="w-full"
              />
            </div>
            <div className="mb-4">
              <p className="text-gray-700">Chất lượng sản phẩm:</p>
              <TextArea
                value={review.productQuality}
                onChange={(e) => handleChange(index, 'productQuality', e.target.value)}
                placeholder="Hãy chia sẻ nhận định của bạn tích cực hoặc tiêu cực về sản phẩm"
                rows={4}
                maxLength={500}
                className="w-full"
              />
            </div>
            <div className="mb-4">
              <p className="text-gray-700">Tải lên hình ảnh hoặc video:</p>
              <Upload
                listType="picture-card"
                beforeUpload={async (file: File) => {
                  await handleFileUpload(index, file);
                  return false;
                }}
                accept="image/jpeg,image/png,video/mp4,video/mov"
                fileList={review.media.map((url, i) => ({
                  uid: i.toString(),
                  name: `file-${i}${url.includes('video') ? '.mp4' : '.jpg'}`,
                  url,
                  status: 'done',
                  type: url.includes('video') ? 'video/mp4' : 'image/jpeg',
                }))}
                onRemove={(file) => {
                  setReviews((prev) =>
                    prev.map((r, i) =>
                      i === index
                        ? { ...r, media: r.media.filter((media) => media !== file.url) }
                        : r
                    )
                  );
                }}
                customRequest={() => {}}
                showUploadList={{
                  showPreviewIcon: true,
                  showRemoveIcon: true,
                }}
                itemRender={(_, file) => {
                  return (
                    <div
                      className="relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer"
                      onClick={() => setPreviewMedia({ url: file.url || '', type: isVideo(file.url || '') ? 'video' : 'image' })}
                    >
                      {isVideo(file.url || '') ? (
                        <>
                          <video
                            src={file.url}
                            className="w-full h-full object-cover"
                            muted
                            onMouseOver={(e) => e.currentTarget.play()}
                            onMouseOut={(e) => e.currentTarget.pause()}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-white text-2xl" style={{ textShadow: '0 0 4px rgba(0, 0, 0, 0.5)' }}>
                              ▶
                            </span>
                          </div>
                        </>
                      ) : (
                        <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                      )}
                      <Button
                        type="text"
                        icon={<DeleteOutlined />}
                        className="absolute top-1 right-1 bg-white/80 rounded-full p-1 hover:bg-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          setReviews((prev) =>
                            prev.map((r, i) =>
                              i === index
                                ? { ...r, media: r.media.filter((media) => media !== file.url) }
                                : r
                            )
                          );
                        }}
                      />
                    </div>
                  );
                }}
                multiple
              >
                {review.media.length >= 5 ? null : (
                  <div>
                    <UploadOutlined />
                    <div style={{ marginTop: 8 }}>Tải ảnh hoặc video lên</div>
                  </div>
                )}
              </Upload>
              <style>
                {`
                  .image-upload-row .ant-upload-list-item {
                    display: inline-block;
                    margin-right: 8px;
                    margin-bottom: 8px;
                    width: 80px !important;
                    height: 80px !important;
                    position: relative;
                  }
                  .image-upload-row .ant-upload-list-item-image, 
                  .image-upload-row .ant-upload-list-item-video {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                  }
                  .image-upload-row .ant-upload-list-item .ant-upload-list-item-info {
                    padding: 0;
                  }
                  .image-upload-row .ant-upload.ant-upload-select-picture-card {
                    width: 80px;
                    height: 80px;
                    margin-right: 8px;
                    margin-bottom: 8px;
                    background-color: #fafafa;
                  }
                  .image-upload-row .ant-upload-list {
                    display: flex;
                    flex-wrap: nowrap;
                    overflow-x: auto;
                    max-width: 100%;
                    padding-bottom: 8px;
                  }
                  .image-upload-row .ant-upload-list::-webkit-scrollbar {
                    height: 4px;
                  }
                  .image-upload-row .ant-upload-list::-webkit-scrollbar-thumb {
                    background-color: #ccc;
                    border-radius: 2px;
                  }
                  .image-upload-row .ant-upload-list::-webkit-scrollbar-track {
                    background-color: #f1f1f1;
                  }
                  .image-upload-row .ant-upload-list-item-video {
                    position: relative;
                  }
                  .image-upload-row .ant-upload-list-item-video::after {
                    content: '▶';
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    font-size: 24px;
                    color: white;
                    text-shadow: 0 0 4px rgba(0, 0, 0, 0.5);
                  }
                  .image-upload-row .ant-upload-list-item:hover .ant-btn {
                    opacity: 1;
                  }
                  .image-upload-row .ant-btn {
                    opacity: 0.6;
                    transition: opacity 0.3s;
                  }
                `}
              </style>
            </div>
          </div>
        );
      })}
      <div className="flex justify-between">
        <Button onClick={() => navigate(-1)}>Trở Lại</Button>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={addReviewMutation.isPending}
          className="text-white"
          style={{ backgroundColor: '#4CAF50', borderColor: '#4CAF50' }}
        >
          Hoàn Thành
        </ Button>
      </div>
      <Modal
        title="Xem trước media"
        open={!!previewMedia}
        onCancel={() => setPreviewMedia(null)}
        footer={null}
        width={800}
      >
        {previewMedia && (
          <div className="flex justify-center">
            {previewMedia.type === 'video' ? (
              <video
                src={previewMedia.url}
                controls
                className="w-full max-h-[500px] object-contain"
              />
            ) : (
              <img
                src={previewMedia.url}
                alt="Media preview"
                className="w-full max-h-[500px] object-contain"
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductReviewPage;