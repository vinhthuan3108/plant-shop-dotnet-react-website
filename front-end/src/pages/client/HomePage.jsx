import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaTree, FaMedal, FaHandshake, FaChevronLeft, FaChevronRight, FaStar } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';
import './HomePage.css';
import phuQuyImg from '../../assets/images/phuquy.png';
import senDaImg from '../../assets/images/sendavienlua.png';
import thachBichImg from '../../assets/images/senthachbich.png';

function HomePage() {
  const { addToCart } = useContext(CartContext);
  
  // --- STATE DỮ LIỆU ---
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [testimonials, setTestimonials] = useState([]); 
  const [blogPosts, setBlogPosts] = useState([]);       
  const [currentBanner, setCurrentBanner] = useState(0);

  const BASE_URL = 'https://localhost:7298'; 

  // --- 1. GỌI API BANNER ---
  useEffect(() => {
    fetch(`${BASE_URL}/api/TblBanners/public`)
      .then(res => res.json())
      .then(data => {
        const formattedBanners = data.map(b => ({
            id: b.bannerId,
            image: b.imageUrl && b.imageUrl.startsWith('http') ? b.imageUrl : `${BASE_URL}${b.imageUrl}`,
            title: b.title || '', 
            subtitle: '', 
            link: b.linkUrl || '/shop'
        }));
        if (formattedBanners.length > 0) setBanners(formattedBanners);
      })
      .catch(err => console.error("Lỗi fetch banner:", err));
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const slideInterval = setInterval(() => nextSlide(), 5000);
    return () => clearInterval(slideInterval);
  }, [currentBanner, banners.length]);

  const nextSlide = () => setCurrentBanner(prev => (prev === banners.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentBanner(prev => (prev === 0 ? banners.length - 1 : prev - 1));

  // --- 2. GỌI API SẢN PHẨM ---
  useEffect(() => {
    fetch(`${BASE_URL}/api/TblProducts`)
      .then(res => res.json())
      .then(data => {
        const activeProducts = data.filter(p => p.isActive === true);
        const sortedProducts = activeProducts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setFeaturedProducts(sortedProducts.slice(0, 8));
      })
      .catch(err => console.error("Lỗi fetch sản phẩm:", err));
  }, []);

  // --- 3. GỌI API KHÁCH HÀNG ---
  useEffect(() => {
    fetch(`${BASE_URL}/api/TblTestimonials`)
      .then(res => res.json())
      .then(data => setTestimonials(data))
      .catch(err => console.error("Lỗi fetch đánh giá:", err));
  }, []);

  // --- 4. GỌI API TIN TỨC ---
  useEffect(() => {
    fetch(`${BASE_URL}/api/TblNews`)
      .then(res => res.json())
      .then(data => setBlogPosts(data))
      .catch(err => console.error("Lỗi fetch tin tức:", err));
  }, []);

  return (
    <div className="homepage-wrapper">
      
      {/* 1. BANNER HERO */}
      <section className="hero-banner" style={{ backgroundImage: banners.length > 0 ? `url('${banners[currentBanner]?.image}')` : "url('https://placehold.co/1200x500?text=Loading...')" }}>
        <div className="hero-overlay"></div>
        {banners.length > 0 && (
            <>
                <div className="hero-content fade-in-text">
                    <h1 className="hero-title">{banners[currentBanner].title}</h1>
                    <p className="hero-subtitle">{banners[currentBanner].subtitle}</p>
                    <Link to={banners[currentBanner].link} className="hero-btn">KHÁM PHÁ NGAY</Link>
                </div>
                <button className="slider-btn prev-btn" onClick={prevSlide}><FaChevronLeft /></button>
                <button className="slider-btn next-btn" onClick={nextSlide}><FaChevronRight /></button>
                <div className="slider-dots">
                    {banners.map((_, index) => (
                        <span key={index} className={`dot ${index === currentBanner ? 'active' : ''}`} onClick={() => setCurrentBanner(index)}></span>
                    ))}
                </div>
            </>
        )}
      </section>

      {/* 2. LÝ DO CHỌN */}
      <section className="section-container">
        <h2 className="section-title">LÝ DO CHỌN PLANT SHOP</h2>
        <div className="features-grid">
          <div className="feature-item">
            <div className="feature-icon"><FaTree /></div>
            <h3 className="feature-title">ĐA DẠNG</h3>
            <p className="feature-desc">Dễ dàng lựa chọn sản phẩm mà bạn mong muốn, từ cây cảnh nội ngoại thất đến cây cảnh theo chủ đề, phong thủy hoặc đặt làm quà tặng.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><FaMedal /></div>
            <h3 className="feature-title">CHẤT LƯỢNG</h3>
            <p className="feature-desc">Mọi cây xanh đều được chọn lọc kỹ lưỡng, cam kết chỉ giao những cây khỏe mạnh, dáng đẹp và sẵn sàng thích nghi với môi trường mới.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><FaHandshake /></div>
            <h3 className="feature-title">CẠNH TRANH</h3>
            <p className="feature-desc">Tối ưu hóa ngân sách nhờ mức giá cực kỳ cạnh tranh, phù hợp cho cả khách lẻ và khách có số lượng đơn hàng lớn và khách mua hàng lâu dài.</p>
          </div>
        </div>
      </section>

      {/* 3. DANH MỤC */}
      <section className="section-container" style={{backgroundColor: '#f8f9fa'}}>
        <h2 className="section-title">DANH MỤC CÂY TIÊU BIỂU</h2>
        <div className="category-grid">
        <div className="cat-item">
        {/* Dùng ngoặc nhọn {} để gọi biến */}
       <img src={phuQuyImg} alt="Cây Để Vườn" className="cat-img" />
           <span className="cat-label">Cây Để Vườn</span>
      </div>
          <div className="cat-item">
          <img src={senDaImg} alt="Cây Văn Phòng" className="cat-img" />
           <span className="cat-label">Cây Văn Phòng</span>
      </div>
          <div className="cat-item">
          <img src={thachBichImg} alt="Cây Phong Thuỷ" className="cat-img" />
           <span className="cat-label">Cây Phong Thuỷ</span>
      </div>
        </div>
      </section>

      {/* 4. SẢN PHẨM MỚI NHẤT (Đã cập nhật logic Component con) */}
      <section className="section-container">
        <h2 className="section-title">SẢN PHẨM MỚI NHẤT</h2>
        <div className="product-list-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
                <HomeProductCard 
                    key={product.productId} 
                    product={product} 
                    addToCart={addToCart} 
                    baseUrl={BASE_URL} 
                />
            ))
          ) : (
              <p style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>Đang tải sản phẩm...</p>
          )}
        </div>
        
        <div style={{textAlign: 'center'}}>
             <Link to="/shop" className="view-all-btn">XEM TẤT CẢ SẢN PHẨM</Link>
        </div>
      </section>

      {/* 4. SẢN PHẨM BÁN CHẠY (Đã cập nhật logic Component con) */}
      <section className="section-container">
        <h2 className="section-title">SẢN PHẨM BÁN CHẠY</h2>
        <div className="product-list-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
                <HomeProductCard 
                    key={product.productId} 
                    product={product} 
                    addToCart={addToCart} 
                    baseUrl={BASE_URL} 
                />
            ))
          ) : (
              <p style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>Đang tải sản phẩm...</p>
          )}
        </div>
        
        <div style={{textAlign: 'center'}}>
             <Link to="/shop" className="view-all-btn">XEM TẤT CẢ SẢN PHẨM</Link>
        </div>
      </section>

      {/* 5. KHÁCH HÀNG */}
      <section className="section-container" style={{ backgroundColor: '#fff' }}>
        <h2 className="section-title">KHÁCH HÀNG NÓI VỀ VƯỜN CÂY VIỆT</h2>
        <div className="testimonial-grid">
            {testimonials.length > 0 ? (
                testimonials.map(item => (
                    <div key={item.testimonialId} className="testimonial-card">
                        <div className="t-avatar-frame">
                            <img src={item.avatarUrl || 'https://via.placeholder.com/150'} alt={item.name} className="t-avatar" />
                        </div>
                        <div className="t-content">
                            <div className="t-stars">
                                {[...Array(item.rating || 5)].map((_, i) => <FaStar key={i} />)}
                            </div>
                            <p className="t-text">"{item.content}"</p>
                            <h4 className="t-name">{item.name}</h4>
                            <span className="t-role">{item.role}</span>
                        </div>
                    </div>
                ))
            ) : (
                <p style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>Đang tải đánh giá...</p>
            )}
        </div>
      </section>

      {/* 6. TIN TỨC */}
      <section className="section-container" style={{ backgroundColor: '#f9f9f9' }}>
        <h2 className="section-title">KIẾN THỨC CÂY CẢNH</h2>
        <div className="blog-grid">
            {blogPosts.length > 0 ? (
                blogPosts.map(post => (
                    <div key={post.newsId} className="blog-card">
                        <div className="blog-img-wrap">
                            <img src={post.imageUrl || 'https://via.placeholder.com/300'} alt={post.title} className="blog-img" />
                        </div>
                        <div className="blog-info">
                            <h3 className="blog-title">{post.title}</h3>
                            <p className="blog-desc">{post.description}</p>
                            <Link to={post.linkUrl || '/blog'} className="blog-btn">Đọc ngay</Link>
                        </div>
                    </div>
                ))
            ) : (
                <p style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>Đang tải tin tức...</p>
            )}
        </div>
      </section>

    </div>
  );
}

// --- COMPONENT CON: CARD SẢN PHẨM (Xử lý số lượng riêng biệt) ---
const HomeProductCard = ({ product, addToCart, baseUrl }) => {
    // Mỗi sản phẩm có 1 state số lượng riêng
    const [qty, setQty] = useState(1);

    const isSale = product.salePrice && product.salePrice < product.originalPrice;

    const getProductImage = (prod) => {
        if (!prod.tblProductImages || prod.tblProductImages.length === 0) {
            return 'https://via.placeholder.com/400x400?text=No+Image';
        }
        const thumb = prod.tblProductImages.find(img => img.isThumbnail === true);
        const imagePath = thumb ? thumb.imageUrl : prod.tblProductImages[0].imageUrl;
        return `${baseUrl}${imagePath}`;
    };

    const handleIncrease = () => setQty(prev => prev + 1);
    const handleDecrease = () => setQty(prev => (prev > 1 ? prev - 1 : 1));

    // Hàm thêm vào giỏ hàng với số lượng
    const handleAddToCart = () => {
        // Gửi kèm số lượng vào hàm addToCart (Nếu context của bạn hỗ trợ)
        // Nếu context chưa hỗ trợ số lượng, bạn có thể cần sửa context hoặc loop (tạm thời gửi object)
        addToCart({ ...product, quantity: qty }); 
        // Reset lại về 1 sau khi thêm (tuỳ chọn)
        setQty(1);
    };

    return (
        <div className="home-product-card">
            <Link to={`/product/${product.productId}`} style={{ textDecoration: 'none' }}>
                <div className="product-img-wrap">
                    {isSale && <span className="sale-badge">SALE</span>}
                    <img src={getProductImage(product)} alt={product.productName} className="hp-img" />
                </div>
            </Link>
            
            <div className="hp-info">
                <Link to={`/product/${product.productId}`} style={{ textDecoration: 'none' }}>
                    <h3 className="hp-name">{product.productName}</h3>
                </Link>
                
                <div className="hp-price-box">
                    {isSale ? (
                        <>
                            <span className="hp-price" style={{marginRight: '10px'}}>{product.salePrice.toLocaleString()} ₫</span>
                            <span className="hp-old-price">{product.originalPrice.toLocaleString()} ₫</span>
                        </>
                    ) : (
                        <span className="hp-price">{product.originalPrice.toLocaleString()} ₫</span>
                    )}
                </div>

                {/* --- PHẦN CHỌN SỐ LƯỢNG (GIỐNG HÌNH 2) --- */}
                <div className="qty-wrapper">
                    <button className="qty-btn" onClick={handleDecrease}>-</button>
                    <input type="text" className="qty-input" value={qty} readOnly />
                    <button className="qty-btn" onClick={handleIncrease}>+</button>
                </div>

                <button className="hp-btn-solid" onClick={handleAddToCart}>THÊM VÀO GIỎ HÀNG</button>
            </div>
        </div>
    );
};

export default HomePage;