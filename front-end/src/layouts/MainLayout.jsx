import { Outlet } from 'react-router-dom';
// Lùi ra 1 cấp (..) rồi vào components/common
import Header from '../components/common/Header'; 
import Footer from '../components/common/Footer';

function MainLayout() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header />
      <div style={{ flex: 1, padding: '20px', backgroundColor: '#fff' }}>
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}
export default MainLayout;