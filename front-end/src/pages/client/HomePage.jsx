import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { FaTree, FaMedal, FaHandshake, FaChevronLeft, FaChevronRight, FaStar, FaCalendarAlt } from 'react-icons/fa'; 
import { CartContext } from '../../context/CartContext';
import './HomePage.css';

// 1. IMPORT COMPONENT CARD TỪ FILE RIÊNG (QUAN TRỌNG)
import HomeProductCard from '../../components/client/HomeProductCard'; 

// Import ảnh tĩnh
import phuQuyImg from '../../assets/images/phuquy.png';
import senDaImg from '../../assets/images/sendavienlua.png';
import thachBichImg from '../../assets/images/senthachbich.png';

function HomePage() {
  const { addToCart } = useContext(CartContext);

  // --- STATE DỮ LIỆU ---
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [banners, setBanners] = useState([]);
  const [testimonials, setTestimonials] = useState([]); 
  const [testimonialStartIndex, setTestimonialStartIndex] = useState(0);
  const [blogPosts, setBlogPosts] = useState([]); 
  
  const [currentBanner, setCurrentBanner] = useState(0);
  const [blogStartIndex, setBlogStartIndex] = useState(0); 

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
      .then(data => {
        const activeTestimonials = data.filter(t => t.isActive === true);
        setTestimonials(activeTestimonials);
      })
      .catch(err => console.error("Lỗi fetch đánh giá:", err));
  }, []);

  // --- 4. GỌI API TIN TỨC ---
  useEffect(() => {
    fetch(`${BASE_URL}/api/TblPosts?status=Published`) 
      .then(res => res.json())
      .then(data => {
        const news = data.filter(p => {
             const catName = p.categoryName ? p.categoryName.toLowerCase() : "";
             return !catName.includes("giới thiệu") && !catName.includes("hướng dẫn");
        });
        setBlogPosts(news);
      })
      .catch(err => console.error("Lỗi fetch tin tức:", err));
  }, []);

  const nextTestimonialSlide = () => {
      setTestimonialStartIndex(prev => (prev + 2) % testimonials.length);
  };

  const prevTestimonialSlide = () => {
      setTestimonialStartIndex(prev => (prev - 2 + testimonials.length) % testimonials.length);
  };

  const getVisibleTestimonials = () => {
      if (testimonials.length === 0) return [];
      if (testimonials.length <= 2) return testimonials;
      const visible = [];
      for (let i = 0; i < 2; i++) {
          const index = (testimonialStartIndex + i) % testimonials.length;
          visible.push(testimonials[index]);
      }
      return visible;
  };

  const getAvatarUrl = (url) => {
      if (!url) return 'https://via.placeholder.com/150'; 
      if (url.startsWith('http')) return url; 
      return `${BASE_URL}${url}`; 
  };

  const nextBlogSlide = () => {
      setBlogStartIndex(prev => (prev + 3) % blogPosts.length);
  };

  const prevBlogSlide = () => {
      setBlogStartIndex(prev => (prev - 3 + blogPosts.length) % blogPosts.length);
  };

  const getVisibleBlogs = () => {
      if (blogPosts.length === 0) return [];
      if (blogPosts.length <= 3) return blogPosts;
      const visible = [];
      for (let i = 0; i < 3; i++) {
          const index = (blogStartIndex + i) % blogPosts.length;
          visible.push(blogPosts[index]);
      }
      return visible;
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

      {/* 4. SẢN PHẨM MỚI NHẤT */}
      <section className="section-container">
        <h2 className="section-title">SẢN PHẨM MỚI NHẤT</h2>
        <div className="product-list-grid">
          {featuredProducts.length > 0 ? (
            featuredProducts.map(product => (
                <HomeProductCard key={product.productId} product={product} addToCart={addToCart} baseUrl={BASE_URL} />
            ))
          ) : (
              <p style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>Đang tải sản phẩm...</p>
          )}
        </div>
        <div style={{textAlign: 'center'}}>
             <Link to="/shop" className="view-all-btn">XEM TẤT CẢ SẢN PHẨM</Link>
        </div>
      </section>

      {/* 5. KHÁCH HÀNG & 6. TIN TỨC: Giữ nguyên phần còn lại */}
      <section className="section-container" style={{ backgroundColor: '#fff' }}>
        <h2 className="section-title">KHÁCH HÀNG NÓI VỀ PLANT SHOP</h2>
        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
            {testimonials.length > 2 && (
                <button onClick={prevTestimonialSlide} className="nav-btn prev" style={{ position: 'absolute', left: '-50px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: '#2e7d32', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaChevronLeft /></button>
            )}
            <div className="testimonial-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                {getVisibleTestimonials().length > 0 ? (
                    getVisibleTestimonials().map((item, index) => (
                        <div key={`${item.testimonialId}-${index}`} className="testimonial-card">
                            <div className="t-avatar-frame"><img src={getAvatarUrl(item.avatarUrl)} alt={item.name} className="t-avatar" /></div>
                            <div className="t-content">
                                <div className="t-stars">{[...Array(item.rating || 5)].map((_, i) => <FaStar key={i} />)}</div>
                                <p className="t-text">"{item.content}"</p>
                                <h4 className="t-name">{item.name}</h4>
                                <span className="t-role">{item.role}</span>
                            </div>
                        </div>
                    ))
                ) : (<p style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>Chưa có đánh giá nào.</p>)}
            </div>
            {testimonials.length > 2 && (
                <button onClick={nextTestimonialSlide} className="nav-btn next" style={{ position: 'absolute', right: '-50px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: '#2e7d32', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FaChevronRight /></button>
            )}
        </div>
      </section>

      <section className="section-container" style={{ backgroundColor: '#f9f9f9' }}>
        <h2 className="section-title">KIẾN THỨC CÂY CẢNH</h2>
        <div style={{ position: 'relative', maxWidth: '1200px', margin: '0 auto' }}>
            {blogPosts.length > 3 && (
                <button onClick={prevBlogSlide} className="blog-nav-btn prev" style={{ position: 'absolute', left: '-50px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: '#2e7d32', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}><FaChevronLeft /></button>
            )}
            <div className="blog-grid">
                {getVisibleBlogs().length > 0 ? (
                    getVisibleBlogs().map((post, index) => {
                         const imgUrl = post.thumbnailUrl && post.thumbnailUrl.startsWith('http') ? post.thumbnailUrl : `${BASE_URL}${post.thumbnailUrl}`;
                         return (
                            <div key={`${post.postId}-${index}`} className="blog-card">
                                <div className="blog-img-wrap"><Link to={`/blog/${post.postId}`}><img src={imgUrl || 'https://via.placeholder.com/300'} alt={post.title} className="blog-img" /></Link></div>
                                <div className="blog-info">
                                    <div style={{fontSize: '12px', color: '#888', marginBottom: '5px', display:'flex', alignItems:'center', gap: '5px'}}><FaCalendarAlt /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}</div>
                                    <h3 className="blog-title"><Link to={`/blog/${post.postId}`} style={{textDecoration:'none', color:'inherit'}}>{post.title}</Link></h3>
                                    <p className="blog-desc">{post.shortDescription}</p>
                                    <Link to={`/blog/${post.postId}`} className="blog-btn">Đọc ngay</Link>
                                </div>
                            </div>
                        );
                    })
                ) : (<p style={{textAlign: 'center', width: '100%', gridColumn: '1 / -1'}}>Đang tải tin tức...</p>)}
            </div>
            {blogPosts.length > 3 && (
                <button onClick={nextBlogSlide} className="blog-nav-btn next" style={{ position: 'absolute', right: '-50px', top: '50%', transform: 'translateY(-50%)', zIndex: 10, background: '#2e7d32', color: 'white', border: 'none', width: '40px', height: '40px', borderRadius: '50%', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)' }}><FaChevronRight /></button>
            )}
        </div>
      </section>
    </div>
  );
}

// !!! QUAN TRỌNG: ĐÃ XÓA COMPONENT CON Ở ĐÂY ĐỂ DÙNG COMPONENT IMPORT !!!

export default HomePage;