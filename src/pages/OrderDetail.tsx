import {
  Button as AntButton,
  Input as AntInput,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Form,
  InputNumber,
  message,
  Modal,
  Row,
  Select,
  Space,
  Steps,
  Table,
  Tag,
  Typography,
  Popconfirm
} from "antd";
import {
  CalendarOutlined,
  EnvironmentOutlined,
} from "@ant-design/icons";
import axios from "axios";
import {
  CheckCircle,
  Clock,
  PackageCheck,
  Truck
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { IOrder, OrderItem } from "../interface/order.interfcace";
import { orderService } from "../services/orderServices";
import socket from "../services/socket";
const API_URL = "http://localhost:8080/api";

const { TextArea } = AntInput;
const { Text } = Typography;

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

const deliverySteps = [
  { title: "Chờ xác nhận", description: "Đơn hàng đang chờ xác nhận", icon: <Clock size={20} className="text-w-500" /> },
  { title: "Đã xác nhận", description: "Đơn hàng đã được xác nhận", icon: <CheckCircle size={20} className="text-w-500" /> },
  { title: "Đang giao hàng", description: "Đơn hàng đang được vận chuyển", icon: <Truck size={20} className="text-w-500" /> },
  { title: "Đã giao hàng", description: "Đơn hàng đã giao thành công", icon: <PackageCheck size={20} className="text-w-500" /> },
  { title: "Hoàn thành", description: "Đơn hàng đã hoàn thành", icon: <CheckCircle size={20} className="text-w-600" /> },
];

const statusLabels = {
  0: "Chờ xác nhận",
  1: "Đã xác nhận",
  2: "Đang giao hàng",
  3: "Đã giao hàng",
  4: "Hoàn thành",
  5: "Đã hủy",
  6: "Yêu cầu trả hàng",
};

const statusTimestamps = {
  0: "2025-07-17 10:00 AM",
  1: "2025-07-17 11:00 AM",
  2: "2025-07-18 09:00 AM",
  3: "2025-07-19 03:00 PM",
  4: "2025-07-20 10:00 AM",
  5: "2025-07-20 11:00 AM",
  6: "2025-07-21 02:00 PM",
};

const OrderDetail = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCancelModalVisible, setIsCancelModalVisible] = useState(false);
  const [isReturnModalVisible, setIsReturnModalVisible] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState<
    { productId: string; quantity: number; price: number }[]
  >([]);
  const [returnRequest, setReturnRequest] = useState<number | null>(null);

  const [cancelForm] = Form.useForm();
  const [returnForm] = Form.useForm();
  const navigate = useNavigate();
  const userId = localStorage.getItem("userId");

  const fetchOrder = async () => {
    if (!orderId) return;
    setLoading(true);
    try {
      const res = await orderService.getOrderById(orderId);
      setOrder(res);
    } catch (error: any) {
      message.error("Không thể tải thông tin đơn hàng: " + (error.message || "Lỗi hệ thống"));
    } finally {
      setLoading(false);
    }
  };

  const fetchReturnRequest = async () => {
    const res = await getReturnRequest(orderId);
    console.log("Return Request Response:", res);

    if (res && typeof res.data.status === "number") {
      setReturnRequest(res.data.status);
    }
  };

  useEffect(() => {
    fetchOrder();
    fetchReturnRequest();
    socket.on("order-status-changed", ({ message: mess }) => {
      message.success(mess);
      fetchOrder();
    });
    return () => {
      socket.off("order-status-changed");
    };
  }, [orderId, userId]);

  const showCancelModal = () => {
    setIsCancelModalVisible(true);
  };

  const showReturnModal = () => {
    if (!order) return;
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
    if (!order || !userId) return;
    const finalReason =
      values.reason === "Khác" && values.customReason
        ? values.customReason
        : values.reason;
    try {
      await axios.patch(
        `${API_URL}/order/status/${order._id}`,
        { status: 5, userId, cancelReason: finalReason, paymentStatus: 3 },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      message.success("Đã hủy đơn hàng");
      fetchOrder();
    } catch (error) {
      message.error("Hủy thất bại");
    }
    setIsCancelModalVisible(false);
    cancelForm.resetFields();
  };

  const handleReturnOrder = async (values: {
    customerInfo: { name: string; phone: string; email?: string };
    reason: string;
    customReason?: string;
    notes?: string;
  }) => {
    if (!order) return;
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
      await axios.post(
        `${API_URL}/return-requests`,
        {
          orderId: order._id,
          reason: finalReason,
          products: selectedProducts,
          refundAmount,
          notes: values.notes,
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      await axios.patch(
        `${API_URL}/order/status/${order._id}`,
        { status: 6, userId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      message.success(`Yêu cầu trả hàng đã được gửi: ${finalReason}`);
      fetchOrder();
    } catch (error: any) {
      message.error(error.message || "Gửi yêu cầu trả hàng thất bại");
    }
    setIsReturnModalVisible(false);
    returnForm.resetFields();
    setSelectedProducts([]);
  };

  const handleCancelModal = () => {
    setIsCancelModalVisible(false);
    cancelForm.resetFields();
  };

  const handleReturnModalCancel = () => {
    setIsReturnModalVisible(false);
    returnForm.resetFields();
    setSelectedProducts([]);
  };

  const getPaymentUrl = async () => {
    if (!order) return;
    try {
      const res = await axios.get(`${API_URL}/order/payment-status/${order._id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      window.open(res.data.paymentUrl, "_blank");
      message.success("Đang chuyển đến cổng thanh toán");
    } catch (error) {
      message.error("Không thể lấy URL thanh toán");
    }
  };

  const completeOrder = async () => {
    if (!order || !userId) return;
    try {
      await axios.patch(
        `${API_URL}/order/status/${order._id}`,
        { status: 4, userId },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      message.success("Đã hoàn thành đơn hàng");
      fetchOrder();
    } catch (error) {
      message.error("Hoàn thành thất bại");
    }
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

  const handlePrintOrder = () => {
    window.print();
  };

  const formatCurrency = (value: number) => {
    return value?.toLocaleString("vi-VN") + " ₫";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("vi-VN");
  };

  const getStatusColor = (status: number) => {
    switch (status) {
      case 0: return "orange";
      case 1: return "blue";
      case 2: return "purple";
      case 3: return "green";
      case 4: return "cyan";
      case 5: return "red";
      case 6: return "purple";
      default: return "default";
    }
  };

  const getPaymentStatusColor = (status: number) => {
    switch (status) {
      case 0: return "orange";
      case 1: return "green";
      case 2: return "purple";
      case 3: return "red";
      default: return "default";
    }
  };

  const getPaymentMethodText = (method: string) => {
    const methodUpper = method.toUpperCase();
    switch (methodUpper) {
      case "COD": return "Thanh toán khi nhận hàng (COD)";
      case "VNPAY": return "Thanh toán qua VNPAY";
      default: return method;
    }
  };

  const getCurrentStep = (status: number) => {
    if (status === 5 || status === 6) return -1;
    return Math.min(status, 4);
  };

  const getReturnRequest = async (orderId: any) => {
    try {
      const res = await axios.get(`${API_URL}/return-requests/order/${orderId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return res.data;
    } catch (error) {
      return null;
    }
  };
  console.log("Return Request Status:", returnRequest);



  const productColumns = [
    {
      title: "Sản phẩm",
      key: "product",
      render: (_: any, record: OrderItem) => (
        <div className="flex items-center gap-2" onClick={() => navigate(`/products/${record.slug}`)}>
          <img
            src={record.image}
            alt=""
            style={{
              width: "50px",
              height: "50px",
              objectFit: "cover",
              borderRadius: "4px",
            }}
          />
          <strong className="text-sm">{record.productName}</strong>
        </div>
      ),
    },
    {
      title: "Phân loại",
      key: "variant",
      render: (_: any, record: OrderItem) => (
        <div>
          {record.color ? (
            <div
              style={{
                padding: "4px 8px",
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
                fontSize: "12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                width: "95px"
              }}
            >
              <Typography.Text strong style={{ color: "#000" }}>
                {/* Phân loại: */}
              </Typography.Text>
              <div
                style={{
                  width: "16px",
                  height: "16px",
                  backgroundColor: record.color,
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                }}
              />
              <span>{record.size ? `Size: ${record.size}` : ""}</span>
            </div>
          ) : (
            <Typography.Text>Không có phân loại</Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "Đơn giá",
      key: "price",
      render: (_: any, record: OrderItem) => (
        <Typography.Text strong>{formatCurrency(record.priceAtOrder)}</Typography.Text>
      ),
    },
    {
      title: "Số lượng",
      key: "quantity",
      render: (_: any, record: OrderItem) => (
        <Typography.Text strong>{record.quantity}</Typography.Text>
      ),
    },
    {
      title: "Thành tiền",
      key: "totalPrice",
      render: (_: any, record: OrderItem) => (
        <Typography.Text strong style={{ color: "#" }}>
          {formatCurrency(record.quantity * record.priceAtOrder)}
        </Typography.Text>
      ),
    },
  ];

  if (loading) {
    return <div className="text-center p-6">Đang tải...</div>;
  }

  if (!order) {
    return <div className="text-center p-6">Không tìm thấy đơn hàng</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold text-gray-800">
          Chi tiết đơn hàng #{order.orderCode}
        </h1>
      </div>
      <Row gutter={[24, 24]}>
        {/* Quy trình giao hàng */}
        <Col span={24}>
          <Card title="Quy trình giao hàng" size="small">
            {order.status === 5 ? (
              <>
                <Tag color="red" className="text-sm font-medium">
                  Đơn hàng đã bị hủy
                </Tag>
                <p className="mt-2 text-red-500 italic text-sm">
                  Lý do hủy: {order.cancelReason || "Không có lý do cụ thể"}
                </p>
              </>
            ) : order.status === 6 ? (
              <>
                <Tag color="purple" className="text-sm font-medium">
                  Yêu cầu trả hàng
                </Tag>
                <p className="mt-2 text-purple-500 italic text-sm">
                  {returnRequest === 0 && "Đang xử lý yêu cầu trả hàng"}
                  {returnRequest === 1 && "Yêu cầu trả hàng đã được chấp nhận, vui lòng gửi hàng"}
                  {returnRequest === 2 && "Shop đã nhận được hàng"}
                  {returnRequest === 3 && "Shop đã hoàn tiền cho bạn, vui lòng kiểm tra ví của bạn"}
                  {returnRequest === 4 && "Yêu cầu trả hàng đã bị từ chối, vui lòng liên hệ với shop để biết thêm chi tiết"}
                </p>
              </>
            ) : (
              <Steps
                current={getCurrentStep(order.status)}
                items={deliverySteps.map((step, index) => {
                  const currentStep = getCurrentStep(order.status);
                  const isActive = currentStep === index;
                  const isCompleted = currentStep > index;

                  return {
                    ...step,
                    icon: (
                      <div
                        className={`w-9 h-9 flex items-center justify-center rounded-full text-white text-xs font-medium
                        ${isCompleted || isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                      >
                        {step.icon}
                      </div>
                    ),
                    title: <span className="text-base">{step.title}</span>,
                    description: step.description,
                  };
                })}
                style={{ marginTop: 16 }}
                direction={window.innerWidth < 768 ? 'vertical' : 'horizontal'}
              />
            )}
          </Card>
        </Col>

        {/* Thông tin tổng quan */}
        <Col span={24}>
          <Card title="Thông tin đơn hàng" size="small">
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Mã đơn hàng">
                    <Typography.Text strong style={{ color: "#1890ff", fontSize: "16px" }}>
                      {order.orderCode}
                    </Typography.Text>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày đặt hàng">
                    <Space>
                      <CalendarOutlined />
                      {formatDate(order.createdAt)}
                    </Space>
                  </Descriptions.Item>
                  <Descriptions.Item label="Ngày giao hàng">
                    <Typography.Text>
                      {order.status === 4 && order.updatedAt
                        ? formatDate(order.updatedAt)
                        : "Chưa xác định"}
                    </Typography.Text>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Trạng thái đơn hàng">
                    <Tag color={getStatusColor(order.status)} className="text-sm">
                      {statusLabels[order.status]}
                    </Tag>
                  </Descriptions.Item>
                  {/* <Descriptions.Item label="Tổng tiền">
                    <Typography.Text strong style={{ color: "#16A34A", fontSize: "18px" }}>
                      {formatCurrency(order.totalAmount)}
                    </Typography.Text>
                  </Descriptions.Item> */}
                  <Descriptions.Item label="Cập nhật lần cuối">
                    <Typography.Text>{formatDate(order.updatedAt)}</Typography.Text>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>
          </Card>
        </Col>

        {/* Địa chỉ giao hàng */}
        <Col span={12}>
          <Card title="Địa chỉ giao hàng" size="small">
            <Space direction="vertical" style={{ width: "100%" }}>
              <div>
                <EnvironmentOutlined /> {order.recipientInfo.name} ({order.recipientInfo.phone})
              </div>
              <div>
                <strong>{order.shippingAddress}</strong>
              </div>
            </Space>
          </Card>
        </Col>

        {/* Thông tin thanh toán */}
        <Col span={12}>
          <Card title="Thông tin thanh toán" size="small">
            <Descriptions column={1} size="small">
              <Descriptions.Item label="Phương thức thanh toán">
                {getPaymentMethodText(order.paymentMethod)}
              </Descriptions.Item>
              <Descriptions.Item label="Trạng thái thanh toán">
                <Tag color={getPaymentStatusColor(order.paymentStatus)}>
                  {order.paymentStatus === 0 ? "Chưa thanh toán" :
                    order.paymentStatus === 1 ? "Đã thanh toán" :
                      order.paymentStatus === 2 ? "Đã hoàn tiền" :
                        order.paymentStatus === 3 ? "Đã hủy" : "Không xác định"}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        {/* Danh sách sản phẩm */}
        <Col span={24}>
          <Card title="Danh sách sản phẩm" size="small">
            <Table
              dataSource={order.items}
              columns={productColumns}
              rowKey="productId"
              pagination={false}
              summary={() => (
                <Table.Summary>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <Typography.Text strong>Tạm tính:</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <Typography.Text strong>
                        {formatCurrency(order.totalAmount - (order.shippingFee || 0) - (order.discountAmount || 0))}
                      </Typography.Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <Typography.Text>Phí vận chuyển:</Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <Typography.Text>{formatCurrency(order.shippingFee || 0)}</Typography.Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                  {order.discountAmount > 0 && (
                    <Table.Summary.Row>
                      <Table.Summary.Cell index={0} colSpan={4}>
                        <Typography.Text>Giảm giá:</Typography.Text>
                      </Table.Summary.Cell>
                      <Table.Summary.Cell index={4}>
                        <Typography.Text style={{ color: "#52c41a" }}>
                          -{formatCurrency(order.discountAmount)}
                        </Typography.Text>
                      </Table.Summary.Cell>
                    </Table.Summary.Row>
                  )}
                  <Table.Summary.Row>
                    <Table.Summary.Cell index={0} colSpan={4}>
                      <Typography.Text strong style={{ fontSize: "16px" }}>
                        Tổng cộng:
                      </Typography.Text>
                    </Table.Summary.Cell>
                    <Table.Summary.Cell index={4}>
                      <Typography.Text strong style={{ fontSize: "16px", color: "#16A34A" }}>
                        {formatCurrency(order.totalAmount)}
                      </Typography.Text>
                    </Table.Summary.Cell>
                  </Table.Summary.Row>
                </Table.Summary>
              )}
            />
          </Card>
        </Col>

        {/* Voucher (nếu có) */}
        {order.voucherId && order.voucherId.length > 0 && (
          <Col span={24}>
            <Card title="Voucher sử dụng" size="small">
              <Space wrap>
                {order.voucherId.map((voucherId: string, index: number) => (
                  <Tag key={index} color="green">
                    {voucherId}
                  </Tag>
                ))}
              </Space>
            </Card>
          </Col>
        )}

        {/* Hành động */}
        <Col span={24}>
          <Card title="Hành động" size="small">
            <Space>
              {(order.status === 0 || order.status === 1) && (
                <AntButton
                  danger
                  size="large"
                  onClick={showCancelModal}
                  className="bg-red-500 hover:bg-red-600 font-medium"
                >
                  Hủy đơn hàng
                </AntButton>
              )}
              {order.status === 3 && (
                <AntButton
                  type="primary"
                  size="large"
                  onClick={showReturnModal}
                  className="bg-purple-500 hover:bg-purple-600 font-medium"
                >
                  Trả hàng & Hoàn tiền
                </AntButton>
              )}
              {order.status === 3 && (
                <Popconfirm
                  title="Xác nhận hoàn thành đơn hàng?"
                  onConfirm={completeOrder}
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
                  onClick={getPaymentUrl}
                  className="bg-blue-500 hover:bg-blue-600 font-medium"
                >
                  Thanh toán
                </AntButton>
              )}
              <AntButton
                size="large"
                onClick={() => navigate("/user/order")}
                className="font-medium"
              >
                Quay lại
              </AntButton>
              {order.status === 4 && order.items && order.items.length > 0 && order.review === 0 && (
                <AntButton
                  type="primary"
                  size="large"
                  onClick={() => {
                    const items = order.items;
                    if (!items || items.length === 0) {
                      console.error("No products found in order items:", order.items);
                      message.error("Không có sản phẩm nào trong đơn hàng để đánh giá.");
                      return;
                    }
                    navigate(
                      `/review?orderId=${order._id}`,
                      {
                        state: {
                          items: items.map((item) => ({
                            productId: item.productId,
                            name: item.productName,
                          })),
                          orderId: order._id,
                        },
                      }
                    );
                  }}
                  className="bg-blue-500 hover:bg-blue-600 text-white ml-2"
                >
                  Đánh giá
                </AntButton>
              )}
            </Space>
          </Card>
        </Col>

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
                    <TextArea
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
              {order?.items.map((item: OrderItem) => (
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
                      <span className="text-sm text-gray-600">
                        {item.variant || "Không có phân loại"} - {formatCurrency(item.priceAtOrder)} x {item.quantity}
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
                      {formatCurrency(
                        (selectedProducts.find((p) => p.productId === item.productId)?.quantity || 0) * item.priceAtOrder
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Form.Item label="Tổng tiền hoàn (VNĐ)" shouldUpdate>
              {() => (
                <span className="text-green-600 font-semibold">
                  {formatCurrency(
                    selectedProducts.reduce((sum, p) => sum + (p.quantity * p.price), 0)
                  )}
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
                    <TextArea rows={3} placeholder="Nhập lý do trả hàng" />
                  </Form.Item>
                ) : null
              }
            </Form.Item>
            <Form.Item name="notes" label="Ghi chú bổ sung">
              <TextArea rows={3} placeholder="Nhập ghi chú (nếu có)" />
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
                  Gửi yêu cầu
                </AntButton>
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </Row>
    </div>
  );
};

export default OrderDetail;