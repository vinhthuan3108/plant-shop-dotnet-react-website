import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import defaultImg from '../../assets/images/logo.png'; 
import VariantSelectionModal from './VariantSelectionModal'; // Import Modal mới tạo

const HomeProductCard = ({ product, addToCart, baseUrl }) => {
    // --- STATE ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [fullProductData, setFullProductData] = useState(null); // Lưu data đầy đủ (kèm variants) khi fetch

    // --- CHUẨN HÓA DỮ LIỆU ---
    const originalPrice = product.originalPrice ?? product.OriginalPrice ?? 0;
    const salePrice = product.salePrice ?? product.SalePrice;
    const stockQuantity = product.stockQuantity ?? product.StockQuantity ?? 0;
    const productName = product.productName ?? product.ProductName ?? "Sản phẩm";
    const productId = product.productId ?? product.ProductId;

    // --- LOGIC HIỂN THỊ ---
    const isOutOfStock = stockQuantity <= 0;
    const isSale = salePrice > 0 && salePrice < originalPrice;
    const displayPrice = isSale ? salePrice : originalPrice;

    // --- HÀM LẤY ẢNH ---
    const getProductImage = (prod) => {
        let imagePath = null;
        if (prod.Thumbnail) imagePath = prod.Thumbnail;
        else if (prod.thumbnail) imagePath = prod.thumbnail;
        else if (prod.tblProductImages && prod.tblProductImages.length > 0) {
            const thumb = prod.tblProductImages.find(img => img.isThumbnail === true);
            imagePath = thumb ? thumb.imageUrl : prod.tblProductImages[0].imageUrl;
        }

        if (!imagePath) return defaultImg;
        if (imagePath.startsWith('http')) return imagePath;
        
        const cleanBase = baseUrl ? baseUrl.replace(/\/$/, '') : ''; 
        const cleanPath = imagePath.replace(/^\//, '');
        return `${cleanBase}/${cleanPath}`;
    };

    // --- XỬ LÝ KHI BẤM "THÊM VÀO GIỎ" ---
    const handleAddToCartClick = async () => {
        if (!addToCart || isOutOfStock) return;

        // 1. Gọi API lấy chi tiết sản phẩm để lấy danh sách Variants mới nhất
        try {
            const res = await fetch(`${baseUrl}/api/TblProducts/${productId}`);
            if (res.ok) {
                const data = await res.json();
                setFullProductData(data); // Lưu lại để truyền vào Modal nếu cần

                const variants = data.tblProductVariants || [];
                
                if (variants.length === 1) {
                    // TRƯỜNG HỢP A: Chỉ có 1 loại -> Thêm ngay lập tức
                    const variant = variants[0];
                    if (variant.stockQuantity <= 0) {
                        alert("Sản phẩm này tạm hết hàng.");
                        return;
                    }

                    addToCart({
                        variantId: variant.variantId, // QUAN TRỌNG: Gửi variantId cho Backend
                        productName: data.productName,
                        variantName: variant.variantName,
                        price: variant.salePrice || variant.originalPrice,
                        imageUrl: getProductImage(product),
                        quantity: 1
                    });
                } else if (variants.length > 1) {
                    // TRƯỜNG HỢP B: Có nhiều loại -> Mở Modal để khách chọn
                    setIsModalOpen(true);
                } else {
                    alert("Lỗi dữ liệu: Sản phẩm chưa có phân loại hàng.");
                }
            } else {
                console.error("Lỗi fetch chi tiết sản phẩm");
            }
        } catch (err) {
            console.error("Lỗi kết nối:", err);
            alert("Không thể thêm vào giỏ hàng lúc này.");
        }
    };

    // --- CALLBACK KHI KHÁCH ĐÃ CHỌN XONG TỪ MODAL ---
    const handleModalConfirm = (variantId, qty, variantData) => {
        addToCart({
            variantId: variantId,
            productName: fullProductData.productName,
            variantName: variantData.variantName,
            price: variantData.salePrice || variantData.originalPrice,
            imageUrl: getProductImage(product),
            quantity: qty
        });
    };

    return (
        <>
            <div className={`home-product-card ${isOutOfStock ? 'out-of-stock' : ''}`} style={{ height: '100%' }}>
                <Link to={`/product/${productId}`} style={{ textDecoration: 'none' }}>
                    <div className="product-img-wrap" style={{ position: 'relative' }}>
                        {isOutOfStock ? (
                            <span className="stock-badge" style={{ position: 'absolute', top: '10px', left: '10px', background: '#6c757d', color: 'white', padding: '5px 10px', fontSize: '12px', fontWeight: 'bold', borderRadius: '4px', zIndex: 2 }}>
                                HẾT HÀNG
                            </span>
                        ) : (
                            isSale && <span className="sale-badge">SALE</span>
                        )}
                        
                        <img 
                            src={getProductImage(product)} 
                            alt={productName} 
                            className="hp-img"
                            style={isOutOfStock ? { opacity: 0.6, filter: 'grayscale(100%)' } : {}}
                            onError={(e) => { e.target.onerror = null; e.target.src = defaultImg; }} 
                        />
                    </div>
                </Link>
                
                <div className="hp-info">
                    <Link to={`/product/${productId}`} style={{ textDecoration: 'none' }}>
                        <h3 className="hp-name">{productName}</h3>
                    </Link>
                    
                    <div className="hp-price-box">
                        {isSale ? (
                            <>
                                <span className="hp-price" style={{marginRight: '10px'}}>
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(salePrice)}
                                </span>
                                <span className="hp-old-price">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}
                                </span>
                            </>
                        ) : (
                            <span className="hp-price">
                                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(originalPrice)}
                            </span>
                        )}
                    </div>

                    {/* Nút Thêm vào giỏ đã được cập nhật logic */}
                    <button 
                        className={`hp-btn-solid ${isOutOfStock ? 'btn-disabled' : ''}`} 
                        onClick={handleAddToCartClick}
                        disabled={isOutOfStock}
                        style={isOutOfStock ? { backgroundColor: '#ccc', cursor: 'not-allowed', borderColor: '#ccc' } : {}}
                    >
                        {isOutOfStock ? "TẠM HẾT HÀNG" : "THÊM VÀO GIỎ HÀNG"}
                    </button>
                </div>
            </div>

            {/* Modal chọn phân loại */}
            <VariantSelectionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={fullProductData}
                onConfirm={handleModalConfirm}
            />
        </>
    );
};

export default HomeProductCard;