import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MENU_ITEMS } from '../../constants/roles'; // Import file config

function Sidebar() {
  // State quản lý việc mở các menu con (dùng object để linh hoạt)
  const [expandedMenus, setExpandedMenus] = useState({});

  // Lấy Role của user hiện tại
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userRoleId = user.roleId;

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId] // Đảo trạng thái true/false
    }));
  };

  // --- Styles (Giữ nguyên của bạn) ---
  const sidebarStyle = { width: '250px', height: '100vh', backgroundColor: '#333', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, overflowY: 'auto' };
  const linkStyle = { color: 'white', textDecoration: 'none', padding: '12px 15px', marginBottom: '5px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.3s', cursor: 'pointer' };
  const subLinkStyle = { ...linkStyle, paddingLeft: '40px', fontSize: '0.9em', backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: '2px' };
  const activeStyle = ({ isActive }) => ({ ...linkStyle, backgroundColor: isActive ? '#4CAF50' : 'transparent', });
  const activeSubStyle = ({ isActive }) => ({ ...subLinkStyle, backgroundColor: isActive ? '#4CAF50' : 'rgba(255, 255, 255, 0.05)', color: isActive ? 'white' : '#ccc' });

  // --- Hàm kiểm tra quyền ---
  const hasPermission = (allowedRoles) => {
    if (!allowedRoles) return true; // Không quy định role nghĩa là ai cũng vào được
    return allowedRoles.includes(userRoleId);
  };

  return (
    <aside style={sidebarStyle}>
      <h2 style={{ marginBottom: '30px', textAlign: 'center', fontSize: '20px' }}>
        ☘️ Plant Shop Admin
      </h2>
      
      <nav style={{ flexGrow: 1 }}>
        {MENU_ITEMS.map((item) => {
          // 1. Nếu không có quyền -> Ẩn luôn
          if (!hasPermission(item.permissions)) return null;

          // 2. Nếu có menu con (Children)
          if (item.children) {
            const isOpen = expandedMenus[item.id];
            return (
              <div key={item.id}>
                {/* Menu Cha */}
                <div 
                  onClick={() => toggleMenu(item.id)} 
                  style={{...linkStyle, backgroundColor: isOpen ? '#444' : 'transparent'}}
                >
                  <span>{item.title}</span>
                  <span>{isOpen ? '▲' : '▼'}</span>
                </div>

                {/* Menu Con */}
                {isOpen && (
                  <div style={{ marginBottom: '10px' }}>
                    {item.children.map((child, index) => (
                      // Kiểm tra quyền của menu con (nếu cần thiết)
                      hasPermission(child.permissions) && (
                        <NavLink key={index} to={child.path} style={activeSubStyle}>
                          {child.title}
                        </NavLink>
                      )
                    ))}
                  </div>
                )}
              </div>
            );
          }

          // 3. Nếu là menu thường
          return (
            <NavLink key={item.id} to={item.path} style={activeStyle}>
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ borderTop: '1px solid #555', paddingTop: '20px' }}>
        <NavLink to="/login" style={linkStyle}>🚪 Đăng xuất</NavLink>
      </div>
    </aside>
  );
}

export default Sidebar;