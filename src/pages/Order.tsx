import React, { useEffect, useState } from "react";
import { SidebarLink } from "../components/SidebarLink";
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { cancelOrderApi, userGetOrder } from "../services/authService";
import Button from "antd/es/button";
import message from "antd/es/message";

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
  priceAtOrder: number;
  totalPrice: number;
  variationId: string;
  variantAttributes: any[];
}

const Order: React.FC = () => {
  const [value, setValue] = React.useState(0);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const handleCancelOrder = async (orderId: string) => {
    const token = localStorage.getItem("token");

    if (!token) {
      message.warning("Phiên đăng nhập đã hết hạn");
      return;
    }

    const confirmCancel = window.confirm("Bạn có chắc muốn hủy đơn hàng này?");
    if (!confirmCancel) return;

    const res = await cancelOrderApi(orderId, token);

    if (res.success) {
      message.success("Đã hủy đơn hàng");
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: "Đã hủy" } : order
        )
      );
    } else {
      message.error(res.message || "Có lỗi xảy ra");
    }
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");

        const result = await userGetOrder(token as string);
        if (result.success) {
          setOrders(result.data || []);
        } else {
          setError(result.message);
        }
      } catch (err) {
        setError("Không thể tải danh sách đơn hàng");
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const getOrdersByStatus = (tabIndex: number) => {
    const statusMap: { [key: number]: string } = {
      0: 'Chờ xử lý',
      1: 'Đang giao hàng',
      2: 'Đã giao hàng',
      3: 'Thành công',
      4: 'Đã hủy'
    };

    return orders.filter(order => order.status === statusMap[tabIndex]);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 md:px-6 flex flex-col md:flex-row gap-8">
      <aside className="w-full md:w-56 space-y-3 mb-6 md:mb-0">
        <SidebarLink />
      </aside>

      <main className="flex-1">
        <h1 className="text-2xl font-semibold mb-6">Danh sách đơn hàng</h1>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ width: '100%' }}>
          <Tabs value={value} onChange={handleChange} aria-label="Order Tabs" sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tab label="Chờ xử lý" />
            <Tab label="Đang giao hàng" />
            <Tab label="Đã giao hàng" />
            <Tab label="Thành công" />
            <Tab label="Đã hủy" />
          </Tabs>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <>
              <TabPanel value={value} index={0}>
                <OrderList orders={getOrdersByStatus(0)} title="Đơn hàng chờ xử lý" onCancel={handleCancelOrder} />
              </TabPanel>
              <TabPanel value={value} index={1}>
                <OrderList orders={getOrdersByStatus(1)} title="Đơn hàng đang giao" onCancel={handleCancelOrder} />
              </TabPanel>
              <TabPanel value={value} index={2}>
                <OrderList orders={getOrdersByStatus(2)} title="Đơn hàng đã giao" onCancel={handleCancelOrder} />
              </TabPanel>
              <TabPanel value={value} index={3}>
                <OrderList orders={getOrdersByStatus(3)} title="Đơn hàng thành công" onCancel={handleCancelOrder} />
              </TabPanel>
              <TabPanel value={value} index={4}>
                <OrderList orders={getOrdersByStatus(4)} title="Đơn hàng đã hủy" onCancel={handleCancelOrder} />
              </TabPanel>
            </>
          )}
        </Box>
      </main>
    </div>
  );
};

interface OrderListProps {
  orders: Order[];
  title: string;
  onCancel: (orderId: string) => void;
}

const OrderList: React.FC<OrderListProps> = ({ orders, title, onCancel }) => {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Typography variant="body1" color="text.secondary">
          Không có đơn hàng nào
        </Typography>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Typography variant="h6" sx={{ mb: 2 }}>
        {title} ({orders.length})
      </Typography>

      {orders.map((order) => (
        <div key={order._id} className="border rounded-lg p-4 bg-white shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Typography variant="subtitle1" fontWeight="medium">
                  {order.orderCode}
                </Typography>
                <span
                  className={`px-2 py-1 rounded text-xs font-medium ${
                    order.status === 'Chờ xử lý' ? 'bg-orange-100 text-orange-800' :
                    order.status === 'Đang giao hàng' ? 'bg-blue-100 text-blue-800' :
                    order.status === 'Đã giao hàng' ? 'bg-green-100 text-green-800' :
                    order.status === 'Thành công' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}
                >
                  {order.status}
                </span>
              </div>
              <Typography variant="body2" color="text.secondary">
                Ngày đặt: {formatDate(order.createdAt)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Thanh toán: {order.paymentMethod} - {order.paymentStatus}
              </Typography>
              {order.deliveryDate && (
                <Typography variant="body2" color="text.secondary">
                  Ngày giao dự kiến: {formatDate(order.deliveryDate)}
                </Typography>
              )}
            </div>
            <div className="text-right">
              <Typography variant="h6" color="primary">
                {formatCurrency(order.totalAmount)}
              </Typography>
              {order.discountAmount > 0 && (
                <Typography variant="body2" color="success.main">
                  Giảm: {formatCurrency(order.discountAmount)}
                </Typography>
              )}
            </div>
          </div>

          <div className="space-y-2 border-t pt-3">
            <Typography variant="body2" fontWeight="medium" color="text.secondary">
              Sản phẩm:
            </Typography>
            {order.items.map((item) => (
              <div key={item._id} className="flex justify-between items-center text-sm">
                <span className="flex-1">
                  {item.productName} <span className="text-gray-500">x {item.quantity}</span>
                </span>
                <span className="font-medium">{formatCurrency(item.totalPrice)}</span>
              </div>
            ))}
          </div>

          <div className="border-t pt-3 mt-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span>Tạm tính:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.shippingFee > 0 && (
              <div className="flex justify-between text-sm">
                <span>Phí vận chuyển:</span>
                <span>{formatCurrency(order.shippingFee)}</span>
              </div>
            )}
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Giảm giá:</span>
                <span>-{formatCurrency(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-medium text-base border-t pt-1">
              <span>Tổng cộng:</span>
              <span className="text-primary">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          <div className="border-t pt-3 mt-3">
            <Typography variant="body2" fontWeight="medium" color="text.secondary">
              Địa chỉ giao hàng:
            </Typography>
            <Typography variant="body2">
              {order.shippingAddress.address}, {order.shippingAddress.city}, {order.shippingAddress.country}
            </Typography>
          </div>

          {order.status === "Chờ xử lý" && (
            <Button danger className="mt-3" onClick={() => onCancel(order._id)}>
              Hủy đơn hàng
            </Button>
          )}
        </div>
      ))}
    </div>
  );
};

interface TabPanelProps {
  value: number;
  index: number;
  children: React.ReactNode;
}

const TabPanel: React.FC<TabPanelProps> = ({ value, index, children }) => {
  return (
    <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export default Order;
