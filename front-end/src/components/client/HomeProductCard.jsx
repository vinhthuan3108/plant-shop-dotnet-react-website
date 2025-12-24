import React, { useState } from 'react';
import { Link } from 'react-router-dom';

// --- 1. IMPORT ẢNH MẶC ĐỊNH (LOGO) ---
import defaultImg from '../../assets/images/logo.png'; 
// (Đảm bảo đường dẫn này đúng với nơi bạn lưu logo)

const HomeProductCard = ({ product, addToCart, baseUrl }) => {
    const [qty, setQty] = useState(1);
    
    // Tính toán giá sale
    const isSale = product.salePrice && product.salePrice < product.originalPrice;

    // --- 2. SỬA HÀM LẤY ẢNH ---
    const getProductImage = (prod) => {
        // Nếu không có danh sách ảnh, trả về ảnh mặc định (Logo)
        if (!prod.tblProductImages || prod.tblProductImages.length === 0) {
            return defaultImg;
        }
        
        // Tìm ảnh đại diện (thumbnail)
        const thumb = prod.tblProductImages.find(img => img.isThumbnail === true);
        const imagePath = thumb ? thumb.imageUrl : prod.tblProductImages[0].imageUrl;
        
        // Kiểm tra nếu link đã có http thì dùng luôn, chưa có thì nối domain
        if (!imagePath) return defaultImg; // Nếu path rỗng cũng trả về default
        return imagePath.startsWith('http') ? imagePath : `${baseUrl}${imagePath}`;
    };

    const handleIncrease = () => setQty(prev => prev + 1);
    const handleDecrease = () => setQty(prev => (prev > 1 ? prev - 1 : 1));

    const handleAddToCart = () => {
        if (addToCart) {
            addToCart({ ...product, quantity: qty });
            setQty(1); // Reset số lượng về 1 sau khi thêm
            alert("Đã thêm vào giỏ hàng!");
        }
    };

    return (
        <div className="home-product-card" style={{ height: '100%' }}>
            <Link to={`/product/${product.productId}`} style={{ textDecoration: 'none' }}>
                <div className="product-img-wrap">
                    {isSale && <span className="sale-badge">SALE</span>}
                    
                    {/* --- 3. SỬA THẺ IMG --- */}
                    <img 
                        src={getProductImage(product)} 
                        alt={product.productName} 
                        className="hp-img"
                        // Nếu ảnh bị lỗi (404), tự động chuyển sang ảnh logo
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
                                {product.salePrice.toLocaleString()} ₫
                            </span>
                            <span className="hp-old-price">
                                {product.originalPrice.toLocaleString()} ₫
                            </span>
                        </>
                    ) : (
                        <span className="hp-price">
                            {product.originalPrice.toLocaleString()} ₫
                        </span>
                    )}
                </div>

                {/* Bộ nút tăng giảm số lượng */}
                <div className="qty-wrapper">
                    <button className="qty-btn" onClick={handleDecrease}>-</button>
                    <input type="text" className="qty-input" value={qty} readOnly />
                    <button className="qty-btn" onClick={handleIncrease}>+</button>
                </div>

                {/* Nút thêm giỏ hàng */}
                <button className="hp-btn-solid" onClick={handleAddToCart}>
                    THÊM VÀO GIỎ HÀNG
                </button>
            </div>
        </div>
    );
};

export default HomeProductCard;