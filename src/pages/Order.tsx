import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button as AntButton, Table, Tag, Input, Select, Radio, Spin } from 'antd';
import message from 'antd/es/message';
import {
  cancelOrderApi,
  completeOrderApi,
  userGetOrder,
} from '../services/authService';
import {
  CheckCircle,
  Truck,
  Clock,
  PackageCheck,
  XCircle,
  List,
  LayoutGrid,
  RefreshCcw,
} from 'lucide-react';
import { SidebarLink } from '../components/SidebarLink';
import {
  Order,
  OrderItem,
  PaymentStatusLabels,
  StatusLabels,
} from '../interface/order.interfcace';

const { Option } = Select;

export const statusLabels: StatusLabels = {
  0: 'Chờ xác nhận',
  1: 'Đã xác nhận',
  2: 'Đang giao hàng',
  3: 'Đã giao hàng',
  4: 'Hoàn thành',
  5: 'Đã hủy',
  6: 'Hoàn hàng',
};

export const paymentStatusLabels: PaymentStatusLabels = {
  0: 'Chưa thanh toán',
  1: 'Đã thanh toán',
  2: 'Hoàn tiền',
};

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

const getStatusIcon = (status: number) => {
  switch (status) {
    case 0: return <Clock size={16} className="text-orange-500" />;
    case 1: return <CheckCircle size={16} className="text-yellow-500" />;
    case 2: return <Truck size={16} className="text-blue-500" />;
    case 3: return <PackageCheck size={16} className="text-green-500" />;
    case 4: return <CheckCircle size={16} className="text-green-600" />;
    case 5: return <XCircle size={16} className="text-red-500" />;
    case 6: return <RefreshCcw size={16} className="text-purple-500" />;
    default: return null;
  }
};

export const getStatusColor = (status: number) => {
  switch (status) {
    case 0: return 'orange';
    case 1: return 'yellow';
    case 2: return 'blue';
    case 3: return 'green';
    case 4: return 'green';
    case 5: return 'red';
    case 6: return 'purple';
    default: return 'gray';
  }
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);

const OrderDashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('Tất cả');
  const [viewType, setViewType] = useState<'table' | 'card'>('table');
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    const res = await userGetOrder();

    if (res.success) {
      const mappedOrders = res.data.map((o: any) => ({
        ...o,
        status: typeof o.status === 'string' ? statusMap[o.status] ?? -1 : o.status,
        paymentStatus: typeof o.paymentStatus === 'string' ? paymentStatusMap[o.paymentStatus] ?? -1 : o.paymentStatus,
      }));
      setOrders(mappedOrders);
    } else {
      message.error('Không thể tải đơn hàng');
    }

    setLoading(false);
  };

  const handleOrderAction = async (action: 'cancel' | 'complete', id: string) => {
    const confirmMsg =
      action === 'cancel' ? 'Bạn có chắc muốn hủy đơn hàng?' : 'Bạn có chắc muốn hoàn thành đơn hàng?';
    if (!window.confirm(confirmMsg)) return;

    const res =
      action === 'cancel' ? await cancelOrderApi(id) : await completeOrderApi(id);

    if (res.success) {
      message.success(action === 'cancel' ? 'Đã hủy đơn hàng' : 'Đã hoàn thành đơn hàng');
      fetchOrders();
    } else {
      message.error(action === 'cancel' ? 'Hủy thất bại' : 'Hoàn thành thất bại');
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        order.orderCode.toLowerCase().includes(search.toLowerCase()) ||
        order.items.some((item) =>
          item.productName.toLowerCase().includes(search.toLowerCase())
        );
      const matchStatus =
        statusFilter === 'Tất cả' || order.status.toString() === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, search, statusFilter]);

  const totalAmount = useMemo(
    () => orders.reduce((sum, o) => sum + o.totalAmount, 0),
    [orders]
  );
  const totalDiscount = useMemo(
    () => orders.reduce((sum, o) => sum + o.discountAmount, 0),
    [orders]
  );
  const totalPending = useMemo(
    () => orders.filter((o) => o.status === 0).length,
    [orders]
  );

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'orderCode',
      render: (text: string) => <span className="font-semibold text-gray-800">{text}</span>,
    },
    {
      title: 'Ngày đặt',
      dataIndex: 'createdAt',
      render: (text: string) =>
        new Date(text).toLocaleDateString('vi-VN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      render: (status: number) => (
        <div className="flex items-center gap-2">
          {getStatusIcon(status)}
          <Tag color={getStatusColor(status)}>{statusLabels[status]}</Tag>
        </div>
      ),
    },
    {
      title: 'Sản phẩm',
      dataIndex: 'items',
      render: (items: OrderItem[]) => (
        <span className="text-gray-600">{items.length} sản phẩm</span>
      ),
    },
    {
      title: 'Tổng tiền',
      dataIndex: 'totalAmount',
      render: (amount: number) => (
        <span className="text-red-600 font-semibold">{formatCurrency(amount)}</span>
      ),
    },
    {
      title: 'Thao tác',
      render: (_: any, record: Order) => (
        <div className="flex gap-2">
          <AntButton type="primary" size="small" onClick={() => navigate(`/order/${record._id}`)} className="bg-blue-500">
            Xem
          </AntButton>
          {[0, 1].includes(record.status) && (
            <AntButton danger size="small" onClick={() => handleOrderAction('cancel', record._id)} className="bg-red-500">
              Hủy
            </AntButton>
          )}
          {record.status === 3 && (
            <AntButton type="primary" size="small" onClick={() => handleOrderAction('complete', record._id)}>
              Hoàn thành
            </AntButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row gap-6">
        <aside className="w-full md:w-64 bg-white rounded-lg shadow-sm p-4">
          <SidebarLink />
        </aside>

        <main className="flex-1">
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center mb-6">
              <Input
                placeholder="Tìm mã đơn hàng, sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full sm:w-64 rounded-md"
              />
              <Select value={statusFilter} onChange={setStatusFilter} className="w-full sm:w-48 rounded-md">
                <Option value="Tất cả">Tất cả</Option>
                {Object.entries(statusLabels).map(([key, value]) => (
                  <Option key={key} value={key}>{value}</Option>
                ))}
              </Select>
              <Radio.Group value={viewType} onChange={(e) => setViewType(e.target.value)} className="flex gap-2">
                <Radio.Button value="card"><LayoutGrid size={16} /></Radio.Button>
                <Radio.Button value="table"><List size={16} /></Radio.Button>
              </Radio.Group>
            </div>

            {loading ? (
              <div className="text-center py-10"><Spin size="large" /></div>
            ) : (
              <>
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
                    <div className="text-2xl font-bold text-gray-800">{(totalAmount / 1e6).toFixed(1)}M</div>
                    <div className="text-sm text-gray-500">Tổng giá trị</div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg text-center shadow-sm">
                    <div className="text-2xl font-bold text-gray-800">{(totalDiscount / 1e6).toFixed(1)}M</div>
                    <div className="text-sm text-gray-500">Tiết kiệm</div>
                  </div>
                </div>

                {viewType === 'table' ? (
                  <Table
                    rowKey="_id"
                    columns={columns}
                    dataSource={filteredOrders}
                    pagination={{ pageSize: 10, position: ['bottomCenter'], showSizeChanger: true }}
                    bordered
                    className="rounded-lg overflow-hidden"
                    scroll={{ x: 'max-content' }}
                  />
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredOrders.map((order) => (
                      <div key={order._id} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-gray-800">{order.orderCode}</span>
                          <Tag color={getStatusColor(order.status)}>{statusLabels[order.status]}</Tag>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          Ngày đặt: {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                        <p className="text-sm text-gray-500 mb-2">{order.items.length} sản phẩm</p>
                        <p className="text-red-600 font-semibold mb-3">{formatCurrency(order.totalAmount)}</p>
                        <div className="flex gap-2">
                          <AntButton type="primary" size="small" onClick={() => navigate(`/order/${order._id}`)} className="bg-blue-500">
                            Xem
                          </AntButton>
                          {order.status === 0 && (
                            <AntButton danger size="small" onClick={() => handleOrderAction('cancel', order._id)} className="bg-red-500">
                              Hủy
                            </AntButton>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default OrderDashboard;
