import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { MENU_ITEMS } from '../../constants/roles'; 

function Sidebar() {
  const [expandedMenus, setExpandedMenus] = useState({});
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const userRoleId = user.roleId;

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuId]: !prev[menuId]
    }));
  };

  // --- Styles ---
  const sidebarStyle = { width: '260px', height: '100vh', backgroundColor: '#333', color: 'white', padding: '20px', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, overflowY: 'auto' };
  const linkStyle = { color: 'white', textDecoration: 'none', padding: '12px 15px', marginBottom: '5px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'background 0.3s', cursor: 'pointer' };
  const subLinkStyle = { ...linkStyle, paddingLeft: '40px', fontSize: '0.9em', backgroundColor: 'rgba(255, 255, 255, 0.05)', marginBottom: '2px' };
  const activeStyle = ({ isActive }) => ({ ...linkStyle, backgroundColor: isActive ? '#4CAF50' : 'transparent', });
  const activeSubStyle = ({ isActive }) => ({ ...subLinkStyle, backgroundColor: isActive ? '#4CAF50' : 'rgba(255, 255, 255, 0.05)', color: isActive ? 'white' : '#ccc' });

  const hasPermission = (allowedRoles) => {
    if (!allowedRoles) return true; 
    return allowedRoles.includes(userRoleId);
  };

  return (
    <aside style={sidebarStyle}>
      <h2 style={{ marginBottom: '30px', textAlign: 'center', fontSize: '20px', color: '#4CAF50' }}>
        ☘️ Plant Shop Admin
      </h2>
      
      <nav style={{ flexGrow: 1 }}>
        {MENU_ITEMS.map((item) => {
          if (!hasPermission(item.permissions)) return null;

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

          return (
            <NavLink key={item.id} to={item.path} style={activeStyle}>
              <span>{item.title}</span>
            </NavLink>
          );
        })}
      </nav>
      
      {/* ĐÃ XÓA PHẦN FOOTER CỦA SIDEBAR (Trang khách hàng & Đăng xuất) Ở ĐÂY */}
    </aside>
  );
}

export default Sidebar;