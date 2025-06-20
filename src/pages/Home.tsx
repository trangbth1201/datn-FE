import { CaretRightOutlined } from "@ant-design/icons";
import { useQuery } from '@tanstack/react-query';
import { Carousel } from "antd";
import React, { useMemo, useState } from "react";
import Marquee from "react-fast-marquee";
import about from "../assets/image/about.png";
import image_1 from "../assets/image/footer-1.png";
import image_2 from "../assets/image/footer-2.png";
import image_3 from "../assets/image/footer-3.png";
import thuml from "../assets/image/product-remove.png";
import ImageSlide from "../assets/image/slideshow-1_1920x 1.jpg";
import { useNavigate } from "react-router-dom";
import { productService } from '../services/product.service';
import { IProduct } from '../interface/product.interface';

const Home: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string>('1');
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery<{ docs: IProduct[] }>({
    queryKey: ['products'],
    queryFn: productService.getAllProducts,
  });

  const products = data?.docs || [];

  const activeProducts = useMemo(() => {
    return products.filter(product => product.isActive);
  }, [products]);

const filteredProducts = useMemo(() => {
    if (!activeProducts.length) return [];

    let filtered = activeProducts;

    if (selectedId === '2') {
      filtered = [...activeProducts].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } else if (selectedId === '3') {
      filtered = activeProducts.filter(product => {
        const variation = product.variation?.[0];
        return variation?.salePrice > 0 && variation.salePrice < variation?.regularPrice;
      });
    }
    return filtered.slice(0, 12);
  }, [activeProducts, selectedId]);

  const handleCheckboxChange = (id: string) => {
    setSelectedId(prev => (prev === id ? '1' : id));
  };

  const banner = [
    { name: "HAGAN CORE TF LIGHT TOURING", slogan: "SKI BOOT LINERS" },
    { name: "HAGAN CORE TF LIGHT TOURING", slogan: "SKI BOOT LINERS" },
  ];

  const productHot = [
    {
      name: "Giày Thể Thao Sneaker MULGATI HX483A",
      thuml: thuml,
      price: "10.000đ",
      priceSale: "4000đ",
    },
    {
      name: "Giày Thể Thao Sneaker MULGATI HX483A",
      thuml: thuml,
      price: "10.000đ",
      priceSale: "4000đ",
    },
    {
      name: "Giày Thể Thao Sneaker MULGATI HX483A",
      thuml: thuml,
      price: "10.000đ",
      priceSale: "4000đ",
    },
  ];

  const filterHome = [
    { title: "Bán chạy", id: "1" },
    { title: "Mới", id: "2" },
    { title: "Giảm giá", id: "3" },
  ];
  document.title = "Trang chủ";

  const checkboxStyle: React.CSSProperties = {
    width: "14px",
    height: "38px",
    borderRadius: "0",
    appearance: "none",
    border: "1px solid #999",
    position: "relative",
    cursor: "pointer",
  };

  const marqImage = [
    {
      img: image_1,
    },
    {
      img: image_2,
    },
    {
      img: image_3,
    },
    {
      img: image_1,
    },
    {
      img: image_2,
    },
    {
      img: image_3,
    },
    {
      img: image_2,
    },
  ];

  return (
    <>
      <Carousel>
        {banner.map((item) => (
          <div className="banner-item">
            <img src={ImageSlide} />
            <div className="slogan">
              <p>{item.name}</p>
              <span>{item.slogan}</span>
            </div>
          </div>
        ))}
      </Carousel>
      <div className="container mx-auto">
        <div className="grid grid-cols-3 gap-4">
          {productHot.map((item) => (
            <div className="p-4">
              <div className="hot-product">
                <div className="hot-name">{item.name}</div>
                <div className="hot-price">
                  <del className="old-price">{item.price}</del>
                  <span className="new-price">{item.priceSale}</span>
                </div>
                <img src={item.thuml} alt="@item.Name" />
                <a href="">
                  Mua ngay <CaretRightOutlined />
                </a>
              </div>
            </div>
          ))}
        </div>

        <div className="title-filter mb-4">
          {filterHome.map((item) => {
            const isChecked = selectedId === item.id;

            return (
              <div key={item.id} className="flex box-fil">
                <input
                  type="checkbox"
                  className="custom-checkbox"
                  checked={isChecked}
                  onChange={() => handleCheckboxChange(item.id)}
                  id={`cbtest-${item.id}`}
                  style={checkboxStyle}
                />
                <div>
                  <small
                    style={{
                      marginLeft: "8px",
                      color: isChecked ? "black" : "#cdcdcd",
                    }}
                    className="block"
                  >
                    {item.title}
                  </small>
                  <label
                    className="block"
                    htmlFor={`cbtest-${item.id}`}
                    style={{
                      marginLeft: "8px",
                      color: isChecked ? "black" : "#cdcdcd",
                    }}
                  >
                    {item.title}
                  </label>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 gap-6">
          {isLoading ? (
            <div>Đang tải...</div>
          ) : error ? (
            <div className="text-red-500">Có lỗi xảy ra khi tải sản phẩm</div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              Không có sản phẩm nào trong danh mục này
            </div>
          ) : (
            filteredProducts.map((product: IProduct) => {
              const displayPrice = product.variation?.[0]?.salePrice > 0
                ? product.variation[0].salePrice
                : product.variation?.[0]?.regularPrice;
              const showDiscount = product.variation?.[0]?.salePrice > 0 &&
                product.variation[0].salePrice < product.variation[0].regularPrice;
              const discountPercentage = showDiscount
                ? Math.round((1 - product.variation[0].salePrice / product.variation[0].regularPrice) * 100)
                : 0;
              return (
                <div
                  key={product._id}
                  className="bg-white min-h-[300px] flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    navigate(`/products/${product.slug}`);
                  }}
                >
                  <div className="relative w-full aspect-square overflow-hidden">
                    <img
                      src={product.image[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isActive && (
                        <span className="m-0 text-xs px-2 py-0.5 rounded-bl-md rounded-tr-md text-white font-bold bg-green-600">
                          MỚI
                        </span>
                      )}
                      {showDiscount && (
                        <span className="m-0 text-xs px-2 py-0.5 rounded-bl-md rounded-tr-md text-white font-bold bg-red-500">
                          -{discountPercentage}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium mb-2 truncate">
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-red-500 font-bold">
                        {displayPrice?.toLocaleString('vi-VN')}đ
                      </span>
                      {showDiscount && (
                        <span className="text-gray-400 line-through">
                          {product.variation[0].regularPrice?.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="intro">
        <div className="container mx-auto h-full">
          <div className="grid grid-cols-12 h-full">
            <div className="col-span-4 relative h-full">
              <img src={about} alt="" className="intro-img" />
            </div>
            <div className="col-span-8 p-4">
              <div className="content-detail mb-4 text-white"></div>
              <a href="" className="see-more">
                Xem thêm
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto">
        <small
          style={{
            marginLeft: "8px",
            color: "#cdcdcd",
          }}
          className="block small-title"
        >
          Giày chạy
        </small>
        <label
          className="block big-title"
          style={{
            marginLeft: "8px",
            color: "black",
          }}
        >
          SHOES
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 mb-10">
          {isLoading ? (
            <div>Đang tải...</div>
          ) : error ? (
            <div className="text-red-500">Có lỗi xảy ra khi tải sản phẩm</div>
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full text-center text-gray-500">
              Không có sản phẩm nào trong danh mục này
            </div>
          ) : (
            filteredProducts.map((product: IProduct) => {
              const displayPrice = product.variation?.[0]?.salePrice > 0
                ? product.variation[0].salePrice
                : product.variation?.[0]?.regularPrice;
              const showDiscount = product.variation?.[0]?.salePrice > 0 &&
                product.variation[0].salePrice < product.variation[0].regularPrice;
              const discountPercentage = showDiscount
                ? Math.round((1 - product.variation[0].salePrice / product.variation[0].regularPrice) * 100)
                : 0;
              return (
                <div
                  key={product._id}
                  className="bg-white min-h-[300px] flex flex-col overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    navigate(`/products/${product.slug}`);
                  }}
                >
                  <div className="relative w-full aspect-square overflow-hidden">
                    <img
                      src={product.image[0] || "/placeholder.svg"}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {product.isActive && (
                        <span className="m-0 text-xs px-2 py-0.5 rounded-bl-md rounded-tr-md text-white font-bold bg-green-600">
                          MỚI
                        </span>
                      )}
                      {showDiscount && (
                        <span className="m-0 text-xs px-2 py-0.5 rounded-bl-md rounded-tr-md text-white font-bold bg-red-500">
                          -{discountPercentage}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-medium mb-2 truncate">
                      {product.name}
                    </h3>
                    <div className="flex justify-between items-center">
                      <span className="text-red-500 font-bold">
                        {displayPrice?.toLocaleString('vi-VN')}đ
                      </span>
                      {showDiscount && (
                        <span className="text-gray-400 line-through">
                          {product.variation[0].regularPrice?.toLocaleString('vi-VN')}đ
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <Marquee>
        {marqImage.map((item, index) => (
          <img className="marquee-img" key={index} src={item.img} alt="" />
        ))}
      </Marquee>
    </>
  );
};
export default Home;