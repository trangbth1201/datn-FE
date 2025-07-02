import React, { useState } from 'react';
import { AutoComplete, Input, Modal, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productService } from '../services/product.service';
import { IProduct } from '../interface/product.interface';
import { removeDiacritics } from '../utils/string';

const Search: React.FC = () => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [options, setOptions] = useState<{ value: string; label: React.ReactNode }[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Lấy danh sách sản phẩm
  const { data: productsData, isLoading } = useQuery<{ docs: IProduct[] }>({
    queryKey: ['products'],
    queryFn: productService.getAllProducts,
  });

  const showModal = () => {
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setSearchQuery('');
    setOptions([]);
  };

  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (value.trim()) {
      const query = removeDiacritics(value.trim().toLowerCase());
      const products = productsData?.docs.filter(product => product.isActive) || [];
      const filteredOptions = products
        .filter(
          product =>
            removeDiacritics(product.name.toLowerCase()).includes(query) ||
            removeDiacritics(product.slug.toLowerCase()).includes(query) ||
            (product.description && removeDiacritics(product.description.toLowerCase()).includes(query))
        )
        .map(product => ({
          value: product.name,
          label: (
            <div className="flex items-center">
              <img
                src={product.image[0] || '/placeholder.svg'}
                alt={product.name}
                className="w-8 h-8 mr-2 object-cover"
              />
              <div>
                <div>{product.name}</div>
                <div className="text-gray-500">
                  {product.variation?.[0]?.salePrice > 0
                    ? product.variation[0].salePrice.toLocaleString('vi-VN')
                    : product.variation?.[0]?.regularPrice.toLocaleString('vi-VN')}
                  ₫
                </div>
              </div>
            </div>
          ),
        }))
        .slice(0, 5);
      setOptions(filteredOptions);
    } else {
      setOptions([]);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const params = new URLSearchParams();
      params.set('search', encodeURIComponent(searchQuery.trim()));
      const path = location.pathname.startsWith('/products/brand/')
        ? location.pathname
        : '/products';
      const url = `${path}?${params.toString()}`;
      console.log('Navigating to:', url);
      navigate(url);
      setIsModalVisible(false);
      setSearchQuery('');
      setOptions([]);
    }
  };

  return (
    <>
      <div className="header-icon" onClick={showModal}>
        <SearchOutlined style={{ cursor: 'pointer' }} />
      </div>
      <Modal
        title="Tìm kiếm sản phẩm"
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
        width={400}
      >
        <AutoComplete
          options={options}
          onSelect={(value) => {
            const params = new URLSearchParams();
            params.set('search', encodeURIComponent(value));
            const path = location.pathname.startsWith('/products')
              ? location.pathname
              : '/products';
            const url = `${path}?${params.toString()}`;
            console.log('Navigating from suggestion:', url);
            navigate(url);
            setIsModalVisible(false);
            setSearchQuery('');
            setOptions([]);
          }}
          onChange={handleSearchInput}
          value={searchQuery}
        >
          <Input
            placeholder="Nhập tên sản phẩm hoặc mã sản phẩm..."
            prefix={<SearchOutlined />}
            size="large"
            allowClear
            disabled={isLoading}
            onPressEnter={handleSearch}
          />
        </AutoComplete>
        {isLoading && <Spin className="mt-4 flex justify-center" />}
        <div className="mt-4 flex justify-end gap-2">
          <button
            className="px-4 py-2 bg-gray-200 rounded-md"
            onClick={handleCancel}
          >
            Hủy
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            onClick={handleSearch}
            disabled={isLoading}
          >
            Tìm kiếm
          </button>
        </div>
      </Modal>
    </>
  );
};

export default Search;