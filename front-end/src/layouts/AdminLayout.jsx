import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar'; 
import Footer from '../components/common/Footer';
import HeaderAdmin from '../components/common/HeaderAdmin'; // Import Header mới

function AdminLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* 1. Thanh Menu bên trái (Sidebar) */}
      <div style={{ width: '260px', flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* 2. Vùng nội dung bên phải */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#f4f7f6', 
        overflowX: 'hidden'
      }}>
        
        {/* --- HEADER ADMIN NẰM Ở ĐÂY --- */}
        <HeaderAdmin />

        {/* Phần nội dung trang */}
        <main style={{ flex: 1, padding: '30px' }}>
          <Outlet />
        </main>

        {/* Footer nằm dưới cùng */}
        <Footer />
      </div>
    </div>
  );
}

export default AdminLayout;