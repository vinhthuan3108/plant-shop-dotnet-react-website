import React, { useState, useEffect, useContext } from 'react'; // Import useContext
import { Link } from 'react-router-dom';
import { FaTree, FaMedal, FaHandshake } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext'; // Import Context
import './HomePage.css';

function HomePage() {
  // 2. State để lưu dữ liệu từ API
  const { addToCart } = useContext(CartContext);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  
  // Cấu hình đường dẫn API (dựa theo code backend cũ của bạn)
  const BASE_URL = 'https://localhost:7298'; 
  const API_URL = `${BASE_URL}/api/TblProducts`;

  // 3. Gọi API khi component load
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        // Lọc sản phẩm đang hoạt động (isActive = true)
        const activeProducts = data.filter(p => p.isActive === true);
        
        // Sắp xếp sản phẩm mới nhất lên đầu (dựa vào createdAt)
        const sortedProducts = activeProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Chỉ lấy 8 sản phẩm đầu tiên để hiển thị ở trang chủ
        setFeaturedProducts(sortedProducts.slice(0, 8));
      })
      .catch(err => console.error("Lỗi fetch sản phẩm:", err));
  }, []);

  // 4. Hàm xử lý lấy link ảnh thumbnail
  const getProductImage = (product) => {
    // Nếu không có danh sách ảnh hoặc rỗng
    if (!product.tblProductImages || product.tblProductImages.length === 0) {
        return 'https://via.placeholder.com/400x400?text=No+Image'; // Ảnh mặc định nếu không có ảnh
    }

    // Tìm ảnh được đánh dấu là thumbnail
    const thumb = product.tblProductImages.find(img => img.isThumbnail === true);

    // Nếu có thumbnail thì dùng, không thì lấy ảnh đầu tiên
    const imagePath = thumb ? thumb.imageUrl : product.tblProductImages[0].imageUrl;

    // Trả về đường dẫn đầy đủ (Back-end trả về đường dẫn tương đối)
    return `${BASE_URL}${imagePath}`;
  };

  return (
    <div className="homepage-wrapper">
      
      {/* 1. BANNER HERO (Giữ nguyên) */}
      <section className="hero-banner">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title">VƯỜN CÂY VIỆT</h1>
          <p className="hero-subtitle">"Cho trải nghiệm không chỉ là cây cảnh"</p>
          <Link to="/shop" className="hero-btn">XEM CỬA HÀNG</Link>
        </div>
      </section>

      {/* 2. LÝ DO CHỌN CHÚNG TÔI (Giữ nguyên) */}
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

      {/* 3. DANH MỤC TIÊU BIỂU (Tạm thời giữ cứng hoặc gọi API Category nếu cần) */}
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

      {/* 4. SẢN PHẨM NỔI BẬT (Đã sửa để dùng dữ liệu thật) */}
      <section className="section-container">
        <h2 className="section-title">SẢN PHẨM MỚI NHẤT</h2>
        <div className="product-list-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
            <div key={product.productId} className="home-product-card">
              
              {/* Ảnh sản phẩm từ hàm helper */}
              <Link to={`/product/${product.productId}`} style={{ cursor: 'pointer' }}>
                <div style={{width: '100%', height: '250px', overflow: 'hidden'}}>
                    <img 
                      src={getProductImage(product)} 
                      alt={product.productName} 
                      className="hp-img" 
                      style={{width: '100%', height: '100%', objectFit: 'cover'}}
                    />
                </div>
            </Link>

              {/* Tên sản phẩm */}
              <Link to={`/product/${product.productId}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h3 className="hp-name">{product.productName}</h3>
              </Link>
              
              {/* Giá tiền (Ưu tiên hiện SalePrice nếu có) */}
              <span className="hp-price">
                {product.salePrice && product.salePrice < product.originalPrice ? (
                    <>
                        <span style={{textDecoration:'line-through', color:'#999', fontSize:'0.8em', marginRight:'8px'}}>
                            {product.originalPrice.toLocaleString()} đ
                        </span>
                        {product.salePrice.toLocaleString()} đ
                    </>
                ) : (
                    `${product.originalPrice.toLocaleString()} đ`
                )}
              </span>

              <button 
                  className="hp-btn"
                  onClick={() => addToCart(product)} // Gọi hàm từ Context
              >
                  THÊM VÀO GIỎ
              </button>
            </div>
          ))
          ) : (
              <p style={{textAlign: 'center', width: '100%'}}>Đang tải sản phẩm...</p>
          )}
        </div>
        <div style={{textAlign: 'center', marginTop: '30px'}}>
             <Link to="/shop" style={{color: '#2e7d32', fontWeight: 'bold', fontSize: '14px', textDecoration:'underline'}}>XEM TẤT CẢ SẢN PHẨM</Link>
        </div>
      </section>

    </div>
  );
}

export default HomePage;