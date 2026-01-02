/* src/pages/client/HomePage.jsx */
import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaTree, FaMedal, FaHandshake, FaChevronLeft, FaChevronRight, FaStar, FaCalendarAlt } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';
import './HomePage.css';
import HomeProductCard from '../../components/client/HomeProductCard';

// Import ảnh tĩnh (Giữ nguyên như cũ)
import phuQuyImg from '../../assets/images/phuquy.png';
import senDaImg from '../../assets/images/sendavienlua.png';
import thachBichImg from '../../assets/images/senthachbich.png';
import { API_BASE } from '../../utils/apiConfig.jsx';
function HomePage() {
  const { addToCart } = useContext(CartContext);
  
  // --- STATE DỮ LIỆU ---
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  const [currentBanner, setCurrentBanner] = useState(0);

  // --- STATE CHO SLIDER & MOBILE ---
  const [testimonialStartIndex, setTestimonialStartIndex] = useState(0);
  const [blogStartIndex, setBlogStartIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Biến hỗ trợ vuốt (Swipe)
  const touchStart = useRef(0);
  const touchEnd = useRef(0);
  const minSwipeDistance = 50;

  const BASE_URL = 'https://localhost:7298';
//const BASE_URL = 'http://vinhthuan3108-001-site1.anytempurl.com/api';
//const BASE_URL = '';  
  // --- 1. THEO DÕI RESIZE MÀN HÌNH ---
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const testimonialCount = isMobile ? 1 : 2;
  const blogCount = isMobile ? 1 : 3;

  // --- 2. CÁC API CALL (Giữ nguyên) ---
  useEffect(() => {
    fetch(`${API_BASE}/api/TblBanners/public`)
      .then(res => res.json())
      .then(data => {
        const formattedBanners = data.map(b => ({
            id: b.bannerId,
            image: b.imageUrl && b.imageUrl.startsWith('http') ? b.imageUrl : `${API_BASE}${b.imageUrl}`,
            title: b.title || '', subtitle: '', link: b.linkUrl || '/shop'
        }));
        if (formattedBanners.length > 0) setBanners(formattedBanners);
      }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/TblProducts/best-sellers?top=8`)
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setBestSellerProducts(data); })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;
    const slideInterval = setInterval(() => nextSlide(), 5000);
    return () => clearInterval(slideInterval);
  }, [currentBanner, banners.length]);

  const nextSlide = () => setCurrentBanner(prev => (prev === banners.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentBanner(prev => (prev === 0 ? banners.length - 1 : prev - 1));

  useEffect(() => {
    fetch(`${API_BASE}/api/TblProducts/shop?page=1&pageSize=8`)
      .then(res => res.json())
      .then(response => { if (response && response.data) setFeaturedProducts(response.data); })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/TblTestimonials`)
      .then(res => res.json())
      .then(data => {
        const activeTestimonials = data.filter(t => t.isActive === true);
        setTestimonials(activeTestimonials);
      }).catch(err => console.error(err));
  }, []);

  useEffect(() => {
    fetch(`${API_BASE}/api/TblPosts?status=Published`) 
      .then(res => res.json())
      .then(data => {
        const news = data.filter(p => {
             const catName = p.categoryName ? p.categoryName.toLowerCase() : "";
             return !catName.includes("giới thiệu") && !catName.includes("hướng dẫn");
        });
        setBlogPosts(news);
      }).catch(err => console.error(err));
  }, []);

  // --- LOGIC SLIDER ---
  const nextTestimonialSlide = () => { setTestimonialStartIndex(prev => (prev + testimonialCount) % testimonials.length); };
  const prevTestimonialSlide = () => { setTestimonialStartIndex(prev => (prev - testimonialCount + testimonials.length) % testimonials.length); };
  
  const getVisibleTestimonials = () => {
      if (testimonials.length === 0) return [];
      if (testimonials.length <= testimonialCount) return testimonials;
      const visible = [];
      for (let i = 0; i < testimonialCount; i++) {
          const index = (testimonialStartIndex + i) % testimonials.length;
          visible.push(testimonials[index]);
      }
      return visible;
  };

  const nextBlogSlide = () => { setBlogStartIndex(prev => (prev + blogCount) % blogPosts.length); };
  const prevBlogSlide = () => { setBlogStartIndex(prev => (prev - blogCount + blogPosts.length) % blogPosts.length); };

  const getVisibleBlogs = () => {
      if (blogPosts.length === 0) return [];
      if (blogPosts.length <= blogCount) return blogPosts;
      const visible = [];
      for (let i = 0; i < blogCount; i++) {
          const index = (blogStartIndex + i) % blogPosts.length;
          visible.push(blogPosts[index]);
      }
      return visible;
  };

  const getAvatarUrl = (url) => {
      if (!url) return 'https://via.placeholder.com/150';
      if (url.startsWith('http')) return url;
      return `${API_BASE}${url}`;
  };

  // --- SWIPE HANDLERS ---
  const onTouchStart = (e) => {
    touchEnd.current = 0;
    touchStart.current = e.targetTouches[0].clientX;
  };

  const onTouchMove = (e) => {
    touchEnd.current = e.targetTouches[0].clientX;
  };

  const onTouchEnd = (type) => {
    if (!touchStart.current || !touchEnd.current) return;
    const distance = touchStart.current - touchEnd.current;
    if (distance > minSwipeDistance) {
        if (type === 'testimonial') nextTestimonialSlide();
        if (type === 'blog') nextBlogSlide();
    }
    if (distance < -minSwipeDistance) {
        if (type === 'testimonial') prevTestimonialSlide();
        if (type === 'blog') prevBlogSlide();
    }
  };

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
                {/* Ẩn nút banner trên mobile nếu muốn, hoặc giữ nguyên */}
                {!isMobile && <button className="slider-btn prev-btn" onClick={prevSlide}><FaChevronLeft /></button>}
                {!isMobile && <button className="slider-btn next-btn" onClick={nextSlide}><FaChevronRight /></button>}
                
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
            <p className="feature-desc">Dễ dàng lựa chọn sản phẩm mà bạn mong muốn, từ cây cảnh nội ngoại thất đến cây cảnh theo chủ đề.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><FaMedal /></div>
            <h3 className="feature-title">CHẤT LƯỢNG</h3>
            <p className="feature-desc">Mọi cây xanh đều được chọn lọc kỹ lưỡng, cam kết chỉ giao những cây khỏe mạnh, dáng đẹp.</p>
          </div>
          <div className="feature-item">
            <div className="feature-icon"><FaHandshake /></div>
            <h3 className="feature-title">CẠNH TRANH</h3>
            <p className="feature-desc">Tối ưu hóa ngân sách nhờ mức giá cực kỳ cạnh tranh, phù hợp cho cả khách lẻ và khách sỉ.</p>
          </div>
        </div>
      </section>

      {/* 3. DANH MỤC */}
      <section className="section-container" style={{backgroundColor: '#f8f9fa'}}>
        <h2 className="section-title">DANH MỤC CÂY TIÊU BIỂU</h2>
        <div className="category-grid">
          <div className="cat-item">
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

      {/* TOP BÁN CHẠY */}
      <section className="section-container" style={{ backgroundColor: '#fff' }}>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
             <h2 className="section-title" style={{display: 'inline-block', borderBottom: '3px solid #2e7d32', paddingBottom: '5px'}}>
                <FaMedal style={{color: '#f1c40f', marginRight: '10px'}} />
                TOP BÁN CHẠY
             </h2>
             <p className="section-desc">Những sản phẩm được yêu thích nhất tại Plant Shop</p>
        </div>
        <div className="product-list-grid">
          {bestSellerProducts.length > 0 ? (
            bestSellerProducts.map(product => (
                <HomeProductCard key={product.productId} product={product} addToCart={addToCart} baseUrl={API_BASE} />
            ))
          ) : (<p style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1', color: '#888'}}>Đang cập nhật dữ liệu...</p>)}
        </div>
      </section>

      {/* 4. SẢN PHẨM MỚI NHẤT */}
      <section className="section-container">
        <h2 className="section-title">SẢN PHẨM MỚI NHẤT</h2>
        <div className="product-list-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
                <HomeProductCard key={product.productId} product={product} addToCart={addToCart} baseUrl={API_BASE} />
            ))
          ) : (<p style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>Đang tải sản phẩm...</p>)}
        </div>
        <div style={{textAlign: 'center'}}>
             <Link to="/shop" className="view-all-btn">XEM TẤT CẢ SẢN PHẨM</Link>
        </div>
      </section>

      {/* 5. KHÁCH HÀNG (Đã ẩn nút trên Mobile) */}
      <section className="section-container" style={{ backgroundColor: '#fff' }}>
    <h2 className="section-title">KHÁCH HÀNG NÓI VỀ PLANT SHOP</h2>
    <div 
        style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => onTouchEnd('testimonial')}
    >
        {/* Nút Prev: Ẩn trên Mobile, Hiện trên PC/iPad */}
        {!isMobile && testimonials.length > testimonialCount && (
            <button onClick={prevTestimonialSlide} className="slider-nav-btn nav-prev">
                <FaChevronLeft />
            </button>
        )}
        
        <div className="testimonial-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '30px' }}>
            {/* ... (Giữ nguyên phần map nội dung bên trong) ... */}
            {getVisibleTestimonials().length > 0 ? (
                getVisibleTestimonials().map((item, index) => (
                    <div key={`${item.testimonialId}-${index}`} className="testimonial-card">
                        <div className="t-avatar-frame">
                            <img src={getAvatarUrl(item.avatarUrl)} alt={item.name} className="t-avatar" />
                        </div>
                        <div className="t-content">
                            <div className="t-stars">{[...Array(item.rating || 5)].map((_, i) => <FaStar key={i} />)}</div>
                            <p className="t-text">"{item.content}"</p>
                            <h4 className="t-name">{item.name}</h4>
                            <span className="t-role">{item.role}</span>
                        </div>
                    </div>
                ))
            ) : (<p style={{textAlign: 'center', width: '100%'}}>Chưa có đánh giá nào.</p>)}
        </div>

        {/* Nút Next: Ẩn trên Mobile, Hiện trên PC/iPad */}
        {!isMobile && testimonials.length > testimonialCount && (
            <button onClick={nextTestimonialSlide} className="slider-nav-btn nav-next">
                <FaChevronRight />
            </button>
        )}
    </div>
        {/* Hướng dẫn vuốt cho Mobile */}
        {isMobile && testimonials.length > 1 && (
             <div style={{textAlign: 'center', fontSize: '13px', color: '#999', marginTop: '15px', fontStyle: 'italic'}}>
                <FaHandshake style={{marginRight:'5px'}}/>Lướt trái/phải để xem thêm
             </div>
        )}
      </section>

      {/* 6. TIN TỨC (Cũng ẩn nút trên Mobile cho đẹp) */}
      <section className="section-container" style={{ backgroundColor: '#f9f9f9' }}>
    <h2 className="section-title">KIẾN THỨC CÂY CẢNH</h2>
    <div 
        style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => onTouchEnd('blog')}
    >
        {/* Nút Prev */}
        {!isMobile && blogPosts.length > blogCount && (
            <button onClick={prevBlogSlide} className="slider-nav-btn nav-prev">
                <FaChevronLeft />
            </button>
        )}
    
        <div className="blog-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '30px' }}>
             {/* ... (Giữ nguyên phần map nội dung bên trong) ... */}
             {getVisibleBlogs().map((post, index) => {
                 const imgUrl = post.thumbnailUrl && post.thumbnailUrl.startsWith('http') ? post.thumbnailUrl : `${API_BASE}${post.thumbnailUrl}`;
                 return (
                    <div key={`${post.postId}-${index}`} className="blog-card">
                        <div className="blog-img-wrap">
                            <Link to={`/blog/${post.postId}`}><img src={imgUrl || 'https://via.placeholder.com/300'} alt={post.title} className="blog-img" /></Link>
                        </div>
                        <div className="blog-info">
                            <div style={{fontSize: '12px', color: '#888', marginBottom: '5px', display:'flex', alignItems:'center', gap: '5px'}}>
                                <FaCalendarAlt /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}
                            </div>
                            <h3 className="blog-title"><Link to={`/blog/${post.postId}`} style={{textDecoration:'none', color:'inherit'}}>{post.title}</Link></h3>
                            <p className="blog-desc">{post.shortDescription}</p>
                            <Link to={`/blog/${post.postId}`} className="blog-btn">Đọc ngay</Link>
                        </div>
                    </div>
                );
            })}
        </div>

        {/* Nút Next */}
        {!isMobile && blogPosts.length > blogCount && (
            <button onClick={nextBlogSlide} className="slider-nav-btn nav-next">
                <FaChevronRight />
            </button>
        )}
    </div>
        {isMobile && blogPosts.length > 1 && (
             <div style={{textAlign: 'center', fontSize: '13px', color: '#999', marginTop: '15px', fontStyle: 'italic'}}>
                <FaHandshake style={{marginRight:'5px'}}/>Lướt trái/phải để xem thêm
             </div>
        )}
      </section>
    </div>
  );
}

export default HomePage;