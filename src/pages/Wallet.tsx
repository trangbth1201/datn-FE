import React, { useEffect, useState } from 'react';
import { Wallet as WalletIcon, Clock } from 'lucide-react';
import { Table, Card, Typography } from 'antd';
import { getWalletInfo } from '../services/wallet.service';

const { Title, Text } = Typography;

interface Transaction {
    _id: string;
    orderId?: { _id: string; orderCode: string; totalAmount: number };
    type: 'refund';
    amount: number;
    status: 0 | 1 | 2; // 0: Chưa xử lý, 1: Thành công, 2: Thất bại
    description: string | null;
    createdAt: string;
}

interface WalletData {
    userId: string;
    balance: number;
    status: 0 | 1; // 0: active, 1: locked
    transactions: Transaction[];
}

const Wallet: React.FC = () => {
    const [wallet, setWallet] = useState<WalletData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWalletData = async () => {
            try {
                setLoading(true);
                const walletResponse = await getWalletInfo();
                // Sort transactions by createdAt in descending order
                const sortedWallet = {
                    ...walletResponse?.data?.wallet,
                    transactions: walletResponse?.data?.wallet.transactions.sort(
                        (a: Transaction, b: Transaction) =>
                            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                    )
                };
                setWallet(sortedWallet);
            } catch (err: any) {
                setError(err.message || 'Không thể tải thông tin ví');
            } finally {
                setLoading(false);
            }
        };

        fetchWalletData();
    }, []);

    const getStatusText = (status: number) => {
        switch (status) {
            case 0:
                return <span style={{ color: '#1890ff' }}>Chưa xử lý</span>;
            case 1:
                return <span style={{ color: '#52c41a' }}>Thành công</span>;
            case 2:
                return <span style={{ color: '#ff4d4f' }}>Thất bại</span>;
            default:
                return <span style={{ color: '#8c8c8c' }}>Không xác định</span>;
        }
    };

    const getWalletStatusText = (status: number) => {
        return status === 0 ? (
            <span style={{ color: '#52c41a' }}>Hoạt động</span>
        ) : (
            <span style={{ color: '#ff4d4f' }}>Bị khóa</span>
        );
    };

    const columns = [
        {
            title: 'Ngày',
            dataIndex: 'createdAt',
            key: 'createdAt',
            render: (text: string) => new Date(text).toLocaleDateString('vi-VN'),
        },
        {
            title: 'Loại',
            dataIndex: 'type',
            key: 'type',
        },
        {
            title: 'Mô tả',
            dataIndex: 'description',
            key: 'description',
            render: (text: string | null) => text || 'Không có mô tả',
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            render: (amount: number, record: Transaction) => (
                <span style={{ color: record.type === 'refund' ? '#52c41a' : '#ff4d4f' }}>
                    {record.type === 'refund' ? '+' : '-'}
                    {amount.toLocaleString('vi-VN')} VNĐ
                </span>
            ),
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: getStatusText,
        },
    ];

    if (loading) {
        return <div className="p-6 text-center">Đang tải...</div>;
    }

    if (error || !wallet) {
        return <div className="p-6 text-center text-red-600">{error || 'Không tìm thấy ví'}</div>;
    }

    return (
        <div style={{ padding: '24px', background: '#f0f2f5', minHeight: '100vh' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <Title level={2} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
                    <WalletIcon size={24} />
                    Ví của bạn
                </Title>

                {/* Balance and Status Section */}
                <Card style={{ marginBottom: '24px' }}>
                    <Title level={4}>Thông tin ví</Title>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <Text type="secondary">Số dư</Text>
                            <Title level={3} style={{ color: '#1890ff', margin: 0 }}>
                                {wallet.balance.toLocaleString('vi-VN')} VNĐ
                            </Title>
                        </div>
                        <div>
                            <Text type="secondary">Trạng thái ví</Text>
                            <Title level={4} style={{ margin: 0 }}>{getWalletStatusText(wallet.status)}</Title>
                        </div>
                    </div>
                </Card>

                {/* Transaction History Section */}
                <Card>
                    <Title level={4} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Clock size={20} />
                        Lịch sử giao dịch
                    </Title>
                    <Table
                        columns={columns}
                        dataSource={wallet.transactions}
                        rowKey="_id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            pageSizeOptions: ['10', '20', '50'],
                        }}
                        locale={{ emptyText: 'Không có giao dịch nào' }}
                    />
                </Card>
            </div>
        </div>
    );
};

export default Wallet;