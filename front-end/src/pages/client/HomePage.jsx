import React from 'react';
import { Link } from 'react-router-dom';
import { FaTree, FaMedal, FaHandshake } from 'react-icons/fa'; // Import icon
import './HomePage.css'; // Import file CSS vừa tạo

function HomePage() {
  
  // Dữ liệu giả lập cho sản phẩm nổi bật
  const featuredProducts = [
    { id: 1, name: 'Cây Kim Ngân', price: 150000, img: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400' },
    { id: 2, name: 'Cây Lưỡi Hổ', price: 90000, img: 'https://images.unsplash.com/photo-1599598425947-32c02f0a196f?w=400' },
    { id: 3, name: 'Cây Bàng Singapore', price: 320000, img: 'https://images.unsplash.com/photo-1459156212016-c812468e2115?w=400' },
    { id: 4, name: 'Sen Đá Kim Cương', price: 45000, img: 'https://images.unsplash.com/photo-1509423350716-97f9360b4e09?w=400' },
    { id: 5, name: 'Cây Trầu Bà', price: 85000, img: 'https://images.unsplash.com/photo-1628126354320-569b7e710505?w=400' },
    { id: 6, name: 'Cây Hạnh Phúc', price: 250000, img: 'https://images.unsplash.com/photo-1616682056086-6216447c20ba?w=400' },
    { id: 7, name: 'Cây Monstera', price: 450000, img: 'https://images.unsplash.com/photo-1614594975525-e45190c55d0b?w=400' },
    { id: 8, name: 'Cây Lan Ý', price: 120000, img: 'https://images.unsplash.com/photo-1599598425947-32c02f0a196f?w=400' },
  ];

  return (
    <div className="homepage-wrapper">
      
      {/* 1. BANNER HERO */}
      <section className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">VƯỜN CÂY VIỆT</h1>
          <p className="hero-subtitle">"Cho trải nghiệm không chỉ là cây cảnh"</p>
          <Link to="/shop" className="hero-btn">XEM CỬA HÀNG</Link>
        </div>
      </section>

      {/* 2. LÝ DO CHỌN CHÚNG TÔI */}
      <section className="section-container">
        <h2 className="section-title">LÝ DO CHỌN VƯỜN CÂY VIỆT</h2>
        <div className="features-grid">
          <div className="feature-item">
            <FaTree className="feature-icon" />
            <h3 className="feature-title">ĐA DẠNG CHỦNG LOẠI</h3>
            <p className="feature-desc">Dễ dàng lựa chọn sản phẩm phù hợp. Từ cây nội thất, văn phòng đến cây phong thủy.</p>
          </div>
          <div className="feature-item">
            <FaMedal className="feature-icon" />
            <h3 className="feature-title">CHẤT LƯỢNG HÀNG ĐẦU</h3>
            <p className="feature-desc">Cây được tuyển chọn kỹ lưỡng, khỏe mạnh, dáng đẹp và thích nghi tốt.</p>
          </div>
          <div className="feature-item">
            <FaHandshake className="feature-icon" />
            <h3 className="feature-title">GIÁ CẢ CẠNH TRANH</h3>
            <p className="feature-desc">Tối ưu hóa chi phí để mang lại mức giá tốt nhất cho khách hàng lẻ và sỉ.</p>
          </div>
        </div>
      </section>

      {/* 3. DANH MỤC TIÊU BIỂU */}
      <section className="section-container" style={{backgroundColor: '#f9f9f9'}}>
        <h2 className="section-title">DANH MỤC CÂY TIÊU BIỂU</h2>
        <div className="category-grid">
          <div className="cat-item">
            <img src="https://images.unsplash.com/photo-1598547211166-5b430e7047d9?w=600" alt="Cây Văn Phòng" className="cat-img" />
            <span className="cat-label">Cây Văn Phòng</span>
          </div>
          <div className="cat-item">
            <img src="https://images.unsplash.com/photo-1463320898484-cdee8141c787?w=600" alt="Cây Để Bàn" className="cat-img" />
            <span className="cat-label">Cây Để Bàn</span>
          </div>
          <div className="cat-item">
            <img src="https://images.unsplash.com/photo-1501004318641-b39e6451bec6?w=600" alt="Cây Phong Thủy" className="cat-img" />
            <span className="cat-label">Cây Phong Thủy</span>
          </div>
        </div>
      </section>

      {/* 4. SẢN PHẨM NỔI BẬT */}
      <section className="section-container">
        <h2 className="section-title">SẢN PHẨM NỔI BẬT</h2>
        <div className="product-list-grid">
          {featuredProducts.map(product => (
            <div key={product.id} className="home-product-card">
              <img src={product.img} alt={product.name} className="hp-img" />
              <h3 className="hp-name">{product.name}</h3>
              <span className="hp-price">{product.price.toLocaleString()} đ</span>
              <button className="hp-btn">THÊM VÀO GIỎ</button>
            </div>
          ))}
        </div>
        <div style={{textAlign: 'center', marginTop: '30px'}}>
             <Link to="/shop" style={{color: '#2e7d32', fontWeight: 'bold', fontSize: '14px', textDecoration:'underline'}}>XEM TẤT CẢ SẢN PHẨM</Link>
        </div>
      </section>

    </div>
  );
}

export default HomePage;