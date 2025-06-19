import React from "react";

const Footer: React.FC = () => {
  const links = [
    { name: "Liên hệ chúng tôi" },
    { name: "Giúp đỡ và tư vấn" },
    { name: "Vận chuyển và trả hàng" },
    { name: "Các điều khoản và điều kiện" },
    { name: "Chính sách hoàn tiền" },
  ]
  const about = [
    { name: "Chúng ta là ai ?" },
    { name: "Cùng chịu trách nhiệm" },
    { name: "Luật California" },
    { name: "Nghề nghiệp" },
    { name: "Chính sách bảo mật" },
  ]
  return (
    <footer >
      <div className="container mx-auto">
        <form action=""  className="text-center relative top-[-54px]">
          <div className="form-title">Nhận thông tin của chúng tôi</div>
          <span className="form-title_sub">ĐĂNG KÝ NHẬN BẢN TIN ĐỂ NHẬN ƯU ĐÃI ĐẶC BIỆT VÀ TIN TỨC ĐỘC QUYỀN VỀ CÁC SẢN PHẨM BINOVA</span>
          <label className="contact-form pr-0" htmlFor="sub" >
            <input type="email" id="sub" placeholder="NHẬP EMAIL CỦA BẠN" />
            <button>Nhận tin</button>
          </label>
        </form>
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-300 p-4">Cột 1</div>
          <div className="p-4">
            <div className="footer-title">
              DỊCH VỤ KHÁCH HÀNG
            </div>
            <ul className="ul-reset ul-ft">
              {
                links.map((item , index) => (
                  <li key={index}><a href="">{item.name}</a></li>
                ))
              }
            </ul>
          </div>
          <div className="p-4">
            <div className="footer-title">
            VỀ CHÚNG TÔI
            </div>
            <ul className="ul-reset ul-ft">
              {
                about.map((item ,index) => (
                  <li key={index}><a href="">{item.name}</a></li>
                ))
              }
            </ul>
          </div>
        </div>
      </div >
    </footer >
  );
};

export default Footer;
