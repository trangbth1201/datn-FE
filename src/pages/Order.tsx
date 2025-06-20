// Giao diện đơn hàng kèm filter + thống kê + lựa chọn kiểu hiển thị (Card / Bảng)

import React, { useEffect, useState } from "react";
import { Modal, Button as AntButton, Table, Tag, Input, Select, Radio } from "antd";
import { cancelOrderApi, userGetOrder } from "../services/authService";
import message from "antd/es/message";
import { CheckCircle, Truck, Clock, PackageCheck, XCircle, List, LayoutGrid } from 'lucide-react';
import { SidebarLink } from "../components/SidebarLink";

const { Option } = Select;

interface Order {
  _id: string;
  orderCode: string;
  status: string;
  createdAt: string;
  totalAmount: number;
  items: OrderItem[];
  paymentStatus: string;
  paymentMethod: string;
  deliveryDate: string;
  shippingAddress: {
    country: string;
    city: string;
    address: string;
  };
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
}

interface OrderItem {
  _id: string;
  productName: string;
  quantity: number;
  totalPrice: number;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'cho xac nhan': return <Clock size={16} className="text-orange-600" />;
    case 'da xac nhan': return <CheckCircle size={16} className="text-yellow-600" />;
    case 'dang giao hang': return <Truck size={16} className="text-blue-600" />;
    case 'da giao hang': return <PackageCheck size={16} className="text-green-600" />;
    case 'thanh cong': return <CheckCircle size={16} className="text-green-700" />;
    case 'da huy': return <XCircle size={16} className="text-red-500" />;
    default: return null;
  }
};

const OrderDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [viewType, setViewType] = useState("table");

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");
    const res = await userGetOrder(token || "");
    if (res.success) setOrders(res.data);
    else message.error("Không thể tải đơn hàng");
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const cancelOrder = async (id: string) => {
    const token = localStorage.getItem("token");
    if (!token) return;
    const confirmed = window.confirm("Bạn có chắc muốn hủy đơn hàng?");
    if (!confirmed) return;

    const res = await cancelOrderApi(id, token);
    if (res.success) {
      message.success("Đã hủy đơn hàng");
      fetchOrders();
    } else {
      message.error("Hủy thất bại");
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchSearch =
      order.orderCode.toLowerCase().includes(search.toLowerCase()) ||
      order.items.some((item) => item.productName.toLowerCase().includes(search.toLowerCase()));

    const matchStatus = statusFilter === "Tất cả" || order.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalDiscount = orders.reduce((sum, o) => sum + o.discountAmount, 0);
  const totalPending = orders.filter(o => o.status === 'Chờ xử lý').length;

  const columns = [
    {
      title: "Mã đơn hàng",
      dataIndex: "orderCode",
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: "Ngày đặt",
      dataIndex: "createdAt",
      render: (text: string) => new Date(text).toLocaleDateString("vi-VN"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      render: (text: string) => (
        <span className="flex items-center gap-1">
          {getStatusIcon(text)}
          <Tag color="blue" style={{ marginLeft: 4 }}>{text}</Tag>
        </span>
      ),
    },
    {
      title: "Sản phẩm",
      dataIndex: "items",
      render: (items: OrderItem[]) => `${items.length} sản phẩm`,
    },
    {
      title: "Tổng tiền",
      dataIndex: "totalAmount",
      render: (amount: number) => (
        <span className="text-red-600 font-medium">
          {amount.toLocaleString("vi-VN")} ₫
        </span>
      ),
    },
    {
      title: "Thao tác",
      render: (_: any, record: Order) => (
        <>
          <AntButton
            type="primary"
            size="small"
            onClick={() => setSelectedOrder(record)}
            style={{ marginRight: 8 }}
          >
            Xem
          </AntButton>
          {record.status === 'Chờ xử lý' && (
            <AntButton danger size="small" onClick={() => cancelOrder(record._id)}>
              Hủy
            </AntButton>
          )}
        </>
      ),
    },
  ];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 md:px-6 flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-56 space-y-3 mb-6 md:mb-0">
        <SidebarLink />
      </aside>

      <main className="flex-1">
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-wrap gap-4 items-center">
            <Input placeholder="Nhập mã đơn hàng, sản phẩm..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full md:w-60" />
            <Select value={statusFilter} onChange={setStatusFilter} className="w-full md:w-40">
              <Option value="Tất cả">Tất cả</Option>
              <Option value="cho xac nhan">Chờ xử lý</Option>
              <Option value="da xac nhan">Đã xác nhận</Option>
              <Option value="dang giao hang">Đang vận chuyển</Option>
              <Option value="da giao hang">Đã giao hàng</Option>
              <Option value="thanh cong">Thành công</Option>
              <Option value="Da huy">Đã hủy</Option>
            </Select>
            <Radio.Group value={viewType} className="flex gap-3" onChange={(e) => setViewType(e.target.value)}>
              <Radio.Button value="card" className="flex justify-center items-center"><LayoutGrid size={16} /></Radio.Button>
              <Radio.Button value="table" className="flex justify-center items-center"><List size={16} /></Radio.Button>
            </Radio.Group>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="bg-gray-100 p-4 rounded text-center">
              <div className="text-lg font-bold">{orders.length}</div>
              <div className="text-sm text-gray-500">Tổng đơn hàng</div>
            </div>
            <div className="bg-gray-100 p-4 rounded text-center">
              <div className="text-lg font-bold">{totalPending}</div>
              <div className="text-sm text-gray-500">Chờ xử lý</div>
            </div>
            <div className="bg-gray-100 p-4 rounded text-center">
              <div className="text-lg font-bold">{(totalAmount / 1e6).toFixed(1)}M</div>
              <div className="text-sm text-gray-500">Tổng giá trị</div>
            </div>
            <div className="bg-gray-100 p-4 rounded text-center">
              <div className="text-lg font-bold">{(totalDiscount / 1e6).toFixed(1)}M</div>
              <div className="text-sm text-gray-500">Tiết kiệm</div>
            </div>
          </div>
        </div>

        {viewType === "table" ? (
          <Table
            rowKey="_id"
            columns={columns}
            dataSource={filteredOrders}
            loading={loading}
            pagination={{ pageSize: 10 , position: ["bottomCenter"] }}
            bordered
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="p-4 border rounded shadow-sm bg-white">
                <div className="flex justify-between">
                  <strong>{order.orderCode}</strong>
                  <Tag color="blue">{order.status}</Tag>
                </div>
                <p className="text-sm text-gray-500">Ngày đặt: {new Date(order.createdAt).toLocaleDateString("vi-VN")}</p>
                <p className="font-medium text-red-600">{order.totalAmount.toLocaleString("vi-VN")} ₫</p>
                <AntButton size="small" onClick={() => setSelectedOrder(order)} className="mt-2">Xem</AntButton>
              </div>
            ))}
          </div>
        )}

        <Modal
          open={!!selectedOrder}
          onCancel={() => setSelectedOrder(null)}
          title={`Chi tiết đơn hàng - ${selectedOrder?.orderCode}`}
          footer={<AntButton onClick={() => setSelectedOrder(null)}>Đóng</AntButton>}
        >
          {selectedOrder && (
            <div className="space-y-2 text-sm">
              <p><strong>Trạng thái:</strong> {selectedOrder.status}</p>
              <p><strong>Ngày đặt:</strong> {new Date(selectedOrder.createdAt).toLocaleString("vi-VN")}</p>
              <p><strong>Thanh toán:</strong> {selectedOrder.paymentMethod} - {selectedOrder.paymentStatus}</p>
              {selectedOrder.deliveryDate && <p><strong>Ngày giao dự kiến:</strong> {new Date(selectedOrder.deliveryDate).toLocaleDateString("vi-VN")}</p>}
              <div>
                <strong>Sản phẩm:</strong>
                <ul className="list-disc ml-5">
                  {selectedOrder.items.map(item => (
                    <li key={item._id}>{item.productName} x {item.quantity} - {item.totalPrice.toLocaleString("vi-VN")} ₫</li>
                  ))}
                </ul>
              </div>
              <p><strong>Địa chỉ giao hàng:</strong> {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.country}</p>
              <p><strong>Tạm tính:</strong> {selectedOrder.subtotal.toLocaleString("vi-VN")} ₫</p>
              {selectedOrder.shippingFee > 0 && <p><strong>Phí vận chuyển:</strong> {selectedOrder.shippingFee.toLocaleString("vi-VN")} ₫</p>}
              {selectedOrder.discountAmount > 0 && <p><strong>Giảm giá:</strong> -{selectedOrder.discountAmount.toLocaleString("vi-VN")} ₫</p>}
              <p className="text-base font-medium"><strong>Tổng cộng:</strong> {selectedOrder.totalAmount.toLocaleString("vi-VN")} ₫</p>
            </div>
          )}
        </Modal>
      </main>
    </div>
  );
};

export default OrderDashboard;
