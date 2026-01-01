import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import axios from 'axios';
//import './App.css';
// Layouts
import AdminLayout from './layouts/AdminLayout'; 
import MainLayout from './layouts/MainLayout'; // Import thêm MainLayout

// Client Pages
import HomePage from './pages/client/HomePage';
import Cart from './pages/client/Cart';
import Shop from './pages/client/Shop';
// Auth Pages (Thường không dùng chung layout với Client/Admin)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
//
import IntroPage from './pages/client/IntroPage';
import Contact from './pages/client/Contact';
//
import PlantCare from './pages/client/PlantCare';

// Admin Pages
import AdminProducts from './pages/admin/AdminProducts';
import Categories from './pages/admin/Categories';
import Users from './pages/admin/Users';
import AdminPosts from './pages/admin/AdminPost';
import PostCategories from './pages/admin/PostCategories';
import Suppliers from './pages/admin/Suppliers';
import CreateImportReceipt from './pages/admin/CreateImportReceipt';
import ImportReceiptList from './pages/admin/ImportReceiptList';
import InventoryAdjustment from './pages/admin/InventoryAdjustment';
import ProductDetail from './components/common/ProductDetail';
import Checkout from './pages/client/Checkout';
import OrderSuccess from './pages/client/OrderSuccess';
import PaymentSuccess from './pages/client/PaymentSuccess';
import PaymentCancel from './pages/client/PaymentCancel';
import ProfilePage from './pages/client/ProfilePage';
import AdminOrders from './pages/admin/AdminOrder';
import SystemBackup from './pages/admin/Systembackup';
import Vouchers from './pages/admin/Vouchers';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AdminBanners from './pages/admin/AdminBanners';
import ForgotPassword from './pages/auth/ForgotPassword';
import RevenueStats from './pages/admin/RevenueStats';
import ProductStats from './pages/admin/ProductStats';
import Contacts from './pages/admin/Contacts';
import BlogPage from './pages/client/BlogPage';     // <-- Thêm dòng này
import BlogDetail from './pages/client/BlogDetail';
import GuidePage from './pages/client/GuidePage';
import { ROLES } from './constants/roles'; 
import ProtectedRoute from './components/common/ProtectedRoute';
import Testimonials from './pages/admin/Testimonials';
import ShopInfo from './pages/admin/ShopInfo';
import SystemIntegration from './pages/admin/SystemIntegration';
function App() {
  useEffect(() => {
    const fetchSystemConfig = async () => {
      try {
        // Thay đổi port 7298 cho đúng với máy bạn
        const API_BASE = 'https://localhost:7298'; 
        const res = await axios.get(`${API_BASE}/api/TblSystemConfig`);
        
        // Chuyển mảng thành object cho dễ dùng
        const config = res.data.reduce((acc, item) => {
            acc[item.configKey] = item.configValue;
            return acc;
        }, {});

        // 1. CẬP NHẬT FAVICON
        if (config.FaviconUrl) {
          // Tìm thẻ link icon cũ
          let link = document.querySelector("link[rel~='icon']");
          if (!link) {
            // Nếu chưa có thì tạo mới
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          // Gán đường dẫn ảnh mới (phải nối với API_BASE vì ảnh nằm ở server backend)
          link.href = `${API_BASE}${config.FaviconUrl}`;
        }

        // 2. CẬP NHẬT TIÊU ĐỀ TAB TRÌNH DUYỆT (TITLE)
        if (config.StoreName) {
          document.title = config.StoreName;
        }

      } catch (error) {
        console.error("Lỗi cập nhật cấu hình hệ thống:", error);
      }
    };

    fetchSystemConfig();
  }, []);
  return (
    <>
    <Routes>
      {/* --- NHÓM 1: DÀNH CHO KHÁCH HÀNG (Dùng MainLayout) --- */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<HomePage />} />
        <Route path="product/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="order-success" element={<OrderSuccess />} />
        <Route path="payment-success" element={<PaymentSuccess />} />
        <Route path="payment-cancel" element={<PaymentCancel />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:id" element={<BlogDetail />} />
        {/* Các trang khác của khách hàng... */}
        <Route path="/intro" element={<IntroPage />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/guide" element={<GuidePage />} />
        <Route path="shop" element={<Shop />} />
        <Route path="/plant-care" element={<PlantCare />} />
      </Route>

      {/* --- NHÓM 2: DÀNH CHO ADMIN (Dùng AdminLayout) --- */}
      <Route path="/admin" element={<AdminLayout />}>
        
        {/* === NHÓM CHUNG (Admin, Sale, Kho đều vào được) === */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SALES, ROLES.WAREHOUSE]} />}>
             <Route path="products" element={<AdminProducts />} />
             <Route path="categories" element={<Categories />} />
             {/* Trang profile cá nhân admin ai cũng cần */}
             <Route path="profile" element={<ProfilePage />} /> 
        </Route>


        {/* === NHÓM SALES & ADMIN === */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SALES]} />}>
             <Route path="orders" element={<AdminOrders />} />
             <Route path="vouchers" element={<Vouchers />} />
             <Route path="contacts" element={<Contacts />} />
             <Route path="posts" element={<AdminPosts/>} />
             <Route path="post-categories" element={<PostCategories />} />
             <Route path="banners" element={<AdminBanners />} />
             <Route path="statistics" element={<RevenueStats />} />
             <Route path="statistics/products" element={<ProductStats />} />
             <Route path="testimonial" element={<Testimonials />} />
        </Route>


        {/* === NHÓM KHO (WAREHOUSE) & ADMIN === */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.WAREHOUSE]} />}>
             <Route path="suppliers" element={<Suppliers/>} />
             <Route path="imports" element={<CreateImportReceipt/>} />
             <Route path="import-history" element={<ImportReceiptList/>} /> 
             <Route path="inventory-adjustment" element={<InventoryAdjustment />} />
        </Route>


        {/* === NHÓM SUPER ADMIN (CHỈ ADMIN) === */}
        <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
             <Route path="users" element={<Users />} />
             <Route path="backup" element={<SystemBackup />} />
             <Route path="shop-info" element={<ShopInfo />} />
             <Route path="system-integration" element={<SystemIntegration />} />
        </Route>

      </Route>

      {/* --- NHÓM 3: AUTH (Login/Register thường không có Layout) --- */}
      <Route path="/login" element={<Login />} />
      <Route path="register" element={<Register />} />
      <Route path="verify-otp" element={<VerifyOtp />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      
    </Routes>
    <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      </>
  );
}

export default App;