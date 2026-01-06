import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Thêm useNavigate để chuyển trang khi click
import { FaTree, FaMedal, FaHandshake, FaChevronLeft, FaChevronRight, FaStar, FaCalendarAlt } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';
import './HomePage.css';
import HomeProductCard from '../../components/client/HomeProductCard';



import { API_BASE } from '../../utils/apiConfig.jsx';

function HomePage() {
  const { addToCart } = useContext(CartContext);
  const navigate = useNavigate(); // Hook để chuyển trang

  // --- STATE DỮ LIỆU ---
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [blogPosts, setBlogPosts] = useState([]);
  
  // STATE MỚI CHO DANH MỤC NỔI BẬT
  const [topCategories, setTopCategories] = useState([]);

  const [currentBanner, setCurrentBanner] = useState(0);

  // --- STATE CHO SLIDER & MOBILE (Giữ nguyên) ---
  const [testimonialStartIndex, setTestimonialStartIndex] = useState(0);
  const [blogStartIndex, setBlogStartIndex] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // Biến hỗ trợ vuốt (Giữ nguyên)
  const touchStart = useRef(0);
  const touchEnd = useRef(0);
  const minSwipeDistance = 50;

  // --- 1. THEO DÕI RESIZE MÀN HÌNH (Giữ nguyên) ---
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth < 768;
  const testimonialCount = isMobile ? 1 : 2;
  const blogCount = isMobile ? 1 : 3;

  // --- 2. CÁC API CALL ---
  
  // (Giữ nguyên các API banner, products, testimonials, blog...)
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

  // API MỚI: LẤY TOP DANH MỤC
  useEffect(() => {
    fetch(`${API_BASE}/api/TblProducts/top-categories?top=3`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
            setTopCategories(data);
        }
      })
      .catch(err => console.error("Lỗi lấy danh mục:", err));
  }, []);

  // ... (Các useEffect khác giữ nguyên: best-sellers, slider, shop, testimonials, blog) ...
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


  // --- LOGIC SLIDER, HELPER FUNC, SWIPE HANDLERS (Giữ nguyên) ---
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

  // Helper xử lý url ảnh danh mục
  const getCategoryImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/400x300?text=No+Image'; // Ảnh fallback
    if (url.startsWith('http')) return url;
    return `${API_BASE}${url}`;
  };

  const onTouchStart = (e) => {
    touchEnd.current = 0;
    touchStart.current = e.targetTouches[0].clientX;
  };
  const onTouchMove = (e) => { touchEnd.current = e.targetTouches[0].clientX; };
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

  // Hàm chuyển hướng khi click vào danh mục
  const handleCategoryClick = (catId) => {
      navigate(`/shop?categoryId=${catId}`);
  };

  return (
    <div className="homepage-wrapper">
      {/* 1. BANNER HERO (Giữ nguyên) */}
      <section className="hero-banner" style={{ 
          // Đã sửa: Bỏ ảnh loading, thay bằng màu nền khi chưa có ảnh
          backgroundImage: banners.length > 0 ? `url('${banners[currentBanner]?.image}')` : 'none',
          backgroundColor: '#e9ecef' 
        }}>
        <div className="hero-overlay"></div>
        {banners.length > 0 && (
            <>
                <div className="hero-content fade-in-text">
                    <h1 className="hero-title">{banners[currentBanner].title}</h1>
                    <p className="hero-subtitle">{banners[currentBanner].subtitle}</p>
                    <Link to={banners[currentBanner].link} className="hero-btn">KHÁM PHÁ NGAY</Link>
                </div>
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

      {/* 2. LÝ DO CHỌN (Giữ nguyên) */}
      <section className="section-container">
        <h2 className="section-title">LÝ DO CHỌN CÂY CẢNH NHA TRANG</h2>
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

      {/* 3. DANH MỤC CÂY TIÊU BIỂU (Đã cập nhật dynamic) */}
      <section className="section-container" style={{backgroundColor: '#f8f9fa'}}>
        <h2 className="section-title">DANH MỤC NỔI BẬT</h2>
        
        {topCategories.length > 0 ? (
            <div className="category-grid">
              {topCategories.map((cat) => (
                <div 
                    key={cat.categoryId} 
                    className="cat-item" 
                    onClick={() => handleCategoryClick(cat.categoryId)}
                >
                    <img 
                        src={getCategoryImageUrl(cat.imageUrl)} 
                        alt={cat.categoryName} 
                        className="cat-img" 
                    />
                    <span className="cat-label">{cat.categoryName}</span>
                </div>
              ))}
            </div>
        ) : (
            <div style={{textAlign: 'center', color: '#666', fontStyle: 'italic'}}>
                Đang cập nhật danh mục nổi bật...
            </div>
        )}
      </section>

      {/* CÁC PHẦN CÒN LẠI (TOP BÁN CHẠY, SẢN PHẨM MỚI, KHÁCH HÀNG, TIN TỨC...) GIỮ NGUYÊN KHÔNG ĐỔI */}
      {/* ... Giữ nguyên code cũ từ đoạn TOP BÁN CHẠY trở xuống ... */}
      <section className="section-container" style={{ backgroundColor: '#fff' }}>
        <div style={{textAlign: 'center', marginBottom: '30px'}}>
             <h2 className="section-title" style={{display: 'inline-block', borderBottom: '3px solid #2e7d32', paddingBottom: '5px'}}>
                <FaMedal style={{color: '#f1c40f', marginRight: '10px'}} />
                TOP BÁN CHẠY
             </h2>
             <p className="section-desc">Những sản phẩm được yêu thích nhất tại Cây cảnh Nha Trang</p>
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

      {/* 5. KHÁCH HÀNG */}
      <section className="section-container" style={{ backgroundColor: '#fff' }}>
        <h2 className="section-title">KHÁCH HÀNG NÓI VỀ PLANT SHOP</h2>
        <div 
            style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => onTouchEnd('testimonial')}
        >
            {!isMobile && testimonials.length > testimonialCount && (
                <button onClick={prevTestimonialSlide} className="slider-nav-btn nav-prev">
                    <FaChevronLeft />
                </button>
            )}
            
            <div className="testimonial-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '30px' }}>
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

            {!isMobile && testimonials.length > testimonialCount && (
                <button onClick={nextTestimonialSlide} className="slider-nav-btn nav-next">
                    <FaChevronRight />
                </button>
            )}
        </div>
        {isMobile && testimonials.length > 1 && (
             <div style={{textAlign: 'center', fontSize: '13px', color: '#999', marginTop: '15px', fontStyle: 'italic'}}>
                <FaHandshake style={{marginRight:'5px'}}/>Lướt trái/phải để xem thêm
             </div>
        )}
      </section>

      {/* 6. TIN TỨC */}
      <section className="section-container" style={{ backgroundColor: '#f9f9f9' }}>
        <h2 className="section-title">KIẾN THỨC CÂY CẢNH</h2>
        <div 
            style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}
            onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={() => onTouchEnd('blog')}
        >
            {!isMobile && blogPosts.length > blogCount && (
                <button onClick={prevBlogSlide} className="slider-nav-btn nav-prev">
                    <FaChevronLeft />
                </button>
            )}
        
            <div className="blog-grid" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '30px' }}>
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