import {
  Button as AntButton,
  Input as AntInput,
  Checkbox,
  Form,
  InputNumber,
  Modal,
  Select,
  Tabs,
  Tag,
  Popconfirm
} from "antd";
import message from "antd/es/message";
import {
  CheckCircle,
  Clock,
  PackageCheck,
  RefreshCcw,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IOrder, OrderItem } from "../interface/order.interfcace";
import {
  cancelOrderApi,
  completeOrderApi,
  userGetOrder,
} from "../services/authService";
import { orderService } from "../services/orderServices";
import { returnRequestService } from "../services/returnRequest.service";
import socket from "../services/socket";
import { getStatusColor } from "../utils/getStatusColor";
import { statusLabels } from "../utils/statusLabels";
import axios from "axios";

const { Option } = Select;

const getStatusIcon = (status: number) => {
  switch (status) {
    case 0:
      return <Clock size={16} className="text-orange-500" />;
    case 1:
      return <CheckCircle size={16} className="text-yellow-500" />;
    case 2:
      return <Truck size={16} className="text-blue-500" />;
    case 3:
      return <PackageCheck size={16} className="text-green-500" />;
    case 4:
      return <CheckCircle size={16} className="text-green-600" />;
    case 5:
      return <XCircle size={16} className="text-red-500" />;
    case 6:
      return <RefreshCcw size={16} className="text-purple-500" />;
    default:
      return null;
  }
};

const cancelReasons = [
  "Thay đổi ý định",
  "Thay đổi địa chỉ giao hàng",
  "Muốn thêm mã giảm giá",
  "Thời gian giao hàng quá lâu",
  "Khác",
];

const returnReasons = [
  "Sản phẩm lỗi",
  "Sản phẩm không đúng mô tả",
  "Thay đổi ý định",
  "Khác",
];

const Order = () => {
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<IOrder | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<
    { productId: string; quantity: number; price: number }[]
  >([]);
  const [cancelForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const fetchOrders = async () => {
    setLoading(true);
    const res = await userGetOrder(userId || "");
    if (res.success) {
      setOrders(res.data);
    } else {
      message.error("Không thể tải đơn hàng");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    socket.on("order-status-changed", ({ message: mess }) => {
      message.success(mess);
      fetchOrders();
    });
    return () => {
      socket.off("order-status-changed");
    };
  }, [userId]);

  const showCancelModal = (order: IOrder) => {
    setSelectedOrder(order);
    setIsCancelModalVisible(true);
  };

  const showReturnModal = (order: IOrder) => {
    setSelectedOrder(order);
    setSelectedProducts([]);
    setIsReturnModalVisible(true);
    returnForm.setFieldsValue({
      customerInfo: { name: "", phone: "", email: "" },
    });
  };

  const handleCancelOrder = async (values: {
    reason: string;
    customReason?: string;
  }) => {
    if (!selectedOrder) return;

    const finalReason =
      values.reason === "Khác" && values.customReason
        ? values.customReason
        : values.reason;

    try {
      if (selectedOrder.paymentMethod === "VNPAY" && selectedOrder.paymentStatus === 1) {
        const refundResponse = await axios.post('http://localhost:8080/api/wallet/cancel-refund',
          {
            orderId: selectedOrder._id,
            type: "refund",
            amount: selectedOrder.totalAmount,
            status: 1,
            description: `Trả lại tiền đơn hàng đã hủy ${selectedOrder.orderCode}: ${finalReason}`,
          },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        const refundData = await refundResponse.data;

        if (!refundData.success) {
          message.error("Refund request failed");
          return;
        }

        // Update payment status to 2 (failed/canceled)
        // await orderService.updateOrderStatus(selectedOrder._id, 5, selectedOrder.userId);
        // await orderService.updatePaymentStatus(selectedOrder._id, 2);
      }

      // Proceed with canceling the order
      const res = await cancelOrderApi(selectedOrder._id, finalReason, userId || "");
      if (res.success) {
        message.success("Đã hủy đơn hàng");
        fetchOrders();
      } else {
        message.error("Hủy đơn hàng thất bại");
      }
    } catch (error: any) {
      message.error(error.message || "Hủy đơn hàng thất bại");
    }

    setIsCancelModalVisible(false);
    cancelForm.resetFields();
    setSelectedOrder(null);
  };

  const handleReturnOrder = async (values: {
    customerInfo: { name: string; phone: string; email?: string };
    reason: string;
    customReason?: string;
    notes?: string;
  }) => {
    if (!selectedOrder) return;
    const finalReason =
      values.reason === "Khác" && values.customReason
        ? values.customReason
        : values.reason;
    const refundAmount = selectedProducts.reduce(
      (sum, product) => sum + product.quantity * product.price,
      0
    );

    if (selectedProducts.length === 0) {
      message.error("Vui lòng chọn ít nhất một sản phẩm để trả hàng");
      return;
    }

    try {
      await returnRequestService.createReturnRequest({
        orderId: selectedOrder._id,
        reason: finalReason,
        products: selectedProducts,
        refundAmount,
        notes: values.notes,
      });
      await orderService.updateOrderStatus(selectedOrder._id, 6, selectedOrder.userId);
      message.success(`Yêu cầu trả hàng đã được gửi: ${finalReason}`);
      fetchOrders();
    } catch (error: any) {
      message.error(error.message || "Gửi yêu cầu trả hàng thất bại");
    }
    setIsReturnModalVisible(false);
    returnForm.resetFields();
    setSelectedOrder(null);
    setSelectedProducts([]);
  };

  const handleCancelModal = () => {
    setIsCancelModalVisible(false);
    cancelForm.resetFields();
    setSelectedOrder(null);
  };

  const handleReturnModalCancel = () => {
    setIsReturnModalVisible(false);
    returnForm.resetFields();
    setSelectedOrder(null);
    setSelectedProducts([]);
  };

  const getPaymentUrl = async (id: string) => {
    const res: any = await orderService.getPaymentStatus(id);
    window.open(res.data.paymentUrl, "_blank");
    message.success("Đang chuyển đến cổng thanh toán");
  };

  const completeOrder = (id: string) => {
    Modal.confirm({
      title: "Xác nhận hoàn thành đơn hàng",
      content: "Bạn có chắc muốn hoàn thành đơn hàng này?",
      okText: "Hoàn thành",
      cancelText: "Hủy",
      okButtonProps: { type: "primary", danger: false },
      onOk: async () => {
        const res = await completeOrderApi(id, userId || "");
        if (res.success) {
          message.success("Đã hoàn thành đơn hàng");
          fetchOrders();
        } else {
          message.error("Hoàn thành thất bại");
        }
      },
    });
  };

  const handleProductSelection = (
    productId: string,
    checked: boolean,
    quantity: number,
    price: number
  ) => {
    setSelectedProducts((prev) => {
      if (checked) {
        return [
          ...prev.filter((item) => item.productId !== productId),
          { productId, quantity, price },
        ];
      }
      return prev.filter((item) => item.productId !== productId);
    });
  };

  const handleQuantityChange = (productId: string, quantity: number | null) => {
    if (quantity === null || quantity < 1) return;
    setSelectedProducts((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const filteredOrders = (status?: number) =>
    orders.filter((order: IOrder) => {
      const matchSearch =
        order.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        order.items.some((item) =>
          item.productName.toLowerCase().includes(search.toLowerCase())
        );
      return matchSearch && (status === undefined || order.status === status);
    });

  const totalAmount = orders.reduce((sum, o: IOrder) => sum + o.totalAmount, 0);
  const totalDiscount = orders.reduce(
    (sum, o: IOrder) => sum + o.discountAmount,
    0
  );
  const totalPending = orders.filter((o: IOrder) => o.status === 0).length;

  const renderCardView = (orders: IOrder[]) => (
    <div>
      {orders.length === 0 ? (
        <div className="text-center text-gray-500 py-6">
          Không có đơn hàng nào
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {orders.map((order: IOrder) => (
            <div
              key={order._id}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="flex justify-between items-center mb-2" onClick={() => navigate(`/order/${order._id}`)}>
                <div className="flex items-center gap-4">
                  {order.items[0] && (
                    <>
                      <img
                        src={order.items[0].image || "/placeholder.png"}
                        alt={order.items[0].productName}
                        className="w-[100px] h-[100px] object-cover rounded-md"
                      />
                      <div className="flex flex-col">
                        <span className="font-roboto text-gray-800 text-lg">
                          {order.items[0].productName}
                        </span>
                        <span className="font-roboto text-gray-800 text-base">
                          {order.items[0].priceAtOrder?.toLocaleString("vi-VN")} ₫
                        </span>
                        <span className="font-roboto text-gray-600 text-sm">
                          x{order.items[0].quantity}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {getStatusIcon(order.status)}
                  <Tag color={getStatusColor(order.status)}>
                    {statusLabels[order.status]}
                  </Tag>
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-2">
                {order.items.length} sản phẩm
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Mã đơn hàng: {(order.orderCode || "").toUpperCase()}
              </p>
              <br />
              <hr />
              <div className="mt-6">
                <span className="text-sm text-gray-500 mb-2">Tổng cộng:</span>
                <p className="text-green-600 font-semibold mb-3 text-2xl">
                  {order.totalAmount?.toLocaleString("vi-VN")} ₫
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <AntButton
                  type="primary"
                  size="large"
                  onClick={() => navigate(`/order/${order._id}`)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Xem
                </AntButton>
                {order.status === 4 && order.items && order.items.length > 0 && order.review === 0 && (
                  <AntButton
                    type="primary"
                    size="large"
                    onClick={() => {
                      if (!order.items || order.items.length === 0) {
                        console.error("No products found in order items:", order.items);
                        message.error("Không có sản phẩm nào trong đơn hàng để đánh giá.");
                        return;
                      }
                      navigate(
                        `/review?orderId=${order._id}`,
                        {
                          state: {
                            items: order.items.map((item) => ({
                              productId: item.productId,
                              name: item.productName
                            })),
                            orderId: order._id,
                          },
                        }
                      );
                    }}
                    className="bg-blue-500 hover:bg-blue-600"
                  >
                    Đánh giá
                  </AntButton>
                )}
                {(order.status === 0 || order.status === 1) && (
                  <AntButton
                    danger
                    size="large"
                    onClick={() => showCancelModal(order)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Hủy
                  </AntButton>
                )}
                {order.status === 3 && (
                  <AntButton
                    type="primary"
                    size="large"
                    onClick={() => showReturnModal(order)}
                    className="bg-purple-500 hover:bg-purple-600"
                  >
                    Trả hàng & Hoàn tiền
                  </AntButton>
                )}
                {order.status === 3 && (
                  <Popconfirm
                    title="Xác nhận hoàn thành đơn hàng?"
                    onConfirm={() => completeOrder(order._id)}
                    okText="Hoàn thành"
                    cancelText="Hủy"
                    placement="topRight"
                  >
                    <AntButton
                      className="bg-green-600 text-white"
                      size="large"
                    >
                      Hoàn thành
                    </AntButton>
                  </Popconfirm>
                )}
                {order.status === 0 && order.paymentMethod === "VNPAY" && (
                  <AntButton
                    type="primary"
                    size="large"
                    onClick={() => getPaymentUrl(order._id)}
                  >
                    Thanh toán
                  </AntButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="mb-6">
        <AntInput
          placeholder="Tìm mã đơn hàng, sản phẩm..."
          value={search}
          style={{ width: "230px" }}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-md"
          prefix={
            <svg
              className="w-4 h-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
              />
            </svg>
          }
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center shadow-sm">
          <div className="text-2xl font-bold text-gray-800">{orders.length}</div>
          <div className="text-sm text-gray-500">Tổng đơn hàng</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center shadow-sm">
          <div className="text-2xl font-bold text-gray-800">{totalPending}</div>
          <div className="text-sm text-gray-500">Chờ xác nhận</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center shadow-sm">
          <div className="text-2xl font-bold text-gray-800">
            {(totalAmount / 1e6).toFixed(1)}M
          </div>
          <div className="text-sm text-gray-500">Tổng giá trị</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center shadow-sm">
          <div className="text-2xl font-bold text-gray-800">
            {(totalDiscount / 1e6).toFixed(1)}M
          </div>
          <div className="text-sm text-gray-500">Tiết kiệm</div>
        </div>
      </div>

      <Tabs
        defaultActiveKey="all"
        className="rounded-lg"
        items={[
          {
            key: "all",
            label: "Tất cả",
            children: renderCardView(filteredOrders()),
          },
          ...Object.entries(statusLabels).map(([key, value]) => ({
            key,
            label: value,
            children: renderCardView(filteredOrders(parseInt(key))),
          })),
        ]}
      />

      {/* Cancel Order Modal */}
      <Modal
        title="Hủy đơn hàng"
        open={isCancelModalVisible}
        onCancel={handleCancelModal}
        footer={null}
        className="rounded-lg"
      >
        <Form form={cancelForm} onFinish={handleCancelOrder} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do hủy"
            rules={[{ required: true, message: "Vui lòng chọn lý do hủy" }]}
          >
            <Select placeholder="Chọn lý do">
              {cancelReasons.map((reason) => (
                <Select.Option key={reason} value={reason}>
                  {reason}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.reason !== currentValues.reason
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("reason") === "Khác" ? (
                <Form.Item
                  name="customReason"
                  label="Lý do cụ thể"
                  rules={[
                    { required: true, message: "Vui lòng nhập lý do cụ thể" },
                  ]}
                >
                  <AntInput.TextArea
                    rows={3}
                    placeholder="Nhập lý do hủy đơn hàng"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item>
            <div className="flex gap-2 justify-end">
              <AntButton onClick={handleCancelModal}>Hủy bỏ</AntButton>
              <AntButton
                type="primary"
                htmlType="submit"
                className="bg-red-500 hover:bg-red-600"
              >
                Xác nhận hủy
              </AntButton>
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {/* Return and Refund Modal */}
      <Modal
        title="Trả hàng & Hoàn tiền"
        open={isReturnModalVisible}
        onCancel={handleReturnModalCancel}
        footer={null}
        className="rounded-lg"
        width={800}
      >
        <Form form={returnForm} onFinish={handleReturnOrder} layout="vertical">
          <h3 className="text-lg font-semibold mb-4">Danh sách sản phẩm</h3>
          <div className="mb-4">
            {selectedOrder?.items.map((item: OrderItem) => (
              <div
                key={item.productId}
                className="flex items-center justify-between p-2 border-b"
              >
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectedProducts.some((p) => p.productId === item.productId)}
                    onChange={(e) =>
                      handleProductSelection(
                        item.productId,
                        e.target.checked,
                        item.quantity,
                        item.priceAtOrder
                      )
                    }
                  />
                  <img
                    src={item.image || "/placeholder.png"}
                    alt={item.productName}
                    className="w-12 h-12 object-cover rounded-md"
                  />
                  <div className="flex flex-col">
                    <span className="font-medium">{item.productName}</span>
                    <span className="text-sm text-gray-500">
                      {item.priceAtOrder?.toLocaleString("vi-VN")} ₫ x {item.quantity}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <InputNumber
                    min={1}
                    max={item.quantity}
                    value={
                      selectedProducts.find((p) => p.productId === item.productId)?.quantity || 1
                    }
                    onChange={(value) =>
                      handleQuantityChange(item.productId, value as number)
                    }
                    disabled={!selectedProducts.some((p) => p.productId === item.productId)}
                    className="w-20"
                  />
                  <span className="font-semibold">
                    {(
                      (selectedProducts.find((p) => p.productId === item.productId)?.quantity || 0) *
                      item.priceAtOrder
                    )?.toLocaleString("vi-VN")} ₫
                  </span>
                </div>
              </div>
            ))}
          </div>
          <Form.Item label="Tổng tiền hoàn (VNĐ)" shouldUpdate>
            {() => (
              <span className="text-red-600 font-semibold">
                {selectedProducts
                  .reduce((sum, p) => sum + (p.quantity * p.price), 0)
                  .toLocaleString("vi-VN")} ₫
              </span>
            )}
          </Form.Item>

          <Form.Item
            name="reason"
            label="Lý do trả hàng"
            rules={[{ required: true, message: "Vui lòng chọn lý do trả hàng" }]}
          >
            <Select placeholder="Chọn lý do">
              {returnReasons.map((reason) => (
                <Select.Option key={reason} value={reason}>
                  {reason}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(prevValues, currentValues) =>
              prevValues.reason !== currentValues.reason
            }
          >
            {({ getFieldValue }) =>
              getFieldValue("reason") === "Khác" ? (
                <Form.Item
                  name="customReason"
                  label="Lý do cụ thể"
                  rules={[
                    { required: true, message: "Vui lòng nhập lý do cụ thể" },
                  ]}
                >
                  <AntInput.TextArea
                    rows={3}
                    placeholder="Nhập lý do trả hàng"
                  />
                </Form.Item>
              ) : null
            }
          </Form.Item>
          <Form.Item name="notes" label="Ghi chú bổ sung">
            <AntInput.TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
          </Form.Item>
          <Form.Item>
            <div className="flex gap-2 justify-end">
              <AntButton onClick={handleReturnModalCancel}>Hủy bỏ</AntButton>
              <AntButton
                type="primary"
                htmlType="submit"
                className="bg-purple-500 hover:bg-purple-600"
                disabled={selectedProducts.length === 0}
              >
                Gửi yêu cầu
              </AntButton>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Order;