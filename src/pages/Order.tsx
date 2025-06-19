import React, { useEffect, useState } from "react";
import { SidebarLink } from "../components/SidebarLink";
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useAuth } from "../auth/AuthContext ";
import { userGetOrder } from "../services/authService";

interface Order {
  id: string;
  status: 'pending' | 'shipping' | 'delivered' | 'completed' | 'cancelled';
  createdAt: string;
  totalAmount: number;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

const Order: React.FC = () => {
    const [value, setValue] = React.useState(0);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);  
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
        const statusMap: { [key: number]: Order['status'] } = {
            0: 'pending',
            1: 'shipping', 
            2: 'delivered',
            3: 'completed',
            4: 'cancelled'
        };
        
        return orders.filter(order => order.status === statusMap[tabIndex]);
    };


    return (
        <div className="max-w-6xl mx-auto py-8 px-4 md:px-6 flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
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
                            {/* Tab Panels */}
                            <TabPanel value={value} index={0}>
                                <OrderList orders={getOrdersByStatus(0)} title="Đơn hàng chờ xử lý" />
                            </TabPanel>
                            <TabPanel value={value} index={1}>
                                <OrderList orders={getOrdersByStatus(1)} title="Đơn hàng đang giao" />
                            </TabPanel>
                            <TabPanel value={value} index={2}>
                                <OrderList orders={getOrdersByStatus(2)} title="Đơn hàng đã giao" />
                            </TabPanel>
                            <TabPanel value={value} index={3}>
                                <OrderList orders={getOrdersByStatus(3)} title="Đơn hàng thành công" />
                            </TabPanel>
                            <TabPanel value={value} index={4}>
                                <OrderList orders={getOrdersByStatus(4)} title="Đơn hàng đã hủy" />
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
}

const OrderList: React.FC<OrderListProps> = ({ orders, title }) => {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

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
                <div key={order.id} className="border rounded-lg p-4 bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <Typography variant="subtitle1" fontWeight="medium">
                                Đơn hàng #{order.id}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Ngày đặt: {formatDate(order.createdAt)}
                            </Typography>
                        </div>
                        <Typography variant="h6" color="primary">
                            {formatCurrency(order.totalAmount)}
                        </Typography>
                    </div>
                    
                    <div className="space-y-2">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between items-center text-sm">
                                <span>{item.name} x {item.quantity}</span>
                                <span>{formatCurrency(item.price * item.quantity)}</span>
                            </div>
                        ))}
                    </div>
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

const TabPanel = (props: TabPanelProps) => {
    const { value, index, children } = props;

    return (
        <div role="tabpanel" hidden={value !== index} id={`simple-tabpanel-${index}`} aria-labelledby={`simple-tab-${index}`}>
            {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
        </div>
    );
};

// Updated API function


export default Order;