import { Routes, Route } from 'react-router-dom';

// --- SỬA DÒNG NÀY ---
// File MainLayout hiện đang nằm trong thư mục 'src/layouts'
import AdminLayout from './layouts/AdminLayout'; 

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
import AdminPosts from './pages/admin/AdminPost';
import PostCategories from './pages/admin/PostCategories';
import Suppliers from './pages/admin/Suppliers';
import CreateImportReceipt from './pages/admin/CreateImportReceipt';
import ImportReceiptList from './pages/admin/ImportReceiptList';
import InventoryAdjustment from './pages/admin/InventoryAdjustment';
function App() {
  return (
    <Routes>
      {/* Route cha có Layout */}
      <Route path="/" element={<AdminLayout />}>
        <Route index element={<HomePage />} />
        <Route path="products" element={<ProductList />} />
        
        {/* Các trang Login/Register nếu muốn có Header/Footer thì để ở đây */}
        {/* Nếu muốn trang Login trắng trơn thì đưa ra ngoài Route này */}
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="verify-otp" element={<VerifyOtp />} />
        {/* Đưa Admin vào đây để thừa hưởng MainLayout */}
        <Route path="admin">
          <Route path="products" element={<AdminProducts />} />
          <Route path="categories" element={<Categories />} />
          <Route path="post-categories" element={<PostCategories />} />
          <Route path="posts" element={<AdminPosts/>} />
          <Route path="suppliers" element={<Suppliers/>} />
          <Route path="imports" element={<CreateImportReceipt/>} />
          <Route path="import-history" element={<ImportReceiptList/>} /> 
          <Route path="inventory-adjustment" element={<InventoryAdjustment />} />
          <Route path="users" element={<Users />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;