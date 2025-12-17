import { Routes, Route } from 'react-router-dom';

// --- SỬA DÒNG NÀY ---
// File MainLayout hiện đang nằm trong thư mục 'src/layouts'
import MainLayout from './layouts/MainLayout'; 

// CÁC FILE KHÁC (Đã đúng theo cấu trúc thư mục trong ảnh)
// Client Pages
import HomePage from './pages/client/HomePage';
import ProductList from './pages/client/ProductList';

// Auth Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyOtp from './pages/auth/VerifyOtp';

// Admin Pages
import AdminProducts from './pages/admin/AdminProducts';
import Categories from './pages/admin/Categories';
import Users from './pages/admin/Users';

function App() {
  return (
    <Routes>
      {/* --- KHU VỰC KHÁCH HÀNG (CLIENT) --- */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ProductList />} />
        
        {/* Các trang Login/Register nếu muốn có Header/Footer thì để ở đây */}
        {/* Nếu muốn trang Login trắng trơn thì đưa ra ngoài Route này */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-otp" element={<VerifyOtp />} />
      </Route>

      {/* --- KHU VỰC QUẢN TRỊ (ADMIN) --- */}
      <Route path="/admin">
        <Route path="products" element={<AdminProducts />} />
        <Route path="categories" element={<Categories />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}

export default App;