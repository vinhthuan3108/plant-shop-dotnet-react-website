// src/layouts/MainLayout.jsx
import { Outlet } from 'react-router-dom';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';

function MainLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Header luôn ở trên cùng */}
      <Header />

      {/* Phần thân (Outlet) sẽ co giãn để đẩy Footer xuống đáy */}
      <div style={{ flex: 1, backgroundColor: '#f5f5f5', paddingBottom: '30px' }}>
        <Outlet />
      </div>

      {/* Footer luôn ở dưới cùng */}
      <Footer />
    </div>
  );
}

export default MainLayout;