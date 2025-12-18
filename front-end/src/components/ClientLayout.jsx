import { Outlet, Link } from 'react-router-dom';
import Footer from './Footer'; // Tận dụng lại Footer cũ hoặc tạo mới tùy bạn

function ClientLayout() {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header Khách Hàng */}
      <header style={{ 
        backgroundColor: 'white', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', 
        position: 'sticky', top: 0, zIndex: 1000 
      }}>
        <div style={{ 
          maxWidth: '1200px', margin: '0 auto', padding: '15px 20px', 
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>
            🌿 Plant Shop
          </Link>

          {/* Menu */}
          <nav>
            <Link to="/" style={{ margin: '0 15px', textDecoration: 'none', color: '#333' }}>Trang chủ</Link>
            <Link to="#" style={{ margin: '0 15px', textDecoration: 'none', color: '#333' }}>Giới thiệu</Link>
            <Link to="/login" style={{ margin: '0 15px', textDecoration: 'none', color: '#333' }}>Đăng nhập</Link>
          </nav>

          {/* Giỏ hàng (Tạm thời để icon) */}
          <div style={{ position: 'relative', cursor: 'pointer' }}>
            🛒 <span style={{ background:'red', color:'white', borderRadius:'50%', padding:'2px 6px', fontSize:'12px' }}>0</span>
          </div>
        </div>
      </header>

      {/* Nội dung thay đổi (Home, ProductDetail...) */}
      <main style={{ minHeight: '80vh', backgroundColor: '#f9f9f9', paddingBottom: '50px' }}>
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

export default ClientLayout;