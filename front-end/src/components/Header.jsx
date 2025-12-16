import { Link } from 'react-router-dom';

function Header() {
  return (
    <header style={{ backgroundColor: '#333', color: 'white', padding: '15px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <h2 style={{ margin: 0 }}>Plant Shop Admin</h2>
      <nav>
        <Link to="/products" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>Quản lý Sản phẩm</Link>
        <Link to="/categories" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>Quản lý Danh mục</Link>
        <Link to="/users" style={{ color: 'white', textDecoration: 'none', marginRight: '20px' }}>Quản lý tài khoản</Link>
        <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Đăng nhập</Link>
      </nav>
    </header>
  );
}

export default Header;