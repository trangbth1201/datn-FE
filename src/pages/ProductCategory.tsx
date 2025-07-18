import { DownOutlined, FilterOutlined, UpOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { Drawer, Layout, Pagination, Select, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { IBrand, ICategory } from '../interface/category.interface';
import { IProduct } from '../interface/product.interface';
import { brandService } from '../services/brand.service';
import { categoryService } from '../services/category.service';
import { productService } from '../services/product.service';
import { removeDiacritics } from '../utils/string';

const { Sider, Content } = Layout;
const { Option } = Select;

export default function ProductCategory() {
  const [searchParams] = useSearchParams();
  const { brandSlug: paramBrandSlug, categorySlug: paramCategorySlug } = useParams();
  const navigate = useNavigate();

  const selectedCategorySlug = paramCategorySlug || searchParams.get('category') || 'all';
  const selectedBrandSlug = paramBrandSlug || searchParams.get('brand') || 'all';
  const searchQuery = searchParams.get('search') || '';
  const expandedParam = searchParams.get('expanded');
  const pageParam = searchParams.get('page');

  const [showAllBrands, setShowAllBrands] = useState<boolean>(false);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
  const [isFilterVisible, setIsFilterVisible] = useState<boolean>(false);
  const [expandedCategorySlug, setExpandedCategorySlug] = useState<string | null>(expandedParam);
  const [sortBy, setSortBy] = useState<string>('bestseller');
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<string>('all');
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedRating, setSelectedRating] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(pageParam ? Number(pageParam) : 1);
  const pageSize: number = 16;

  const { data: productsData, isLoading: isLoadingProducts } = useQuery<{ docs: IProduct[] }>({
    queryKey: ['products'],
    queryFn: productService.getAllProducts,
  });

  const { data: brandData, isLoading: isLoadingBrand } = useQuery<{ docs: IBrand[] }>({
    queryKey: ['brands'],
    queryFn: brandService.getAllBrands,
  });

  const { data: categoriesData, isLoading: isLoadingCategories } = useQuery<{ docs: ICategory[] }>({
    queryKey: ['categories'],
    queryFn: categoryService.getAllCategories,
  });

  const { data: newProductsData } = useQuery<{ docs: IProduct[] }>({
    queryKey: ['products', 'new'],
    queryFn: productService.getAllProducts,
  });

  const activeProducts: IProduct[] = useMemo(() => productsData?.docs?.filter(product => product.isActive) || [], [productsData?.docs]);
  const activeBrands: IBrand[] = useMemo(() => brandData?.docs.filter(brand => brand.isActive && brand.name && brand.slug !== 'thuong-hieu-khong-xac-dinh') || [], [brandData]);

  const availableSizes: string[] = useMemo(() => {
    const sizes = new Set<string>();
    activeProducts.forEach(product => {
      product.attributes?.forEach(attr => {
        if (attr.attributeName === 'Kích Thước') {
          attr.values.forEach(size => sizes.add(size));
        }
      });
    });
    return Array.from(sizes).sort();
  }, [activeProducts]);

  const availableColors: string[] = useMemo(() => {
    const colors = new Set<string>();
    activeProducts.forEach(product => {
      product.variation?.forEach(variation => {
        variation.attributes?.forEach(attr => {
          if (attr.attributeName === 'Màu sắc') {
            attr.values.forEach(color => colors.add(color));
          }
        });
      });
    });
    return Array.from(colors);
  }, [activeProducts]);

  const { parentCategories, subCategoriesMap }: { parentCategories: ICategory[], subCategoriesMap: { [key: string]: ICategory[] } } = useMemo(() => {
    if (!categoriesData?.docs) return { parentCategories: [], subCategoriesMap: {} };
    const allActive = categoriesData.docs.filter(category => category.isActive && category.name && category.slug !== 'danh-muc-khong-xac-dinh');
    const parents = allActive.filter(cat => !cat.parentId);
    const subMap: { [parentId: string]: ICategory[] } = {};
    parents.forEach(parent => {
      if (parent.subCategories?.length) {
        const activeSubCategories = parent.subCategories.filter(sub => sub.isActive && sub.name);
        if (activeSubCategories.length) subMap[parent._id] = activeSubCategories;
      }
    });
    return { parentCategories: parents, subCategoriesMap: subMap };
  }, [categoriesData]);

  const getIdFromSlug = (slug: string, type: 'brand' | 'category'): string => {
    if (slug === 'all') return 'all';
    if (type === 'brand') return activeBrands?.find(b => b.slug === slug)?._id?.toString() || 'all';
    const parentCat = parentCategories?.find(c => c.slug === slug);
    if (parentCat) return parentCat._id.toString();
    for (const subCats of Object.values(subCategoriesMap)) {
      const subCat = subCats.find(sc => sc.slug === slug);
      if (subCat) return subCat._id.toString();
    }
    return 'all';
  };

  const getSlugFromId = (id: string, type: 'brand' | 'category'): string => {
    if (id === 'all') return 'all';
    if (type === 'brand') return activeBrands?.find(b => b._id === id)?.slug || 'all';
    const parentCat = parentCategories?.find(c => c._id === id);
    if (parentCat) return parentCat.slug;
    for (const subCats of Object.values(subCategoriesMap)) {
      const subCat = subCats.find(sc => sc._id === id);
      if (subCat) return subCat.slug;
    }
    return 'all';
  };

  const findParentCategorySlug = (subcategoryId: string): string | null => {
    for (const [parentId, subCats] of Object.entries(subCategoriesMap)) {
      if (subCats.some(sub => sub._id === subcategoryId)) {
        return parentCategories?.find(c => c._id === parentId)?.slug || null;
      }
    }
    return null;
  };

  const selectedCategoryId: string = useMemo(() => getIdFromSlug(selectedCategorySlug, 'category'), [selectedCategorySlug, parentCategories, subCategoriesMap]);
  const selectedBrandId: string = useMemo(() => getIdFromSlug(selectedBrandSlug, 'brand'), [selectedBrandSlug, activeBrands]);

  const updateUrlParams = (
    newCategoryId?: string,
    newBrandId?: string,
    newExpandedSlug?: string | null,
    newPage?: number,
    newSearch?: string
  ): void => {
    const catSlug = getSlugFromId(newCategoryId ?? selectedCategoryId, 'category');
    const brandSlug = getSlugFromId(newBrandId ?? selectedBrandId, 'brand');
    const page = newPage ?? currentPage;
    const search = newSearch ?? searchQuery;

    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (newExpandedSlug !== undefined) {
      if (newExpandedSlug) params.set('expanded', newExpandedSlug);
    } else if (expandedCategorySlug) {
      params.set('expanded', expandedCategorySlug);
    }
    if (page > 1) params.set('page', page.toString());

    if (paramBrandSlug || paramCategorySlug) {
      const finalBrandSlug = brandSlug !== 'all' ? brandSlug : paramBrandSlug || 'all';
      const finalCategorySlug = catSlug !== 'all' ? catSlug : paramCategorySlug || 'all';
      const queryString = params.toString();
      navigate(
        `/products/brand/${finalBrandSlug}/category/${finalCategorySlug}${queryString ? `?${queryString}` : ''}`,
        { replace: true }
      );
    } else {
      if (catSlug !== 'all') params.set('category', catSlug);
      if (brandSlug !== 'all') params.set('brand', brandSlug);
      const queryString = params.toString();
      navigate(queryString ? `/products?${queryString}` : '/products', { replace: true });
    }
  };

  const handleCategorySelect = (categoryId: string): void => {
    const parentSlug = findParentCategorySlug(categoryId);
    setExpandedCategorySlug(parentSlug);
    setCurrentPage(1);
    updateUrlParams(categoryId, undefined, parentSlug, 1);
  };

  const handleBrandSelect = (brandId: string): void => {
    setCurrentPage(1);
    updateUrlParams(undefined, brandId, undefined, 1);
  };

  const handlePageChange = (page: number): void => {
    setCurrentPage(page);
    updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, page);
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  useEffect(() => {
    if (selectedCategorySlug !== 'all') {
      setShowAllCategories(true);
      const categoryId = getIdFromSlug(selectedCategorySlug, 'category');
      const parentSlug = findParentCategorySlug(categoryId);
      if (parentSlug) setExpandedCategorySlug(parentSlug);
    }
    if (selectedBrandSlug !== 'all') setShowAllBrands(true);
    setCurrentPage(pageParam ? Number(pageParam) : 1);
  }, [selectedCategorySlug, selectedBrandSlug, pageParam, parentCategories, subCategoriesMap]);

  useEffect(() => {
    if (expandedParam && parentCategories) setExpandedCategorySlug(expandedParam);
  }, [expandedParam, parentCategories]);

  const filteredProducts: IProduct[] = useMemo(() => {
  if (!activeProducts) return [];

  let filtered = activeProducts.filter(product => {
    const matchCat = selectedCategoryId === 'all' || product.categoryId === selectedCategoryId;
    const matchBrand = selectedBrandId === 'all' || product.brandId === selectedBrandId;
    const matchSize = selectedSizes.length === 0 || (product.variation?.some(v => v.attributes?.some(attr => attr.attributeName === 'Kích Thước' && attr.values.some(val => selectedSizes.includes(val)))) ?? false);
    const price = product.variation?.[0]?.salePrice > 0 ? product.variation[0].salePrice : product.variation?.[0]?.regularPrice || 0;
    let matchPrice = true;
    if (priceRange !== 'all') {
      const [min, max] = priceRange.split('-').map(Number);
      matchPrice = max ? price >= min && price <= max : price >= min;
    }
    const matchColor = selectedColors.length === 0 || (product.variation?.some(v => v.attributes?.some(attr => attr.attributeName === 'Màu sắc' && attr.values.some(val => selectedColors.includes(val)))) ?? false);
    const matchRating = selectedRating === 'all' || (product.averageRating && (selectedRating === '5' ? product.averageRating === 5 : product.averageRating >= Number(selectedRating)));
    const normalizedQuery = removeDiacritics(decodeURIComponent(searchQuery).toLowerCase());
    const matchSearch = searchQuery
      ? removeDiacritics(product.name.toLowerCase()).includes(normalizedQuery) ||
        removeDiacritics(product.slug.toLowerCase()).includes(normalizedQuery) ||
        (product.description && removeDiacritics(product.description.toLowerCase()).includes(normalizedQuery))
      : true;
    return matchCat && matchBrand && matchSize && matchPrice && matchColor && matchRating && matchSearch;
  });

  if (sortBy === 'bestseller') {
    filtered.sort((a, b) => (b.selled || 0) - (a.selled || 0));
  } else if (sortBy === 'price-asc') {
    filtered.sort((a, b) => {
      const priceA = a.variation?.[0]?.salePrice > 0 ? a.variation[0].salePrice : a.variation?.[0]?.regularPrice || 0;
      const priceB = b.variation?.[0]?.salePrice > 0 ? b.variation[0].salePrice : b.variation?.[0]?.regularPrice || 0;
      return priceA - priceB;
    });
  } else if (sortBy === 'price-desc') {
    filtered.sort((a, b) => {
      const priceA = a.variation?.[0]?.salePrice > 0 ? a.variation[0].salePrice : a.variation?.[0]?.regularPrice || 0;
      const priceB = b.variation?.[0]?.salePrice > 0 ? b.variation[0].salePrice : b.variation?.[0]?.regularPrice || 0;
      return priceB - priceA;
    });
  } else if (sortBy === 'newest') {
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return filtered;
}, [activeProducts, selectedCategoryId, selectedBrandId, sortBy, selectedSizes, priceRange, selectedColors, selectedRating, searchQuery]);

  const paginatedProducts: IProduct[] = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProducts.slice(startIndex, endIndex);
  }, [filteredProducts, currentPage]);

const featuredProducts: any[] = useMemo(() => {
  if (!newProductsData?.docs) return [];
  return newProductsData.docs
    .filter(product => product.isActive)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3) 
    .map(product => ({
      id: product._id,
      slug: product.slug,
      title: product.name,
      image: product.image[0],
      price: product.variation?.[0]?.salePrice > 0 ? product.variation[0].salePrice : product.variation?.[0]?.regularPrice || 0,
    }));
}, [newProductsData]);

  const getSelectedBrandName = (): string => selectedBrandId === 'all' ? 'Tất cả' : activeBrands?.find(b => b._id === selectedBrandId)?.name || 'Tất cả';

  const getSelectedCategoryName = (): string => {
    if (selectedCategoryId === 'all') return 'Tất cả';
    const parentCat = parentCategories?.find(c => c._id === selectedCategoryId);
    if (parentCat) return parentCat.name;
    for (const subCats of Object.values(subCategoriesMap)) {
      const subCat = subCats.find(sc => sc._id === selectedCategoryId);
      if (subCat) return subCat.name;
    }
    return 'Tất cả';
  };

  const getSelectedRatingName = (): string => {
    const ratingMap: { [key: string]: string } = { all: 'Tất cả', '5': '5 sao', '4': '4 sao trở lên', '3': '3 sao trở lên', '2': '2 sao trở lên', '1': '1 sao trở lên' };
    return ratingMap[selectedRating] || 'Tất cả';
  };

  const renderProducts = () => {
    if (isLoadingProducts) return <Spin size="large" className="col-span-full" />;
    if (paginatedProducts.length === 0) {
      return <div className="col-span-full text-center text-gray-500 py-8">Không có sản phẩm nào phù hợp với bộ lọc</div>;
    }
    return paginatedProducts.map(product => {
      const displayPrice = product.variation?.[0]?.salePrice > 0 ? product.variation[0].salePrice : product.variation?.[0]?.regularPrice;
      const showDiscount = product.variation?.[0]?.salePrice > 0 && product.variation[0].salePrice < product.variation[0].regularPrice;
      const discountPercentage = showDiscount ? Math.round((1 - product.variation[0].salePrice / product.variation[0].regularPrice) * 100) : 0;
      return (
        <div
          key={product._id}
          className="bg-white min-h-[300px] flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigate(`/products/${product.slug}`)}
        >
          <div className="relative w-full aspect-square overflow-hidden">
            <img
              src={product.image?.[0] || '/placeholder.svg'}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
              loading="lazy"
            />
            <div className="absolute top-2 left-2 flex flex-col gap-1">
              {product.isActive && <span className="text-xs px-2 py-0.5 rounded-bl-md rounded-tr-md text-white font-bold bg-green-600 shadow-sm">MỚI</span>}
              {showDiscount && <span className="text-xs px-2 py-0.5 rounded-bl-md rounded-tr-md text-white font-bold bg-red-500 shadow-sm">-{discountPercentage}%</span>}
            </div>
          </div>
          <div className="p-4 flex-1 flex flex-col justify-between">
            <h3 className="text-sm font-medium mb-2 line-clamp-2 leading-tight">{product.name}</h3>
            <div className="flex justify-between items-center mt-auto">
              <span className="text-red-500 font-bold text-lg">{displayPrice?.toLocaleString('vi-VN')}đ</span>
              {showDiscount && <span className="text-gray-400 line-through text-sm">{product.variation[0].regularPrice?.toLocaleString('vi-VN')}đ</span>}
            </div>
          </div>
        </div>
      );
    });
  };

  return (
    <Layout className="min-h-screen bg-white px-3 md:px-8 lg:px-11 py-6 font-roboto">
      <Sider width={250} className="bg-white p-4 lg:mr-8 mb-6 lg:mb-0" breakpoint="lg" collapsedWidth="0">
        <div className="mb-6 bg-gray-100 relative p-5">
          <h2 className="text-base font-bold uppercase">THƯƠNG HIỆU</h2>
          <div className="relative mb-4">
            <div className="h-1 w-20 bg-orange-400"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
          </div>
          <ul className="divide-y divide-gray-200 w-full">
            <li
              onClick={() => {
                handleBrandSelect('all');
                setShowAllBrands(!showAllBrands);
              }}
              className={`flex justify-between items-center cursor-pointer px-2 py-2 transition-all duration-200 ${selectedBrandId === 'all' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
            >
              <span className="text-gray-600 text-sm font-medium">Tất cả</span>
              <span className="text-gray-400 text-base font-bold">{showAllBrands ? <UpOutlined style={{ fontSize: '12px' }} /> : <DownOutlined style={{ fontSize: '12px' }} />}</span>
            </li>
            {isLoadingBrand ? (
              <li className="px-2 py-3 text-gray-500">Đang tải...</li>
            ) : (
              showAllBrands &&
              activeBrands?.map(brand => brand.name && (
                <li
                  key={brand._id}
                  onClick={() => handleBrandSelect(String(brand._id))}
                  className={`flex justify-between items-center cursor-pointer px-2 py-2 transition-all duration-200 ${selectedBrandId === brand._id ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
                >
                  <span className="text-gray-800 text-sm font-medium">{brand.name}</span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="mb-6 bg-gray-100 relative p-5">
          <h2 className="text-base font-bold uppercase">DANH MỤC</h2>
          <div className="relative mb-4">
            <div className="h-1 w-20 bg-orange-400"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
          </div>
          <ul className="divide-y divide-gray-200 w-full">
            <li
              onClick={() => {
                handleCategorySelect('all');
                setShowAllCategories(!showAllCategories);
                setExpandedCategorySlug(null);
              }}
              className={`flex justify-between items-center cursor-pointer px-2 py-2 transition-all duration-200 ${selectedCategoryId === 'all' ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
            >
              <span className="text-gray-800 text-sm font-medium">Tất cả</span>
              <span className="text-gray-400 text-base font-bold">{showAllCategories ? <UpOutlined style={{ fontSize: '12px' }} /> : <DownOutlined style={{ fontSize: '12px' }} />}</span>
            </li>
            {isLoadingCategories ? (
              <li className="px-2 py-3 text-gray-500">Đang tải...</li>
            ) : (
              showAllCategories &&
              parentCategories?.map(cat => {
                const hasSubCategories = subCategoriesMap[cat._id]?.length > 0;
                const isExpanded = expandedCategorySlug === cat.slug;
                return (
                  <div key={cat._id}>
                    <li
                      onClick={() => {
                        if (hasSubCategories) setExpandedCategorySlug(isExpanded ? null : cat.slug);
                        else handleCategorySelect(String(cat._id));
                      }}
                      className={`flex justify-between items-center cursor-pointer px-2 py-2 transition-all duration-200 ${selectedCategoryId === cat._id ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
                    >
                      <span className="text-gray-800 text-sm font-medium">{cat.name}</span>
                      {hasSubCategories && (
                        <span className="text-gray-400 text-base font-bold">{isExpanded ? <UpOutlined style={{ fontSize: '12px' }} /> : <DownOutlined style={{ fontSize: '12px' }} />}</span>
                      )}
                    </li>
                    {hasSubCategories && isExpanded && (
                      <ul className="pl-6 bg-gray-50">
                        {subCategoriesMap[cat._id]?.map(subCat => (
                          <li
                            key={subCat._id}
                            onClick={() => handleCategorySelect(String(subCat._id))}
                            className={`flex items-center cursor-pointer px-2 py-2 transition-all duration-200 ${selectedCategoryId === subCat._id ? 'bg-gray-200 font-semibold' : 'hover:bg-gray-100'}`}
                          >
                            <span className="text-left text-gray-600 text-sm">{subCat.name}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })
            )}
          </ul>
        </div>

        <div className="mb-6 bg-gray-100 relative p-5">
          <h2 className="text-base font-bold mb-4">Các sản phẩm mới ra mắt</h2>
          <div className="relative mb-4">
            <div className="h-1 w-20 bg-orange-400"></div>
            <div className="absolute bottom-0 left-0 w-full h-px bg-gray-300"></div>
          </div>
          <div className="space-y-4">
            {featuredProducts.length === 0 ? (
              <div className="text-gray-500 text-sm text-center py-2">Chưa có sản phẩm mới</div>
            ) : (
              featuredProducts.map(product => (
                <div
                  key={product.id}
                  className="flex space-x-3 border-b pb-3 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => navigate(`/products/${product.slug}`)}
                >
                  <div className="flex-shrink-0 w-16 h-16 overflow-hidden rounded">
                    <img src={product.image || '/placeholder.svg'} alt={product.title} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-gray-900 truncate">{product.title}</h3>
                    <p className="mt-1 text-sm font-medium text-red-500">{product.price?.toLocaleString('vi-VN')}đ</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </Sider>

      <Content className="bg-white">
        <div className="bg-white p-4 mb-6 space-y-4">
          <div className="flex flex-wrap gap-2 items-center mb-4">
            <span className="text-sm font-medium text-gray-600">Đang lọc:</span>
            {searchQuery && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
                Tìm kiếm: {decodeURIComponent(searchQuery)}
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => {
                    setCurrentPage(1);
                    updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, 1, '');
                  }}
                >
                  ✕
                </button>
              </span>
            )}
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2">
              Danh mục: {getSelectedCategoryName()}
              {selectedCategoryId !== 'all' && (
                <button
                  className="text-red-500 hover:text-red-700"
                  onClick={() => {
                    handleCategorySelect('all');
                    setExpandedCategorySlug(null);
                  }}
                >
                  ✕
                </button>
              )}
            </span>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm flex items-center gap-2">
              Thương hiệu: {getSelectedBrandName()}
              {selectedBrandId !== 'all' && <button className="text-red-500 hover:text-red-700" onClick={() => handleBrandSelect('all')}>✕</button>}
            </span>
            {selectedSizes.length > 0 && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm flex items-center gap-2">
                Kích thước: {selectedSizes.join(', ')}
                <button className="text-red-500 hover:text-red-700" onClick={() => { setSelectedSizes([]); setCurrentPage(1); updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, 1); }}>✕</button>
              </span>
            )}
            {priceRange !== 'all' && (
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm flex items-center gap-2">
                Giá: {priceRange === '12000000' ? '12,000,000+ VND' : `${priceRange.split('-').map(v => Number(v).toLocaleString('vi-VN')).join(' - ')} VND`}
                <button className="text-red-500 hover:text-red-700" onClick={() => { setPriceRange('all'); setCurrentPage(1); updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, 1); }}>✕</button>
              </span>
            )}
            {selectedColors.length > 0 && (
              <div className="flex items-center gap-2 bg-pink-100 text-pink-800 rounded-full px-3 py-1 text-sm w-fit">
                <span className="font-medium">Màu sắc:</span>
                <div className="flex items-center gap-2">
                  {selectedColors.map((color, index) => (
                    <span key={index} className="w-4 h-4 border border-gray-300" style={{ backgroundColor: color }}></span>
                  ))}
                </div>
                <button className="text-red-500 hover:text-red-700" onClick={() => { setSelectedColors([]); setCurrentPage(1); updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, 1); }}>✕</button>
              </div>
            )}
            {selectedRating !== 'all' && (
              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm flex items-center gap-2">
                Đánh giá: {getSelectedRatingName()}
                <button className="text-red-500 hover:text-red-700" onClick={() => { setSelectedRating('all'); setCurrentPage(1); updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, 1); }}>✕</button>
              </span>
            )}
            {(selectedCategoryId !== 'all' || selectedBrandId !== 'all' || selectedSizes.length > 0 || priceRange !== 'all' || selectedColors.length > 0 || selectedRating !== 'all' || searchQuery) && (
              <button
                onClick={() => {
                  setSortBy('bestseller');
                  setSelectedSizes([]);
                  setPriceRange('all');
                  setSelectedColors([]);
                  setSelectedRating('all');
                  setExpandedCategorySlug(null);
                  setShowAllBrands(false);
                  setShowAllCategories(false);
                  setCurrentPage(1);
                  updateUrlParams('all', 'all', null, 1, '');
                }}
                className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm hover:bg-red-200 transition-colors"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-4 items-center justify-end">
            <button
              onClick={() => setIsFilterVisible(true)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-400 rounded-md shadow bg-white text-gray-800 hover:bg-gray-100 hover:border-gray-500 transition-colors"
            >
              <FilterOutlined />
              <span>Bộ lọc</span>
            </button>
          </div>
        </div>

        <Drawer title="Bộ lọc sản phẩm" placement="right" onClose={() => setIsFilterVisible(false)} open={isFilterVisible} width={300}>
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium mb-2">Sắp xếp theo</h3>
              <Select
                value={sortBy}
                onChange={(value: string) => { setSortBy(value); setCurrentPage(1); updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, 1); }}
                style={{ width: '100%' }}
              >
                <Option value="bestseller">Bán chạy</Option>
                <Option value="newest">Mới nhất</Option>
                <Option value="price-asc">Giá tăng dần</Option>
                <Option value="price-desc">Giá giảm dần</Option>
              </Select>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Kích thước</h3>
              <Select
                mode="multiple"
                value={selectedSizes}
                onChange={(values: string[]) => { setSelectedSizes(values); setCurrentPage(1); updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, 1); }}
                style={{ width: '100%' }}
                placeholder="Chọn kích thước"
              >
                {availableSizes.map(size => <Option key={size} value={size}>{size}</Option>)}
              </Select>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Khoảng giá</h3>
              <Select
                value={priceRange}
                onChange={(value: string) => {
                  setPriceRange(value);
                  setCurrentPage(1);
                  updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, 1);
                }}
                style={{ width: '100%' }}
              >
                <Option value="all">Tất cả</Option>
                <Option value="0-2000000">0 - 2,000,000 VND</Option>
                <Option value="2000000-5000000">2,000,000 - 5,000,000 VND</Option>
                <Option value="5000000-8000000">5,000,000 - 8,000,000 VND</Option>
                <Option value="8000000-10000000">8,000,000 - 10,000,000 VND</Option>
                <Option value="10000000-12000000">10,000,000 - 12,000,000 VND</Option>
                <Option value="12000000">12,000,000+ VND</Option>
              </Select>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Màu sắc</h3>
              <Select
                mode="multiple"
                value={selectedColors}
                onChange={(values: string[]) => { setSelectedColors(values); setCurrentPage(1); updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, 1); }}
                style={{ width: '100%' }}
                placeholder="Chọn màu sắc"
              >
                {availableColors.map(color => (
                  <Option key={color} value={color}>
                    <div className="flex items-center">
                      <span
                        className={`inline-block w-4 h-4 mr-2 rounded ${color.toLowerCase() === 'white' || color === '#ffffff' ? 'border border-gray-600' : ''}`}
                        style={{ backgroundColor: color }}
                      ></span>
                    </div>
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <h3 className="text-sm font-medium mb-2">Đánh giá</h3>
              <Select
                value={selectedRating}
                onChange={(value: string) => { setSelectedRating(value); setCurrentPage(1); updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, 1); }}
                style={{ width: '100%' }}
                placeholder="Chọn đánh giá"
              >
                <Option value="all">Tất cả</Option>
                <Option value="5">5 sao</Option>
                <Option value="4">4 sao trở lên</Option>
                <Option value="3">3 sao trở lên</Option>
                <Option value="2">2 sao trở lên</Option>
                <Option value="1">1 sao trở lên</Option>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <button
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                onClick={() => { updateUrlParams(selectedCategoryId, selectedBrandId, expandedCategorySlug, currentPage); setIsFilterVisible(false); }}
              >
                Áp dụng
              </button>
              <button
                className="flex-1 px-4 py-2 border border-gray-400 rounded-md shadow bg-white text-gray-800 hover:bg-gray-100 hover:border-gray-500 transition-colors"
                onClick={() => {
                  setSortBy('bestseller');
                  setSelectedSizes([]);
                  setPriceRange('all');
                  setSelectedColors([]);
                  setSelectedRating('all');
                  setExpandedCategorySlug(null);
                  setShowAllBrands(false);
                  setShowAllCategories(false);
                  setCurrentPage(1);
                  updateUrlParams('all', 'all', null, 1, '');
                  setIsFilterVisible(false);
                }}
              >
                Đặt lại
              </button>
            </div>
          </div>
        </Drawer>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">{renderProducts()}</div>
        <div className="mt-8 flex justify-center">
          <Pagination current={currentPage} onChange={handlePageChange} total={filteredProducts.length} pageSize={pageSize} showSizeChanger={false} />
        </div>
      </Content>
    </Layout>
  );
}