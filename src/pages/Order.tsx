import {
  Button as AntButton,
  Input as AntInput,
  Select as AntSelect,
  Form,
  Input,
  Modal,
  Radio,
  Select,
  Table,
  Tag,
} from "antd";
import message from "antd/es/message";
import {
  CheckCircle,
  Clock,
  LayoutGrid,
  List,
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
import socket from "../services/socket";
import { getStatusColor } from "../utils/getStatusColor";
import { statusLabels } from "../utils/statusLabels";

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
  "Muốn thêm mã giảm giá",
  "Thời gian giao hàng quá lâu",
  "Khác",
];

const Order = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [viewType, setViewType] = useState("table");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [form] = Form.useForm();
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
  const showCancelModal = (id: string) => {
    setSelectedOrderId(id);
    setIsModalVisible(true);
  };

  const handleCancelOrder = async (values: {
    reason: string;
    customReason?: string;
  }) => {
    const finalReason =
      values.reason === "Khác" && values.customReason
        ? values.customReason
        : values.reason;
    const userId = localStorage.getItem("userId");
    const res = await cancelOrderApi(
      selectedOrderId,
      finalReason,
      userId || ""
    );
    if (res.success) {
      message.success("Đã hủy đơn hàng");
      fetchOrders();
    } else {
      message.error("Hủy thất bại");
    }
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleModalCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const getPaymentUrl = async (id: string) => {
    const res: any = await orderService.getPaymentStatus(id);
    window.open(res.data.paymentUrl, "_blank");
    message.success("Đang chuyển đến cổng thanh toán");
  };

  const completeOrder = async (id: string) => {
    const confirmed = window.confirm("Bạn có chắc muốn hoàn thành đơn hàng?");
    if (!confirmed) return;

    const res = await completeOrderApi(id, userId || "");
    if (res.success) {
      message.success("Đã hoàn thành đơn hàng");
      fetchOrders();
    } else {
      message.error("Hoàn thành thất bại");
    }
  };

  const filteredOrders = orders.filter((order: IOrder) => {
    const matchSearch =
      order.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      order.items.some((item) =>
        item.productName.toLowerCase().includes(search.toLowerCase())
      );
    const matchStatus =
      statusFilter === "Tất cả" || order.status === parseInt(statusFilter);
    return matchSearch && matchStatus;
  });

  const totalAmount = orders.reduce((sum, o: IOrder) => sum + o.totalAmount, 0);
  const totalDiscount = orders.reduce(
    (sum, o: IOrder) => sum + o.discountAmount,
    0
  );
  const totalPending = orders.filter((o: IOrder) => o.status === 0).length;

  const columns = [
    {
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      render: (text: string) => (
        <span className="font-semibold text-gray-800">{text}</span>
      ),
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      render: (text: string) =>
        new Date(text).toLocaleDateString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (status: number) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <Tag color={getStatusColor(status)}>{statusLabels[status]}</Tag>
        </div>
      ),
    },
    {
      title: "Sản phẩm",
      dataIndex: "items",
      render: (items: OrderItem[]) => (
        <span className="text-gray-600">{items.length} sản phẩm</span>
      ),
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      render: (amount: number) => (
        <span className="text-red-600 font-semibold">
          {amount.toLocaleString("vi-VN")} ₫
        </span>
      ),
    },
    {
      title: "Thao tác",
      render: (_: any, record: IOrder) => (
        <div className="flex gap-2">
          <AntButton
            type="primary"
            size="small"
            onClick={() => navigate(`/order/${record._id}`)}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Xem
          </AntButton>
          {(record.status === 0 || record.status === 1) && (
            <AntButton
              danger
              size="small"
              onClick={() => showCancelModal(record._id)}
              className="bg-red-500 hover:bg-red-600"
            >
              Hủy
            </AntButton>
          )}
          {record.status === 3 && (
            <AntButton
              type="primary"
              size="small"
              onClick={() => completeOrder(record._id)}
            >
              Hoàn thành
            </AntButton>
          )}
          {record.paymentStatus === 0 && record.paymentMethod === "VNPAY" && (
            <AntButton
              type="primary"
              size="small"
              onClick={() => getPaymentUrl(record._id)}
            >
              Thanh toán
            </AntButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
        <Input
          placeholder="Tìm mã đơn hàng, sản phẩm..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 rounded-md"
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
        <Select
          value={statusFilter}
          onChange={setStatusFilter}
          className="w-full sm:w-48 rounded-md"
          dropdownClassName="rounded-md"
        >
          <Option value="Tất cả">Tất cả</Option>
          {Object.entries(statusLabels).map(([key, value]) => (
            <Option key={key} value={key}>
              {value}
            </Option>
          ))}
        </Select>
        <Radio.Group
          value={viewType}
          onChange={(e) => setViewType(e.target.value)}
          className="flex gap-2"
        >
          <Radio.Button
            value="card"
            className="flex justify-center items-center rounded-md"
          >
            <LayoutGrid size={16} />
          </Radio.Button>
          <Radio.Button
            value="table"
            className="flex justify-center items-center rounded-md"
          >
            <List size={16} />
          </Radio.Button>
        </Radio.Group>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 p-4 rounded-lg text-center shadow-sm">
          <div className="text-2xl font-bold text-gray-800">
            {orders.length}
          </div>
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

      {viewType === "table" ? (
        <Table
          rowKey="_id"
          columns={columns}
          dataSource={filteredOrders}
          loading={loading}
          pagination={{
            pageSize: 10,
            position: ["bottomCenter"],
            showSizeChanger: true,
          }}
          bordered
          className="rounded-lg overflow-hidden"
          scroll={{ x: "max-content" }}
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order: IOrder) => (
            <div
              key={order._id}
              className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-center mb-2">
                <span className="font-semibold text-gray-800">
                  {order.orderCode}
                </span>
                <Tag color={getStatusColor(order.status)}>
                  {statusLabels[order.status]}
                </Tag>
              </div>
              <p className="text-sm text-gray-500 mb-2">
                Ngày đặt:{" "}
                {new Date(order.createdAt).toLocaleDateString("vi-VN")}
              </p>
              <p className="text-sm text-gray-500 mb-2">
                {order.items.length} sản phẩm
              </p>
              <p className="text-red-600 font-semibold mb-3">
                {order.totalAmount.toLocaleString("vi-VN")} ₫
              </p>
              <div className="flex gap-2">
                <AntButton
                  type="primary"
                  size="small"
                  onClick={() => navigate(`/order/${order._id}`)}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Xem
                </AntButton>
                {(order.status === 0 || order.status === 1) && (
                  <AntButton
                    danger
                    size="small"
                    onClick={() => showCancelModal(order._id)}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    Hủy
                  </AntButton>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        title="Hủy đơn hàng"
        visible={isModalVisible}
        onCancel={handleModalCancel}
        footer={null}
        className="rounded-lg"
      >
        <Form form={form} onFinish={handleCancelOrder} layout="vertical">
          <Form.Item
            name="reason"
            label="Lý do hủy"
            rules={[{ required: true, message: "Vui lòng chọn lý do hủy" }]}
          >
            <AntSelect placeholder="Chọn lý do">
              {cancelReasons.map((reason) => (
                <AntSelect.Option key={reason} value={reason}>
                  {reason}
                </AntSelect.Option>
              ))}
            </AntSelect>
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
              <AntButton onClick={handleModalCancel}>Hủy bỏ</AntButton>
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
    </div>
  );
};

export default Order;
