import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import Products from './components/Products';
import Categories from './components/Categories';
import Login from './components/Login';
import Users from './components/Users';
function App() {
  return (
    <Routes>

      {/* <Route path="/login" element={<Login />} /> */}
      <Route path="/" element={<MainLayout />}>
        
        {/* Mặc định vào trang chủ thì chuyển hướng sang trang Products */}
        <Route index element={<Navigate to="/products" />} />
        <Route path="login" element={<Login />} />

        <Route path="products" element={<Products />} />
        <Route path="categories" element={<Categories />} />
        <Route path="users" element={<Users />} />
      </Route>
    </Routes>
  );
}

export default App;