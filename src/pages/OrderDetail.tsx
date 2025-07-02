import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button as AntButton, Tag, Spin } from 'antd';
import message from 'antd/es/message';
import { userGetOrder } from '../services/authService';
import { SidebarLink } from '../components/SidebarLink';
import { statusLabels, paymentStatusLabels, getStatusColor } from './Order';
import { Order } from '../interface/order.interfcace';

const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
        const userId = localStorage.getItem('userId');
        const res = await userGetOrder(userId || '');
        if (res.success) {
            const selectedOrder = res.data.find((o: Order) => o._id === orderId);
            if (selectedOrder) {
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

    if (!order) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6">

                <main className="flex-1">
                    <div className="bg-white rounded-lg shadow-sm p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <h2 className="text-xl font-semibold">Chi tiết đơn hàng - {order.orderCode}</h2>
                            <Tag color={getStatusColor(order.status)}>{statusLabels[order.status]}</Tag>
                        </div>

                        <div className="space-y-4 text-sm">
                            <div>
                                <strong className="text-gray-700">Trạng thái:</strong>
                                <span className="ml-2">{statusLabels[order.status]}</span>
                            </div>
                            <div>
                                <strong className="text-gray-700">Ngày đặt:</strong>
                                <span className="ml-2">{formatDate(order.createdAt)}</span>
                            </div>
                            <div>
                                <strong className="text-gray-700">Ngày giao dự kiến:</strong>
                                <span className="ml-2">
                                    {order.status === 4 && order.updatedAt
                                        ? formatDate(order.updatedAt)
                                        : order.deliveryDate
                                            ? formatDate(order.deliveryDate)
                                            : 'Chưa xác định'}
                                </span>
                            </div>
                            <div>
                                <strong className="text-gray-700">Thanh toán:</strong>
                                <span className="ml-2">{order.paymentMethod} - {paymentStatusLabels[order.paymentStatus]}</span>
                            </div>
                            <div>
                                <strong className="text-gray-700">Sản phẩm:</strong>
                                <ul className="list-disc ml-5 mt-1 space-y-1">
                                    {order.items.map(item => (
                                        <li key={item._id}>
                                            {item.productName} x {item.quantity} - {item.totalPrice.toLocaleString('vi-VN')} ₫
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div>
                                <strong className="text-gray-700">Địa chỉ giao hàng:</strong>
                                <span className="ml-2">{order.shippingAddress}</span>
                            </div>
                            <div>
                                <strong className="text-gray-700">Tạm tính:</strong>
                                <span className="ml-2">{order.subtotal.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            {order.shippingFee > 0 && (
                                <div>
                                    <strong className="text-gray-700">Phí vận chuyển:</strong>
                                    <span className="ml-2">{order.shippingFee.toLocaleString('vi-VN')} ₫</span>
                                </div>
                            )}
                            {order.discountAmount > 0 && (
                                <div>
                                    <strong className="text-gray-700">Giảm giá:</strong>
                                    <span className="ml-2 text-red-600">-{order.discountAmount.toLocaleString('vi-VN')} ₫</span>
                                </div>
                            )}
                            <div className="text-base font-semibold">
                                <strong className="text-gray-700">Tổng cộng:</strong>
                                <span className="ml-2 text-red-600">{order.totalAmount.toLocaleString('vi-VN')} ₫</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <AntButton
                                onClick={() => navigate('/user/order')}
                                className="bg-blue-500 hover:bg-blue-600 text-white"
                            >
                                Quay lại
                            </AntButton>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default OrderDetail;