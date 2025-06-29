import React from "react";
import { Routes, Route } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import Home from "./pages/Home";
import About from "./pages/About";
import AuthLayout from "./layouts/AuthLayout";
import Register from "./pages/Register";
import Login from "./pages/Login";
import { ForgotPassword } from "./pages/ForgotPassword";
import ProductCategory from "./pages/ProductCategory";
import DetailProduct from "./pages/DetailProduct";
import DetailCart from "./pages/DetailCart";
import BlogCategory from "./pages/BlogCategory";
import DetailBlog from "./pages/DetailBlog";
import { UserInfo } from "./pages/Userinfo";
import ProtectedRoute from "./auth/ProtectedRoute";
import ChangePassword from "./pages/ChangePassword";
import Order from "./pages/Order";
import DetailOrder from "./pages/DetailOrder";
import CheckoutLayout from "./pages/CheckoutLayout";
import ShippingAddressForm from "./pages/ShippingAddressForm";
import OrderConfirmationPage from "./pages/OrderConfirmationPage";
import OrderReview from "./pages/OrderReview";
import PaymentMethodSelection from "./pages/PaymentMethodSelection";
import OrderDetail from "./pages/OrderDetail";

const App: React.FC = () => {
  return (
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route path="/about" element={<About />} />
          {/* Products */}
          <Route path="/products/brand/:brandSlug/category/:categorySlug" element={<ProductCategory />} />
          <Route path="/products" element={<ProductCategory />} />
          <Route path="/products/:slug" element={< DetailProduct />} />
          <Route path="/cart" element={< DetailCart />} />
          <Route path="/checkout" element={<CheckoutLayout />}>
            <Route index element={<ShippingAddressForm />} />
            <Route path="shipping" element={<ShippingAddressForm />} />
            <Route path="payment" element={<PaymentMethodSelection />} />
            <Route path="review" element={<OrderReview />} />
          </Route>
          <Route path="/order/confirmation/:orderId" element={<OrderConfirmationPage />} />

          {/* Blogs */}
          <Route path="/blogs" element={< BlogCategory />} />
          <Route path="/blogs/detail" element={< DetailBlog />} />
          <Route path="/user/info" element={<ProtectedRoute>< UserInfo /></ProtectedRoute>} />
          <Route path="/user/changepassword" element={<ProtectedRoute>< ChangePassword /></ProtectedRoute>} />
          <Route path="/user/order" element={<ProtectedRoute>< Order /></ProtectedRoute>} />
          <Route path="/order/:orderId" element={<ProtectedRoute>< OrderDetail /></ProtectedRoute>} />

        </Route>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword/>} />
          <Route path="/products/detailorder" element = {<DetailOrder/>} />

        {/* Products */}
        <Route path="products/brand/:brandSlug/category/:categorySlug" element={<ProductCategory />} />
        <Route path="products" element={<ProductCategory />} />
        <Route path="products/:slug" element={<DetailProduct />} />
        <Route path="products/cart" element={<DetailCart />} />

        {/* Blogs */}
        <Route path="blogs" element={<BlogCategory />} />
        <Route path="blogs/detail" element={<DetailBlog />} />
        {/* <Route path="socket" element={<SocketPage />} /> */}

        {/* Protected Routes */}
        <Route path="user/info" element={<ProtectedRoute><UserInfo /></ProtectedRoute>} />
        <Route path="user/changepassword" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
        <Route path="user/order" element={<ProtectedRoute><Order /></ProtectedRoute>} />
      </Route>

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/products/detailorder" element={<DetailOrder />} />
      </Route>
    </Routes>
  );
};

export default App;
