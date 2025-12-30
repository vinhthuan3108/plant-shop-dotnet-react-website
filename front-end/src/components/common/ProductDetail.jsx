import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom'; 
import { FaChevronLeft, FaChevronRight, FaMinus, FaPlus } from 'react-icons/fa'; // Import icon cộng trừ
import { CartContext } from '../../context/CartContext';
import VariantSelectionModal from '../../components/client/VariantSelectionModal'; 
import HomeProductCard from '../../components/client/HomeProductCard'; // Import Card cho sản phẩm tương tự
import { GlassMagnifier } from "react-image-magnifiers"; 

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate(); 
    const { addToCart } = useContext(CartContext);

    // --- STATE DỮ LIỆU ---
    const [product, setProduct] = useState(null);
    const [images, setImages] = useState([]);
    const [relatedProducts, setRelatedProducts] = useState([]); // Sản phẩm tương tự
    const [currentIndex, setCurrentIndex] = useState(0);
    
    // --- STATE GIAO DIỆN ---
    const [quantity, setQuantity] = useState(1); // Số lượng mua
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    
    const BASE_URL = 'https://localhost:7298';

    // --- FETCH DỮ LIỆU ---
    useEffect(() => {
        // Reset trạng thái khi đổi sản phẩm
        setProduct(null);
        setImages([]);
        setRelatedProducts([]);
        setQuantity(1);
        setCurrentIndex(0);
        window.scrollTo(0, 0);

        // 1. Lấy chi tiết sản phẩm
        fetch(`${BASE_URL}/api/TblProducts/${id}`)
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

                // 2. Gọi API lấy sản phẩm tương tự
                return fetch(`${BASE_URL}/api/TblProducts/related/${id}`);
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
        ? (images[currentIndex].imageUrl?.startsWith('http') ? images[currentIndex].imageUrl : `${BASE_URL}${images[currentIndex].imageUrl}`) 
        : '';

    // --- HÀM XỬ LÝ HTML ---
    const cleanHtmlContent = (htmlString) => {
        if (!htmlString) return '';
        return htmlString.replace(/&nbsp;/g, ' ');
    };

    const contentStyles = `
        .html-content img { max-width: 100% !important; height: auto !important; display: block; margin: 10px auto; }
        .html-content table { width: 100% !important; }
        .html-content { font-family: inherit; line-height: 1.6; color: #333; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes zoomIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    `;

    // --- TÍNH TOÁN GIÁ & TỒN KHO ---
    const getDisplayInfo = () => {
        if (!product) return { price: 0, oldPrice: 0, stock: 0, isSale: false };
        const variants = product.tblProductVariants || [];
        if (variants.length > 0) {
            const prices = variants.map(v => v.salePrice || v.originalPrice);
            const minPrice = Math.min(...prices);
            const totalStock = variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
            return { price: minPrice, oldPrice: 0, stock: totalStock, isSale: false };
        } else {
            return {
                price: product.salePrice || product.originalPrice || 0,
                oldPrice: product.originalPrice || 0,
                stock: product.stockQuantity || 0,
                isSale: (product.salePrice > 0 && product.salePrice < product.originalPrice)
            };
        }
    };

    // --- XỬ LÝ MUA HÀNG ---
    const handleAction = (isBuyNow) => {
        if (!product) return;
        const info = getDisplayInfo();
        
        if (info.stock <= 0) {
            alert("Sản phẩm này tạm hết hàng.");
            return;
        }

        const variants = product.tblProductVariants || [];

        // TH1: Sản phẩm đơn (hoặc chỉ 1 biến thể) -> Xử lý luôn
        if (variants.length <= 1) {
            const variant = variants[0];
            addToCart({
                productId: product.productId,
                variantId: variant?.variantId,
                productName: product.productName,
                variantName: variant?.variantName,
                price: variant ? (variant.salePrice || variant.originalPrice) : info.price,
                imageUrl: images.length > 0 ? images[0].imageUrl : '',
                quantity: quantity // Dùng số lượng từ state
            });

            if (isBuyNow) {
                navigate('/cart'); 
            } else {
                // Đã bỏ alert ở đây để tránh trùng lặp nếu CartContext có alert
            }
        } 
        // TH2: Nhiều biến thể -> Mở Modal
        else {
            setIsModalOpen(true);
        }
    };

    const handleModalConfirm = (variantId, qty, variantData) => {
        addToCart({
            productId: product.productId,
            variantId: variantId,
            productName: product.productName,
            variantName: variantData.variantName,
            price: variantData.salePrice || variantData.originalPrice,
            imageUrl: images.length > 0 ? images[0].imageUrl : '',
            quantity: qty
        });
        alert("Đã thêm vào giỏ hàng!");
    };

    if (!product) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải...</div>;
    const info = getDisplayInfo();

    return (
        <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
            <style>{contentStyles}</style>

            <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
                
                {/* --- CỘT TRÁI: HÌNH ẢNH --- */}
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
                                        e.currentTarget.querySelector('img').style.transform = "scale(1)";
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
                            <img key={index} src={img.imageUrl?.startsWith('http') ? img.imageUrl : `${BASE_URL}${img.imageUrl}`} 
                                 alt="sub" onClick={() => setCurrentIndex(index)}
                                 style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: currentIndex === index ? '2px solid #2e7d32' : '2px solid transparent' }} />
                        ))}
                    </div>
                </div>

                {/* --- CỘT PHẢI: THÔNG TIN --- */}
                <div style={{ flex: '1', minWidth: '350px' }}>
                    <h1 style={{ marginBottom: '10px', fontSize: '26px' }}>{product.productName}</h1>
                    <p style={{ color: '#666' }}>Mã SP: <strong>{product.productCode}</strong></p>
                    
                    <div style={{ margin: '20px 0', fontSize: '28px', fontWeight: 'bold', color: '#d32f2f' }}>
                        {info.isSale ? (
                            <>
                                <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '15px', fontSize: '18px' }}>
                                    {info.oldPrice.toLocaleString()}đ
                                </span>
                                {info.price.toLocaleString()}đ
                            </>
                        ) : (
                            info.price > 0 ? `${info.price.toLocaleString()}đ` : "Liên hệ"
                        )}
                    </div>

                    <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '25px' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <strong style={{ display: 'block', marginBottom: '5px' }}>Mô tả ngắn:</strong>
                            <div className="html-content" dangerouslySetInnerHTML={{ __html: cleanHtmlContent(product.shortDescription) }} style={{ color: '#555', fontSize: '14px' }} />
                        </div>
                        
                        <p><strong>Tình trạng: </strong> {info.stock > 0 ? <span style={{color:'#2e7d32', fontWeight:'bold'}}>Còn hàng</span> : <span style={{color:'red', fontWeight:'bold'}}>Hết hàng</span>}</p>

                        {/* --- BỘ CHỌN SỐ LƯỢNG (MÀU XANH) --- */}
                        <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center' }}>
                            <strong style={{ marginRight: '15px' }}>Số lượng:</strong>
                            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #2e7d32', borderRadius: '4px', backgroundColor: '#fff', height: '40px' }}>
                                <button onClick={handleDecreaseQty} style={{ width: '40px', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: '#2e7d32' }}>
                                    <FaMinus size={12} />
                                </button>
                                <input 
                                    type="text" 
                                    value={quantity} 
                                    onChange={handleQtyChange}
                                    style={{ width: '50px', height: '100%', border: 'none', borderLeft: '1px solid #2e7d32', borderRight: '1px solid #2e7d32', textAlign: 'center', fontSize: '16px', fontWeight: 'bold', color: '#333' }}
                                />
                                <button onClick={handleIncreaseQty} style={{ width: '40px', height: '100%', border: 'none', background: 'transparent', cursor: 'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: '#2e7d32' }}>
                                    <FaPlus size={12} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* --- HAI NÚT MUA HÀNG (MÀU XANH) --- */}
                    <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
                        {/* Nút Thêm vào giỏ: Nền trắng, Chữ xanh, Viền xanh */}
                        <button 
                            onClick={() => handleAction(false)} 
                            disabled={info.stock <= 0}
                            style={{ 
                                flex: 1, padding: '15px', 
                                backgroundColor: '#fff', 
                                color: info.stock > 0 ? '#2e7d32' : '#ccc', 
                                border: info.stock > 0 ? '2px solid #2e7d32' : '2px solid #ccc', 
                                borderRadius: '4px', fontWeight: 'bold', 
                                cursor: info.stock > 0 ? 'pointer' : 'not-allowed', 
                                fontSize: '16px', textTransform: 'uppercase',
                                transition: '0.3s'
                            }}
                            onMouseOver={(e) => { if(info.stock>0) e.target.style.backgroundColor = '#e8f5e9' }}
                            onMouseOut={(e) => { if(info.stock>0) e.target.style.backgroundColor = '#fff' }}
                        >
                            Thêm vào giỏ
                        </button>

                        {/* Nút Mua Ngay: Nền xanh, Chữ trắng */}
                        <button 
                            onClick={() => handleAction(true)} 
                            disabled={info.stock <= 0}
                            style={{ 
                                flex: 1, padding: '15px', 
                                backgroundColor: info.stock > 0 ? '#2e7d32' : '#ccc', 
                                color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', 
                                cursor: info.stock > 0 ? 'pointer' : 'not-allowed', 
                                fontSize: '16px', textTransform: 'uppercase',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                            onMouseOver={(e) => { if(info.stock>0) e.target.style.backgroundColor = '#1b5e20' }}
                            onMouseOut={(e) => { if(info.stock>0) e.target.style.backgroundColor = '#2e7d32' }}
                        >
                            Mua ngay
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MÔ TẢ CHI TIẾT --- */}
            <div style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                <h3 style={{ borderBottom: '3px solid #2e7d32', display: 'inline-block', paddingBottom: '8px', fontSize: '20px', textTransform: 'uppercase', color: '#333' }}>THÔNG TIN CHI TIẾT</h3>
                <div className="html-content" style={{ marginTop: '20px' }} dangerouslySetInnerHTML={{ __html: cleanHtmlContent(product.detailDescription) }} />
            </div>

            {/* --- SẢN PHẨM TƯƠNG TỰ --- */}
            <div style={{ marginTop: '60px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                <h3 style={{ borderBottom: '3px solid #2e7d32', display: 'inline-block', paddingBottom: '8px', fontSize: '20px', textTransform: 'uppercase', color: '#333', marginBottom: '20px' }}>SẢN PHẨM TƯƠNG TỰ</h3>
                
                {relatedProducts.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                        {relatedProducts.map(p => (
                            <HomeProductCard 
                                key={p.productId} 
                                product={p} 
                                addToCart={addToCart} 
                                baseUrl={BASE_URL} 
                            />
                        ))}
                    </div>
                ) : (
                    <p style={{ color: '#777', fontStyle: 'italic' }}>Không có sản phẩm tương tự.</p>
                )}
            </div>

            {/* --- 4. LIGHTBOX MODAL (NÂNG CẤP: CÓ NÚT CHUYỂN ẢNH & SỐ TRANG) --- */}
            {isLightboxOpen && (
                <div 
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.95)', // Nền đen đậm hơn chút
                        zIndex: 9999, 
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        animation: 'fadeIn 0.3s forwards',
                        userSelect: 'none' // Chống bôi đen khi click liên tục
                    }}
                    onClick={() => setIsLightboxOpen(false)} 
                >
                    {/* 1. Nút Đóng (Góc trên phải) */}
                    <button 
                        style={{
                            position: 'absolute', top: '20px', right: '30px', 
                            background: 'rgba(255, 255, 255, 0.1)', border: 'none', borderRadius: '50%',
                            width: '50px', height: '50px',
                            color: '#fff', fontSize: '30px', cursor: 'pointer', zIndex: 10000,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: '0.3s'
                        }}
                        onClick={() => setIsLightboxOpen(false)}
                        onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.3)'}
                        onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.1)'}
                    >
                        &times;
                    </button>

                    {/* 2. Nút Quay lại (Mũi tên Trái) - Chỉ hiện khi có nhiều hơn 1 ảnh */}
                    {images.length > 1 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); prevImage(); }}
                            style={{
                                position: 'absolute', left: '30px', top: '50%', transform: 'translateY(-50%)',
                                background: 'rgba(255, 255, 255, 0.15)', border: 'none', borderRadius: '50%',
                                width: '60px', height: '60px',
                                color: '#fff', fontSize: '24px', cursor: 'pointer', zIndex: 10000,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: '0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.4)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                        >
                            <FaChevronLeft />
                        </button>
                    )}
                    
                    {/* 3. Ảnh Lớn */}
                    <img 
                        src={currentImgUrl} 
                        alt="Fullsize"
                        style={{ 
                            height: '85vh', maxWidth: '80vw', width: 'auto', 
                            objectFit: 'contain', borderRadius:'4px',
                            boxShadow: '0 0 30px rgba(0,0,0,0.5)',
                            animation: 'zoomIn 0.3s forwards',
                            backgroundColor: '#fff' 
                        }} 
                        onClick={(e) => e.stopPropagation()} 
                    />

                    {/* 4. Nút Tiếp theo (Mũi tên Phải) - Chỉ hiện khi có nhiều hơn 1 ảnh */}
                    {images.length > 1 && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); nextImage(); }}
                            style={{
                                position: 'absolute', right: '30px', top: '50%', transform: 'translateY(-50%)',
                                background: 'rgba(255, 255, 255, 0.15)', border: 'none', borderRadius: '50%',
                                width: '60px', height: '60px',
                                color: '#fff', fontSize: '24px', cursor: 'pointer', zIndex: 10000,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: '0.3s'
                            }}
                            onMouseOver={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.4)'}
                            onMouseOut={(e) => e.target.style.background = 'rgba(255, 255, 255, 0.15)'}
                        >
                            <FaChevronRight />
                        </button>
                    )}

                    {/* 5. Số trang (Ví dụ: 1 / 5) */}
                    <div style={{
                        position: 'absolute', bottom: '30px', left: '50%', transform: 'translateX(-50%)',
                        color: '#fff', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px',
                        background: 'rgba(0,0,0,0.6)', padding: '8px 20px', borderRadius: '30px'
                    }}>
                        {currentIndex + 1} / {images.length}
                    </div>
                </div>
            )}
        </div>
    );
};

const arrowButtonStyle = (isLeft) => ({
    position: 'absolute', top: '50%', [isLeft ? 'left' : 'right']: '10px', transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255,255,255,0.8)', border: '1px solid #ddd', width: '40px', height: '40px',
    borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', color: '#333', transition: '0.3s', zIndex: 10 
});

export default ProductDetail;