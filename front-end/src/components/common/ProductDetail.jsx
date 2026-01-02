import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaMinus, FaPlus, FaCheck } from 'react-icons/fa'; 
import { CartContext } from '../../context/CartContext';
import HomeProductCard from '../../components/client/HomeProductCard';
import { API_BASE } from '../../utils/apiConfig.jsx';
const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);

    // --- STATE DỮ LIỆU ---
    const [product, setProduct] = useState(null);
    const [images, setImages] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]);
    
    // --- STATE GIAO DIỆN & LOGIC ---
    const [currentIndex, setCurrentIndex] = useState(0);
    const [quantity, setQuantity] = useState(1);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    
    // State quản lý biến thể (MỚI)
    const [selectedVariantId, setSelectedVariantId] = useState(null);

    //const BASE_URL = 'https://localhost:7298';

    // --- FETCH DỮ LIỆU ---
    useEffect(() => {
        setProduct(null);
        setImages([]);
        setRelatedProducts([]);
        setQuantity(1);
        setCurrentIndex(0);
        setSelectedVariantId(null); // Reset biến thể
        window.scrollTo(0, 0);

        fetch(`${API_BASE}/api/TblProducts/${id}`) // [cite: 107]
            .then(res => res.json())
            .then(data => {
                setProduct(data);

                // Xử lý ảnh
                if (data.tblProductImages && data.tblProductImages.length > 0) {
                    const sorted = [...data.tblProductImages].sort((a, b) => 
                        (b.isThumbnail === true ? 1 : 0) - (a.isThumbnail === true ? 1 : 0)
                    );
                    setImages(sorted);
                } else if (data.thumbnail) {
                    setImages([{ imageUrl: data.thumbnail }]);
                }

                // Tự động chọn biến thể đầu tiên nếu có (Giống logic Shopee/Modal cũ)
                if (data.tblProductVariants && data.tblProductVariants.length > 0) {
                    // Ưu tiên chọn cái nào còn hàng
                    const availableVariant = data.tblProductVariants.find(v => v.stockQuantity > 0);
                    if (availableVariant) {
                        setSelectedVariantId(availableVariant.variantId);
                    } else {
                        // Nếu hết hàng sạch thì cứ chọn cái đầu
                        setSelectedVariantId(data.tblProductVariants[0].variantId);
                    }
                }

                return fetch(`${API_BASE}/api/TblProducts/related/${id}`); // [cite: 109]
            })
            .then(res => res.json())
            .then(relatedData => setRelatedProducts(relatedData))
            .catch(err => console.error("Lỗi tải dữ liệu:", err));
    }, [id]);

    // --- CÁC HÀM XỬ LÝ SỐ LƯỢNG ---
    const handleIncreaseQty = () => setQuantity(prev => prev + 1);
    const handleDecreaseQty = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));
    const handleQtyChange = (e) => {
        const val = parseInt(e.target.value);
        if (!isNaN(val) && val >= 1) setQuantity(val);
    };

    // --- CÁC HÀM XỬ LÝ ẢNH ---
    const nextImage = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    const prevImage = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    const currentImgUrl = images.length > 0 
        ? (images[currentIndex].imageUrl?.startsWith('http') ? images[currentIndex].imageUrl : `${API_BASE}${images[currentIndex].imageUrl}`) 
        : '';

    // --- XỬ LÝ HTML ---
    const cleanHtmlContent = (htmlString) => {
        if (!htmlString) return '';
        return htmlString.replace(/&nbsp;/g, ' ');
    };

    // --- TÍNH TOÁN GIÁ & TỒN KHO (LOGIC MỚI) ---
    // Tìm biến thể đang được chọn
    const currentVariant = product?.tblProductVariants?.find(v => v.variantId === selectedVariantId);

    const getDisplayInfo = () => {
        if (!product) return { price: 0, oldPrice: 0, stock: 0, isSale: false };

        // 1. Nếu ĐANG CHỌN biến thể -> Lấy thông tin chính xác của nó
        if (currentVariant) {
            return {
                price: currentVariant.salePrice && currentVariant.salePrice > 0 ? currentVariant.salePrice : currentVariant.originalPrice,
                oldPrice: currentVariant.salePrice && currentVariant.salePrice > 0 ? currentVariant.originalPrice : 0,
                stock: currentVariant.stockQuantity || 0,
                isSale: (currentVariant.salePrice > 0 && currentVariant.salePrice < currentVariant.originalPrice)
            };
        }

        // 2. Nếu CHƯA chọn (hoặc sp không có biến thể) -> Lấy khoảng giá min/max hoặc tổng
        const variants = product.tblProductVariants || [];
        if (variants.length > 0) {
            // Logic hiển thị dải giá (tùy chọn, ở đây mình ưu tiên hiển thị giá thấp nhất để câu khách)
            const prices = variants.map(v => (v.salePrice > 0 ? v.salePrice : v.originalPrice));
            const minPrice = Math.min(...prices);
            const totalStock = variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
            return { price: minPrice, oldPrice: 0, stock: totalStock, isSale: false, isRange: true };
        } else {
            // Sản phẩm đơn (không biến thể)
            return {
                price: product.salePrice || product.originalPrice || 0,
                oldPrice: product.originalPrice || 0,
                stock: product.stockQuantity || 0,
                isSale: (product.salePrice > 0 && product.salePrice < product.originalPrice)
            };
        }
    };

    const info = getDisplayInfo();

    // --- XỬ LÝ MUA HÀNG (LOGIC MỚI) ---
    const handleAction = (isBuyNow) => {
        if (!product) return;

        // Kiểm tra biến thể
        const variants = product.tblProductVariants || [];
        if (variants.length > 0 && !selectedVariantId) {
            alert("Vui lòng chọn phân loại sản phẩm (Màu sắc/Kích thước)!");
            return;
        }

        // Kiểm tra tồn kho cụ thể
        if (info.stock <= 0) {
            alert("Sản phẩm/Phân loại này tạm hết hàng.");
            return;
        }

        // Dữ liệu để thêm vào giỏ
        const itemToAdd = {
            productId: product.productId,
            variantId: currentVariant ? currentVariant.variantId : null, // [cite: 137]
            productName: product.productName,
            variantName: currentVariant ? currentVariant.variantName : '',
            price: info.price,
            imageUrl: images.length > 0 ? images[0].imageUrl : '',
            quantity: quantity
        };

        addToCart(itemToAdd);

        if (isBuyNow) {
            navigate('/cart');
        } 
    };

    if (!product) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
             {/* Styles nội bộ */}
            <style>{`
                .html-content img { max-width: 100% !important; height: auto !important; display: block; margin: 10px auto; }
                .html-content table { width: 100% !important; }
                .html-content { font-family: inherit; line-height: 1.6; color: #333; }
                
                /* Style cho nút biến thể */
                .variant-btn {
                    padding: 8px 15px;
                    border: 1px solid #ddd;
                    background-color: #fff;
                    cursor: pointer;
                    border-radius: 2px;
                    font-size: 14px;
                    min-width: 80px;
                    position: relative;
                    transition: all 0.2s;
                    margin-right: 10px;
                    margin-bottom: 10px;
                }
                .variant-btn:hover {
                    border-color: #2e7d32;
                    color: #2e7d32;
                }
                .variant-btn.active {
                    border-color: #2e7d32;
                    color: #2e7d32;
                    background-color: #f1f8e9; /* Màu nền xanh nhạt */
                    font-weight: bold;
                }
                .variant-btn.disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background-color: #f5f5f5;
                    color: #aaa;
                    border-color: #eee;
                }
                /* Dấu tick góc nút (tùy chọn giống Shopee) */
                .tick-icon {
                    position: absolute;
                    bottom: 0;
                    right: 0;
                    width: 0; 
                    height: 0; 
                    border-left: 12px solid transparent;
                    border-bottom: 12px solid #2e7d32;
                }
            `}</style>

            <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
                
                {/* --- CỘT TRÁI: HÌNH ẢNH (GIỮ NGUYÊN) --- */}
                <div style={{ flex: '1', minWidth: '350px' }}>
                    <div style={{ width: '100%', height: '450px', backgroundColor: '#fff', border: '1px solid #eee', borderRadius: '8px', position: 'relative', display: 'flex', overflow: 'hidden' }}>
                        {images.length > 0 ? (
                            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-in' }}>
                                <div className="zoom-container" onClick={() => setIsLightboxOpen(true)} style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}
                                    onMouseMove={(e) => {
                                        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
                                        const x = ((e.pageX - left) / width) * 100;
                                        const y = ((e.pageY - top) / height) * 100;
                                        e.currentTarget.querySelector('img').style.transformOrigin = `${x}% ${y}%`;
                                        e.currentTarget.querySelector('img').style.transform = "scale(2)";
                                    }}
                                    onMouseLeave={(e) => {
                                        const zoomContainer = e.currentTarget; 
                                        zoomContainer.querySelector('img').style.transform = "scale(1)";
                                        setTimeout(() => { const img = e.currentTarget.querySelector('img'); if(img) img.style.transformOrigin = "center center"; }, 300);
                                    }}
                                >
                                    <img src={currentImgUrl} alt="Product" style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.1s ease-out' }} />
                                </div>
                            </div>
                        ) : (<span>Không có hình ảnh</span>)}
                        
                        {images.length > 1 && (
                            <>
                                <button onClick={(e) => { e.stopPropagation(); prevImage(); }} style={arrowButtonStyle(true)}><FaChevronLeft /></button>
                                <button onClick={(e) => { e.stopPropagation(); nextImage(); }} style={arrowButtonStyle(false)}><FaChevronRight /></button>
                            </>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
                        {images.map((img, index) => (
                            <img key={index} src={img.imageUrl?.startsWith('http') ? img.imageUrl : `${API_BASE}${img.imageUrl}`} 
                                 alt="sub" onClick={() => setCurrentIndex(index)}
                                 style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: currentIndex === index ? '2px solid #2e7d32' : '2px solid transparent' }} />
                        ))}
                    </div>
                </div>

                {/* --- CỘT PHẢI: THÔNG TIN (SỬA ĐỔI) --- */}
                <div style={{ flex: '1', minWidth: '350px' }}>
                    <h1 style={{ marginBottom: '10px', fontSize: '24px' }}>{product.productName}</h1>
                    <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <p style={{ color: '#666', fontSize: '14px' }}>Mã SP: <strong>{product.productCode}</strong></p>
                        <p style={{ color: '#666', fontSize: '14px' }}>Lượt bán: <strong>2k+</strong></p>
                    </div>

                    {/* HIỂN THỊ GIÁ */}
                    <div style={{ backgroundColor: '#fafafa', padding: '15px 20px', margin: '20px 0', borderRadius: '4px' }}>
                        <div style={{ fontSize: '30px', fontWeight: 'bold', color: '#d32f2f', display:'flex', alignItems:'center' }}>
                            {info.isSale ? (
                                <>
                                    <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '15px', fontSize: '16px', fontWeight: 'normal' }}>
                                        {info.oldPrice.toLocaleString()}đ
                                    </span>
                                    {info.price.toLocaleString()}đ
                                </>
                            ) : (
                                info.price > 0 ? (
                                    <>
                                        {info.price.toLocaleString()}đ
                                        {info.isRange && <span style={{fontSize: '14px', color: '#666', fontWeight:'normal', marginLeft: '5px'}}> (Giá thấp nhất)</span>}
                                    </>
                                ) : "Liên hệ"
                            )}
                        </div>
                    </div>

                    {/* MÔ TẢ NGẮN */}
                    <div style={{ marginBottom: '25px', fontSize: '14px', color: '#555' }}>
                         <div className="html-content" dangerouslySetInnerHTML={{ __html: cleanHtmlContent(product.shortDescription) }} />
                    </div>

                    {/* --- [QUAN TRỌNG] PHẦN CHỌN BIẾN THỂ (GIỐNG SHOPEE) --- */}
                    {product.tblProductVariants && product.tblProductVariants.length > 1 && (
                        <div style={{ marginBottom: '25px' }}>
                            <h4 style={{ fontSize: '14px', color: '#757575', marginBottom: '10px', textTransform:'uppercase' }}>Phân loại hàng</h4>
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                {product.tblProductVariants.map(v => {
                                    const isActive = selectedVariantId === v.variantId;
                                    const isOutOfStock = v.stockQuantity <= 0;
                                    return (
                                        <button 
                                            key={v.variantId}
                                            onClick={() => !isOutOfStock && setSelectedVariantId(v.variantId)}
                                            className={`variant-btn ${isActive ? 'active' : ''} ${isOutOfStock ? 'disabled' : ''}`}
                                            disabled={isOutOfStock}
                                        >
                                            {v.variantName}
                                            {/* Icon tick nhỏ ở góc giống Shopee */}
                                            {isActive && (
                                                <>
                                                    <div className="tick-icon"></div>
                                                    <FaCheck style={{position:'absolute', bottom:'0', right:'0', color:'white', fontSize:'8px', zIndex:1}} />
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- BỘ CHỌN SỐ LƯỢNG & TỒN KHO --- */}
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center' }}>
                        <strong style={{ marginRight: '20px', color: '#757575', fontSize: '14px', textTransform:'uppercase' }}>Số lượng</strong>
                        
                        <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #ccc', borderRadius: '2px', height: '32px' }}>
                            <button onClick={handleDecreaseQty} style={{ width: '32px', height: '100%', border: 'none', borderRight: '1px solid #ccc', background: '#fff', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: '#555' }}>
                                <FaMinus size={10} />
                            </button>
                            <input 
                                type="text" 
                                value={quantity} 
                                onChange={handleQtyChange}
                                style={{ width: '50px', height: '100%', border: 'none', textAlign: 'center', fontSize: '14px', color: '#333', outline: 'none' }}
                            />
                            <button onClick={handleIncreaseQty} style={{ width: '32px', height: '100%', border: 'none', borderLeft: '1px solid #ccc', background: '#fff', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: '#555' }}>
                                <FaPlus size={10} />
                            </button>
                        </div>
                        
                        <span style={{ marginLeft: '15px', color: '#757575', fontSize: '14px' }}>
                            {info.stock > 0 ? `${info.stock} sản phẩm có sẵn` : 'Hết hàng'}
                        </span>
                    </div>

                    {/* --- HAI NÚT MUA HÀNG --- */}
                    <div style={{ display: 'flex', gap: '15px', marginTop: '30px' }}>
                        <button 
                            onClick={() => handleAction(false)} 
                            disabled={info.stock <= 0}
                            style={{ 
                                flex: 1, padding: '15px', 
                                backgroundColor: 'rgba(46, 125, 50, 0.1)', 
                                color: '#2e7d32', 
                                border: '1px solid #2e7d32', 
                                borderRadius: '2px', fontWeight: 'bold', 
                                cursor: info.stock > 0 ? 'pointer' : 'not-allowed', 
                                fontSize: '16px', textTransform: 'uppercase',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                            }}
                        >
                            <FaPlus /> Thêm vào giỏ
                        </button>

                        <button 
                            onClick={() => handleAction(true)} 
                            disabled={info.stock <= 0}
                            style={{ 
                                flex: 1, padding: '15px', 
                                backgroundColor: '#2e7d32', 
                                color: 'white', border: 'none', borderRadius: '2px', fontWeight: 'bold', 
                                cursor: info.stock > 0 ? 'pointer' : 'not-allowed', 
                                fontSize: '16px', textTransform: 'uppercase'
                            }}
                        >
                            Mua ngay
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MÔ TẢ CHI TIẾT --- */}
            <div style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                <h3 style={{ borderBottom: '3px solid #2e7d32', display: 'inline-block', paddingBottom: '8px', fontSize: '20px', textTransform: 'uppercase', color: '#333' }}>MÔ TẢ SẢN PHẨM</h3>
                <div className="html-content" style={{ marginTop: '20px' }} dangerouslySetInnerHTML={{ __html: cleanHtmlContent(product.detailDescription) }} />
            </div>

            {/* --- SẢN PHẨM TƯƠNG TỰ --- */}
            <div style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                <h3 style={{ fontSize: '20px', textTransform: 'uppercase', color: '#333', marginBottom: '20px' }}>SẢN PHẨM TƯƠNG TỰ</h3>
                {relatedProducts.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {relatedProducts.map(p => (
                            <HomeProductCard key={p.productId} product={p} addToCart={addToCart} baseUrl={API_BASE} />
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#777', fontStyle: 'italic' }}>Không có sản phẩm tương tự.</p>
                )}
            </div>

            {/* --- LIGHTBOX MODAL --- */}
            {isLightboxOpen && (
                <div 
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.95)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', userSelect: 'none' }}
                    onClick={() => setIsLightboxOpen(false)} 
                >
                    <button style={{ position: 'absolute', top: '20px', right: '30px', background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '50%', width: '50px', height: '50px', color: '#fff', fontSize: '30px', cursor: 'pointer', zIndex: 10000 }} onClick={() => setIsLightboxOpen(false)}>&times;</button>
                    {images.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); prevImage(); }} style={{ position: 'absolute', left: '30px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255, 255, 255, 0.15)', border: 'none', borderRadius: '50%', width: '60px', height: '60px', color: '#fff', fontSize: '24px', cursor: 'pointer', zIndex: 10000 }}><FaChevronLeft /></button>
                    )}
                    <img src={currentImgUrl} alt="Fullsize" style={{ height: '85vh', maxWidth: '80vw', objectFit: 'contain', backgroundColor: '#fff' }} onClick={(e) => e.stopPropagation()} />
                    {images.length > 1 && (
                        <button onClick={(e) => { e.stopPropagation(); nextImage(); }} style={{ position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255, 255, 255, 0.15)', border: 'none', borderRadius: '50%', width: '60px', height: '60px', color: '#fff', fontSize: '24px', cursor: 'pointer', zIndex: 10000 }}><FaChevronRight /></button>
                    )}
                </div>
            )}
        </div>
    );
};

const arrowButtonStyle = (isLeft) => ({
    position: 'absolute', top: '50%', [isLeft ? 'left' : 'right']: '10px', transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255,255,255,0.8)', border: '1px solid #ddd', width: '40px', height: '40px',
    borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', color: '#333', zIndex: 10 
});

export default ProductDetail;