import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function HeaderAdmin() {
  const navigate = useNavigate();
  // Lấy thông tin user để hiển thị tên (nếu muốn)
  const user = JSON.parse(localStorage.getItem('user')) || {};

  const handleLogout = (e) => {
    e.preventDefault();
    // Xử lý đăng xuất: Xóa localStorage và chuyển trang
    localStorage.removeItem('user');
    localStorage.removeItem('token'); // Nếu có lưu token
    navigate('/login');
  };

  const headerStyle = {
    height: '60px',
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 30px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    position: 'sticky', // Giữ header khi cuộn trang
    top: 0,
    zIndex: 100
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  };

  const btnStyle = {
    textDecoration: 'none',
    color: '#555',
    fontWeight: '500',
    fontSize: '14px',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    cursor: 'pointer',
    border: 'none',
    background: 'none'
  };

  return (
    <header style={headerStyle}>
      {/* Bên trái: Tiêu đề hoặc Lời chào */}
      <div>
        <span style={{ fontWeight: 'bold', color: '#333' }}>
          Xin chào, {user.fullName || 'Admin'} 👋
        </span>
      </div>

      {/* Bên phải: Các nút chức năng */}
      <div style={rightSectionStyle}>
        {/* Nút về trang khách */}
        <NavLink to="/" style={btnStyle} title="Về trang chủ">
          🏠 Trang khách hàng
        </NavLink>

        <span style={{ color: '#ccc' }}>|</span>

        {/* Nút đăng xuất */}
        <button onClick={handleLogout} style={{ ...btnStyle, color: '#d9534f' }}>
          🚪 Đăng xuất
        </button>
      </div>
    </header>
  );
}

export default HeaderAdmin;