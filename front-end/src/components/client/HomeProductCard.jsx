import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import defaultImg from '../../assets/images/logo.png'; 

const HomeProductCard = ({ product, addToCart, baseUrl }) => {
    const [qty, setQty] = useState(1);
    
    // --- KIỂM TRA HẾT HÀNG ---
    // Kiểm tra null, undefined hoặc <= 0
    const isOutOfStock = !product.stockQuantity || product.stockQuantity <= 0;

    const isSale = product.salePrice && product.salePrice < product.originalPrice;

    const getProductImage = (prod) => {
        let imagePath = null;
        if (prod.Thumbnail) {
            imagePath = prod.Thumbnail;
        } else if (prod.thumbnail) {
            imagePath = prod.thumbnail;
        }
        else if (prod.tblProductImages && prod.tblProductImages.length > 0) {
            const thumb = prod.tblProductImages.find(img => img.isThumbnail === true);
            imagePath = thumb ? thumb.imageUrl : prod.tblProductImages[0].imageUrl;
        }

        if (!imagePath) return defaultImg;

        if (imagePath.startsWith('http')) return imagePath;
        
        const cleanBase = baseUrl.replace(/\/$/, ''); 
        const cleanPath = imagePath.replace(/^\//, '');
        return `${cleanBase}/${cleanPath}`;
    };

    const handleIncrease = () => {
        // Không cho tăng nếu hết hàng
        if (!isOutOfStock) setQty(prev => prev + 1);
    };
    
    const handleDecrease = () => {
        if (!isOutOfStock) setQty(prev => (prev > 1 ? prev - 1 : 1));
    };

    const handleAddToCart = () => {
        // Chặn click nếu hết hàng
        if (addToCart && !isOutOfStock) {
            addToCart({ ...product, quantity: qty });
            setQty(1); 
        }
    };

    return (
        <div className={`home-product-card ${isOutOfStock ? 'out-of-stock' : ''}`} style={{ height: '100%' }}>
            <Link to={`/product/${product.productId}`} style={{ textDecoration: 'none' }}>
                <div className="product-img-wrap" style={{ position: 'relative' }}>
                    {/* --- LOGIC HIỂN THỊ NHÃN --- */}
                    {isOutOfStock ? (
                        <span className="stock-badge" style={{
                            position: 'absolute', top: '10px', left: '10px', 
                            background: '#6c757d', color: 'white', padding: '5px 10px', 
                            fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', zIndex: 2
                        }}>
                            HẾT HÀNG
                        </span>
                    ) : (
                        isSale && <span className="sale-badge">SALE</span>
                    )}
                    
                    {/* Làm mờ ảnh nếu hết hàng */}
                    <img 
                        src={getProductImage(product)} 
                        alt={product.productName} 
                        className="hp-img"
                        style={isOutOfStock ? { opacity: 0.6, filter: 'grayscale(100%)' } : {}}
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
                    <button className="qty-btn" onClick={handleDecrease} disabled={isOutOfStock}>-</button>
                    <input type="text" className="qty-input" value={qty} readOnly disabled={isOutOfStock} />
                    <button className="qty-btn" onClick={handleIncrease} disabled={isOutOfStock}>+</button>
                </div>

                {/* --- NÚT MUA HÀNG --- */}
                <button 
                    className={`hp-btn-solid ${isOutOfStock ? 'btn-disabled' : ''}`} 
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    style={isOutOfStock ? { backgroundColor: '#ccc', cursor: 'not-allowed', borderColor: '#ccc' } : {}}
                >
                    {isOutOfStock ? "TẠM HẾT HÀNG" : "THÊM VÀO GIỎ HÀNG"}
                </button>
            </div>
        </div>
    );
};

export default HomeProductCard;