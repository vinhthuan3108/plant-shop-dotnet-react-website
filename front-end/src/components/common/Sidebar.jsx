import { useState } from 'react'; // Thêm useState
import { NavLink } from 'react-router-dom';

function Sidebar() {
  // State để đóng/mở menu Quản lý kho
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);

  const sidebarStyle = {
    width: '250px',
    height: '100vh',
    backgroundColor: '#333',
    color: 'white',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    position: 'fixed',
    left: 0,
    top: 0,
    overflowY: 'auto' // Cho phép cuộn nếu menu quá dài
  };

  const linkStyle = {
    color: 'white',
    textDecoration: 'none',
    padding: '12px 15px',
    marginBottom: '5px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'background 0.3s',
    cursor: 'pointer'
  };

  const subLinkStyle = {
    ...linkStyle,
    paddingLeft: '40px', // Thụt đầu dòng cho menu con
    fontSize: '0.9em',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: '2px'
  };

  const activeStyle = ({ isActive }) => ({
    ...linkStyle,
    backgroundColor: isActive ? '#4CAF50' : 'transparent',
  });

  const activeSubStyle = ({ isActive }) => ({
    ...subLinkStyle,
    backgroundColor: isActive ? '#4CAF50' : 'rgba(255, 255, 255, 0.05)',
    color: isActive ? 'white' : '#ccc'
  });

  return (
    <aside style={sidebarStyle}>
      <h2 style={{ marginBottom: '30px', textAlign: 'center', fontSize: '20px' }}>
        ☘️ Plant Shop Admin
      </h2>
      
      <nav style={{ flexGrow: 1 }}>
        <NavLink to="/admin/products" style={activeStyle}>
           <span>📦 Quản lý Sản phẩm</span>
        </NavLink>
        
        <NavLink to="/admin/orders" style={activeStyle}>
           <span>📝 Quản lý đơn hàng</span>
        </NavLink>
        <NavLink to="/admin/posts" style={activeStyle}>
           <span>📝 Quản lý Bài đăng</span>
        </NavLink>
        {/* <NavLink to="/admin/suppliers" style={activeStyle}>
           <span>🏢 Quản lý Nhà cung cấp</span>
        </NavLink> */}

        {/* MỤC QUẢN LÝ KHO (CHA) */}
        <div 
          onClick={() => setIsInventoryOpen(!isInventoryOpen)} 
          style={{...linkStyle, backgroundColor: isInventoryOpen ? '#444' : 'transparent'}}
        >
          <span>📦 Quản lý Kho</span>
          <span>{isInventoryOpen ? '▲' : '▼'}</span>
        </div>

        {/* DANH SÁCH MENU CON */}
        {isInventoryOpen && (
          <div style={{ marginBottom: '10px' }}>
            <NavLink to="/admin/imports" style={activeSubStyle}>➕ Tạo Phiếu nhập</NavLink>
            <NavLink to="/admin/import-history" style={activeSubStyle}>📋 Lịch sử nhập kho</NavLink>
            <NavLink to="/admin/inventory-adjustment" style={activeSubStyle}>⚙️ Điều chỉnh tồn kho</NavLink>
            <NavLink to="/admin/suppliers" style={activeSubStyle}>⚙️ Quản lý nhà cung cấp</NavLink>
          </div>
        )}

        <NavLink to="/admin/users" style={activeStyle}>
           <span>👥 Quản lý Tài khoản</span>
        </NavLink>
        
        <NavLink to="/admin/backup" style={activeStyle}>
           <span>👥 Backup</span>
        </NavLink>
      </nav>

      <div style={{ borderTop: '1px solid #555', paddingTop: '20px' }}>
        <NavLink to="/login" style={linkStyle}>🚪 Đăng xuất</NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;