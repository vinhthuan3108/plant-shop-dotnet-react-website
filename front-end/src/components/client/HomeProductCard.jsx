import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// 1. Import ảnh logo mặc định (Đảm bảo đường dẫn này đúng)
import defaultImg from '../../assets/images/logo.png'; 

const HomeProductCard = ({ product, addToCart, baseUrl }) => {
    const [qty, setQty] = useState(1);
    
    // Tính toán giá sale
    const isSale = product.salePrice && product.salePrice < product.originalPrice;

    // --- HÀM LẤY ẢNH THÔNG MINH (QUAN TRỌNG) ---
    const getProductImage = (prod) => {
        let imagePath = null;

        // ƯU TIÊN 1: Lấy từ trường 'Thumbnail' hoặc 'thumbnail' (Do API Shop trả về)
        if (prod.Thumbnail) {
            imagePath = prod.Thumbnail;
        } else if (prod.thumbnail) {
            imagePath = prod.thumbnail;
        }
        // ƯU TIÊN 2: Lấy từ mảng 'tblProductImages' (Do API Home/Admin trả về)
        else if (prod.tblProductImages && prod.tblProductImages.length > 0) {
            const thumb = prod.tblProductImages.find(img => img.isThumbnail === true);
            imagePath = thumb ? thumb.imageUrl : prod.tblProductImages[0].imageUrl;
        }

        // Nếu không tìm thấy đường dẫn nào -> Trả về ảnh mặc định
        if (!imagePath) return defaultImg;

        // Xử lý đường dẫn: 
        // Nếu là link online (http) thì giữ nguyên
        if (imagePath.startsWith('http')) return imagePath;
        
        // Nếu là đường dẫn nội bộ thì nối thêm baseUrl.
        // Xử lý bỏ dấu / thừa để tránh lỗi (ví dụ: ...7298//images...)
        const cleanBase = baseUrl.replace(/\/$/, ''); 
        const cleanPath = imagePath.replace(/^\//, '');
        return `${cleanBase}/${cleanPath}`;
    };

    const handleIncrease = () => setQty(prev => prev + 1);
    const handleDecrease = () => setQty(prev => (prev > 1 ? prev - 1 : 1));

    const handleAddToCart = () => {
        if (addToCart) {
            addToCart({ ...product, quantity: qty });
            setQty(1); 
            alert("Đã thêm vào giỏ hàng!");
        }
    };

    return (
        <div className="home-product-card" style={{ height: '100%' }}>
            <Link to={`/product/${product.productId}`} style={{ textDecoration: 'none' }}>
                <div className="product-img-wrap">
                    {isSale && <span className="sale-badge">SALE</span>}
                    
                    <img 
                        src={getProductImage(product)} 
                        alt={product.productName} 
                        className="hp-img"
                        // Xử lý khi ảnh bị lỗi (404) -> Tự động chuyển về ảnh Logo
                        onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = defaultImg; 
                        }} 
                    />
                </div>
            </Link>
            
            <div className="hp-info">
                <Link to={`/product/${product.productId}`} style={{ textDecoration: 'none' }}>
                    <h3 className="hp-name">{product.productName}</h3>
                </Link>
                
                <div className="hp-price-box">
                    {isSale ? (
                        <>
                            <span className="hp-price" style={{marginRight: '10px'}}>
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.salePrice)}
                            </span>
                            <span className="hp-old-price">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                            </span>
                        </>
                    ) : (
                        <span className="hp-price">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(product.originalPrice)}
                        </span>
                    )}
                </div>

                <div className="qty-wrapper">
                    <button className="qty-btn" onClick={handleDecrease}>-</button>
                    <input type="text" className="qty-input" value={qty} readOnly />
                    <button className="qty-btn" onClick={handleIncrease}>+</button>
                </div>

                <button className="hp-btn-solid" onClick={handleAddToCart}>
                    THÊM VÀO GIỎ HÀNG
                </button>
            </div>
        </div>
    );
};

export default HomeProductCard;