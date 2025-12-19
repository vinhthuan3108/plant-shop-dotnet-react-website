import React from 'react';
import { Link } from 'react-router-dom';
// Sửa dòng này: Dùng FaFacebook thay vì FaFacebookDQ
import { FaMapMarkerAlt, FaPhoneAlt, FaEnvelope, FaFacebook, FaYoutube } from 'react-icons/fa';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-wrapper">
      <div className="footer-container">
        {/* Cột 1 */}
        <div className="footer-col">
          <h3>Vườn Cây Việt</h3>
          <ul className="footer-links contact-list">
            <li>
              <FaMapMarkerAlt className="contact-icon" />
              <span>20/4 Kỳ Đồng, P.9, Q.3, TP.HCM</span>
            </li>
            <li>
              <FaPhoneAlt className="contact-icon" />
              <span>0985 507 150</span>
            </li>
            <li>
              <FaEnvelope className="contact-icon" />
              <span>lienhe@vuoncayviet.com</span>
            </li>
          </ul>
        </div>

        {/* Cột 2 */}
        <div className="footer-col">
          <h3>Hỗ trợ khách hàng</h3>
          <ul className="footer-links">
            <li><Link to="#">Hướng dẫn mua hàng</Link></li>
            <li><Link to="#">Chính sách đổi trả</Link></li>
            <li><Link to="#">Chính sách bảo hành</Link></li>
            <li><Link to="#">Hình thức thanh toán</Link></li>
          </ul>
        </div>

        {/* Cột 3 */}
        <div className="footer-col">
          <h3>Danh mục nổi bật</h3>
          <ul className="footer-links">
            <li><Link to="/shop">Cây nội thất</Link></li>
            <li><Link to="/shop">Cây để bàn</Link></li>
            <li><Link to="/shop">Cây thủy sinh</Link></li>
            <li><Link to="/shop">Sen đá - Xương rồng</Link></li>
          </ul>
        </div>

        {/* Cột 4 */}
        <div className="footer-col">
          <h3>Kết nối với chúng tôi</h3>
          <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
             {/* --- SỬA LẠI TÊN THẺ TẠI ĐÂY --- */}
             <a href="#" style={{ fontSize: '24px', color: '#1877f2' }}><FaFacebook /></a>
             <a href="#" style={{ fontSize: '24px', color: '#ff0000' }}><FaYoutube /></a>
          </div>

          <h3>Đăng ký nhận tin</h3>
          <p style={{marginBottom: '15px'}}>Nhận thông tin khuyến mãi mới nhất.</p>
          <div style={{display: 'flex'}}>
            <input type="email" placeholder="Email của bạn..." style={{padding: '8px', border:'none', outline:'none', flex:1}} />
            <button style={{background:'#2e7d32', color:'white', border:'none', padding:'8px 15px', fontWeight:'bold'}}>GỬI</button>
          </div>
        </div>
      </div>

      <div className="copyright">
        © 2025 Copyright by Plant Shop.
      </div>
    </footer>
  );
};

export default Footer;