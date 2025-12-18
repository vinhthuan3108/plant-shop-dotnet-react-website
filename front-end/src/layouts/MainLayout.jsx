import { Outlet } from 'react-router-dom';
import Sidebar from '../components/common/Sidebar'; 
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
    </div>
  );
}

export default MainLayout;