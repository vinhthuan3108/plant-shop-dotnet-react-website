import { Routes, Route } from 'react-router-dom';

// Layouts
import AdminLayout from './layouts/AdminLayout'; 
import MainLayout from './layouts/MainLayout'; // Import thêm MainLayout

// Client Pages
import HomePage from './pages/client/HomePage';
import Cart from './pages/client/Cart';
// Auth Pages (Thường không dùng chung layout với Client/Admin)
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';
//
import IntroPage from './pages/client/IntroPage';

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
function App() {
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
        
        {/* Các trang khác của khách hàng... */}
        <Route path="/intro" element={<IntroPage />} />
      </Route>

      {/* --- NHÓM 2: DÀNH CHO ADMIN (Dùng AdminLayout) --- */}
      <Route path="/admin" element={<AdminLayout />}>
        {/* Lưu ý: path ở đây là tương đối so với /admin */}
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<Categories />} />
        <Route path="post-categories" element={<PostCategories />} />
        <Route path="posts" element={<AdminPosts/>} />
        <Route path="suppliers" element={<Suppliers/>} />
        <Route path="imports" element={<CreateImportReceipt/>} />
        <Route path="import-history" element={<ImportReceiptList/>} /> 
        <Route path="inventory-adjustment" element={<InventoryAdjustment />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="users" element={<Users />} />
        <Route path="backup" element={<SystemBackup />} />
        <Route path="vouchers" element={<Vouchers />} />
        <Route path="banners" element={<AdminBanners />} />
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