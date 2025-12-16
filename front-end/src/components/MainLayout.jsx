import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

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