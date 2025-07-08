import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button as AntButton, Tag, Spin } from 'antd';
import message from 'antd/es/message';
import { userGetOrder } from '../services/authService';
import { SidebarLink } from '../components/SidebarLink';
import { statusLabels, paymentStatusLabels, getStatusColor } from './Order';
import { Order } from '../interface/order.interfcace';
import { useAuth } from '../auth/AuthContext ';

const statusMap: Record<string, number> = {
    'Cho xac nhan': 0,
    'Chờ xác nhận': 0,
    'Da xac nhan': 1,
    'Đã xác nhận': 1,
    'Dang giao hang': 2,
    'Đang giao hàng': 2,
    'Da giao hang': 3,
    'Đã giao hàng': 3,
    'Hoan thanh': 4,
    'Hoàn thành': 4,
    'Da huy': 5,
    'Đã hủy': 5,
    'Hoan hang': 6,
    'Hoàn hàng': 6,
};

const paymentStatusMap: Record<string, number> = {
    'Chua thanh toan': 0,
    'Chưa thanh toán': 0,
    'Da thanh toan': 1,
    'Đã thanh toán': 1,
    'Hoan tien': 2,
    'Hoàn tiền': 2,
};

const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        });
    } catch (error) {
        return 'Chưa xác định';
    }
};

const OrderDetail = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchOrder = async () => {
        setLoading(true);
        const res = await userGetOrder();
        if (res.success) {
            const selectedOrder = res.data.find((o: Order) => o._id === orderId);
            if (selectedOrder) {
                // Convert string status to number
                selectedOrder.status =
                    typeof selectedOrder.status === 'string'
                        ? statusMap[selectedOrder.status] ?? -1
                        : selectedOrder.status;
                selectedOrder.paymentStatus =
                    typeof selectedOrder.paymentStatus === 'string'
                        ? paymentStatusMap[selectedOrder.paymentStatus] ?? -1
                        : selectedOrder.paymentStatus;

                setOrder(selectedOrder);
            } else {
                message.error('Không tìm thấy đơn hàng');
                navigate('/orders');
            }
        } else {
            message.error('Không thể tải đơn hàng');
            navigate('/orders');
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchOrder();
    }, [orderId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-100 flex justify-center items-center">
                <Spin size="large" />
            </div>
        );
    }

    if (!order) return null;

    return (
  <div className="min-h-screen bg-gray-100">
    <div className="max-w-5xl mx-auto py-10 px-6">
      <div className="bg-white rounded-xl shadow-md p-8">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M3 3h18v18H3V3z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M8 9h8M8 13h6M8 17h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="text-xl font-semibold text-gray-800">
              Đơn hàng <span className="text-blue-600">{order.orderCode}</span>
            </h2>
          </div>
          <Tag color={getStatusColor(order.status)} className="text-sm px-3 py-1">
            {statusLabels[order.status]}
          </Tag>
        </div>

        {/* Grid Info */}
        <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
          <div className="space-y-2">
            <p><strong className="text-gray-600">Trạng thái:</strong> {statusLabels[order.status]}</p>
            <p><strong className="text-gray-600">Ngày đặt:</strong> {formatDate(order.createdAt)}</p>
            <p><strong className="text-gray-600">Ngày giao dự kiến:</strong> {
              order.status === 4 && order.updatedAt
                ? formatDate(order.updatedAt)
                : order.deliveryDate
                  ? formatDate(order.deliveryDate)
                  : 'Chưa xác định'
            }</p>
            <p><strong className="text-gray-600">Thanh toán:</strong> {order.paymentMethod} - {paymentStatusLabels[order.paymentStatus]}</p>
            <p><strong className="text-gray-600">Địa chỉ giao hàng:</strong> {order.shippingAddress}</p>
          </div>

          <div>
            <p className="mb-2 font-medium text-gray-700">Sản phẩm:</p>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div key={item._id} className="p-3 border rounded-lg bg-gray-50 shadow-sm">
                  <div className="flex justify-between">
                    <div className="font-medium text-gray-800">{item.productName}</div>
                    <div className="text-sm text-gray-500">x{item.quantity}</div>
                  </div>
                  <div className="text-right text-red-600 font-semibold mt-1">
                    {item.totalPrice.toLocaleString('vi-VN')} ₫
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Tổng tiền */}
        <div className="mt-8 border-t pt-5 space-y-2 text-sm text-gray-700">
          <div className="flex justify-between">
            <span>Tạm tính:</span>
            <span>{order.subtotal.toLocaleString('vi-VN')} ₫</span>
          </div>
          {order.shippingFee > 0 && (
            <div className="flex justify-between">
              <span>Phí vận chuyển:</span>
              <span>{order.shippingFee.toLocaleString('vi-VN')} ₫</span>
            </div>
          )}
          {order.discountAmount > 0 && (
            <div className="flex justify-between text-red-500">
              <span>Giảm giá:</span>
              <span>-{order.discountAmount.toLocaleString('vi-VN')} ₫</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold border-t pt-4 mt-2 text-gray-800">
            <span>Tổng cộng:</span>
            <span className="text-red-600">{order.totalAmount.toLocaleString('vi-VN')} ₫</span>
          </div>
        </div>

        <div className="mt-8 text-right">
          <AntButton
            onClick={() => navigate('/orders')}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded"
          >
            Quay lại
          </AntButton>
        </div>
      </div>
    </div>
  </div>
);

};

export default OrderDetail;
