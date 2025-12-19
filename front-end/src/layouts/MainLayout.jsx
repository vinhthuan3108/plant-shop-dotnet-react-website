// src/layouts/MainLayout.jsx
import { Outlet } from 'react-router-dom';
<<<<<<< HEAD
import Sidebar from '../components/common/Sidebar'; 
=======
import Header from '../components/common/Header';
>>>>>>> 3bf1dca90dc256d09f06edaa34fd4a30c01ef5d5
import Footer from '../components/common/Footer';

// function MainLayout() {
//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
//       <Header />
//       <div style={{ flex: 1, padding: '20px', backgroundColor: '#fff' }}>
//         <Outlet />
//       </div>
//       <Footer />
//     </div>
//   );
// }
function MainLayout() {
  return (
<<<<<<< HEAD
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
        backgroundColor: '#f4f7f6', // Màu nền nhẹ cho vùng admin
        overflowX: 'hidden' 
      }}>
        {/* Phần nội dung trang */}
        <main style={{ flex: 1, padding: '30px' }}>
          <Outlet />
        </main>

        {/* Footer nằm dưới cùng của phần nội dung bên phải */}
        <Footer />
      </div>
=======
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', fontFamily: 'sans-serif' }}>
      
      {/* Header luôn ở trên cùng */}
      <Header />

      {/* Phần thân (Outlet) sẽ co giãn để đẩy Footer xuống đáy */}
      <div style={{ flex: 1, backgroundColor: '#f5f5f5', paddingBottom: '30px' }}>
        <Outlet />
      </div>

      {/* Footer luôn ở dưới cùng */}
      <Footer />
>>>>>>> 3bf1dca90dc256d09f06edaa34fd4a30c01ef5d5
    </div>
  );
}

export default MainLayout;