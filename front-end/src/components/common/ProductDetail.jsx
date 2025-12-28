import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { CartContext } from '../../context/CartContext';
import VariantSelectionModal from '../../components/client/VariantSelectionModal'; 

const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [images, setImages] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const { addToCart } = useContext(CartContext);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const BASE_URL = 'https://localhost:7298';

    // --- HÀM XỬ LÝ LỖI &nbsp; CỦA REACT QUILL ---
    // Hàm này tìm tất cả các ký tự &nbsp; và thay bằng dấu cách thường
    const cleanHtmlContent = (htmlString) => {
        if (!htmlString) return '';
        return htmlString.replace(/&nbsp;/g, ' ');
    };

    // --- CSS NỘI BỘ ---
    const contentStyles = `
        .html-content img {
            max-width: 100% !important;
            height: auto !important;
            display: block;
            margin: 10px auto;
        }
        .html-content table {
            width: 100% !important;
            max-width: 100%;
        }
        .html-content {
            font-family: inherit; /* Giữ font chữ của web */
        }
        /* Chỉ định rõ cho các thẻ p, li bên trong */
        .html-content p, .html-content li, .html-content div {
            word-break: normal !important;
            overflow-wrap: anywhere !important;
            white-space: normal !important;
            line-height: 1.6;
            margin-bottom: 10px;
        }
    `;

    useEffect(() => {
        fetch(`${BASE_URL}/api/TblProducts/${id}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data);
                if (data.tblProductImages && data.tblProductImages.length > 0) {
                    const sorted = [...data.tblProductImages].sort((a, b) => 
                        (b.isThumbnail === true ? 1 : 0) - (a.isThumbnail === true ? 1 : 0)
                    );
                    setImages(sorted);
                } else if (data.thumbnail) {
                    setImages([{ imageUrl: data.thumbnail }]);
                }
            })
            .catch(err => console.error("Lỗi:", err));
    }, [id]);

    const nextImage = () => setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    const prevImage = () => setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));

    const getDisplayInfo = () => {
        if (!product) return { price: 0, oldPrice: 0, stock: 0, isSale: false };

        const variants = product.tblProductVariants || [];
        
        if (variants.length > 0) {
            const prices = variants.map(v => v.salePrice || v.originalPrice);
            const minPrice = Math.min(...prices);
            const totalStock = variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0);
            
            return {
                price: minPrice,
                oldPrice: 0,
                stock: totalStock,
                isSale: false
            };
        } else {
            return {
                price: product.salePrice || product.originalPrice || 0,
                oldPrice: product.originalPrice || 0,
                stock: product.stockQuantity || 0,
                isSale: (product.salePrice > 0 && product.salePrice < product.originalPrice)
            };
        }
    };

    const handleAddToCartClick = () => {
        if (!product) return;
        const variants = product.tblProductVariants || [];

        if (variants.length === 1) {
            const variant = variants[0];
            if ((variant.stockQuantity || 0) <= 0) {
                alert("Sản phẩm này tạm hết hàng.");
                return;
            }
            addToCart({
                variantId: variant.variantId, 
                productName: product.productName,
                variantName: variant.variantName,
                price: variant.salePrice || variant.originalPrice,
                imageUrl: images.length > 0 ? images[0].imageUrl : '',
                quantity: 1
            });
        } else if (variants.length > 1) {
            setIsModalOpen(true);
        } else {
            if ((product.stockQuantity || 0) <= 0) {
                 alert("Sản phẩm này tạm hết hàng.");
                 return;
            }
             alert("Lỗi dữ liệu: Sản phẩm chưa có phân loại hàng.");
        }
    };

    const handleModalConfirm = (variantId, qty, variantData) => {
        addToCart({
            variantId: variantId,
            productName: product.productName,
            variantName: variantData.variantName,
            price: variantData.salePrice || variantData.originalPrice,
            imageUrl: images.length > 0 ? images[0].imageUrl : '',
            quantity: qty
        });
    };

    if (!product) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải...</div>;

    const info = getDisplayInfo();

    return (
        <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
            <style>{contentStyles}</style>

            <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
                
                {/* --- KHỐI HÌNH ẢNH --- */}
                <div style={{ flex: '1', minWidth: '350px' }}>
                    <div style={{ width: '100%', height: '450px', backgroundColor: '#f5f5f5', borderRadius: '8px', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {images.length > 0 ? (
                            <img src={images[currentIndex].imageUrl?.startsWith('http') ? images[currentIndex].imageUrl : `${BASE_URL}${images[currentIndex].imageUrl}`} 
                                 alt="product" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        ) : (<span>Không có hình ảnh</span>)}
                        
                        {images.length > 1 && (
                            <>
                                <button onClick={prevImage} style={arrowButtonStyle(true)}><FaChevronLeft /></button>
                                <button onClick={nextImage} style={arrowButtonStyle(false)}><FaChevronRight /></button>
                            </>
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto' }}>
                        {images.map((img, index) => (
                            <img key={index} src={img.imageUrl?.startsWith('http') ? img.imageUrl : `${BASE_URL}${img.imageUrl}`} 
                                 alt="sub" onClick={() => setCurrentIndex(index)}
                                 style={{ width: '70px', height: '70px', objectFit: 'cover', borderRadius: '4px', cursor: 'pointer', border: currentIndex === index ? '2px solid #2e7d32' : '2px solid transparent' }} />
                        ))}
                    </div>
                </div>

                {/* --- KHỐI THÔNG TIN --- */}
                <div style={{ flex: '1', minWidth: '350px' }}>
                    <h1 style={{ marginBottom: '10px' }}>{product.productName}</h1>
                    <p style={{ color: '#666' }}>Mã sản phẩm: <strong>{product.productCode}</strong></p>
                    
                    <div style={{ margin: '20px 0', fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
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

                    <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                        <div style={{ marginBottom: '15px' }}>
                            <strong style={{ display: 'block', marginBottom: '5px' }}>Mô tả ngắn:</strong>
                            
                            {/* DÙNG HÀM CLEAN Ở ĐÂY */}
                            <div className="html-content"
                                 dangerouslySetInnerHTML={{ __html: cleanHtmlContent(product.shortDescription) }} 
                                 style={{ color: '#333' }}
                            />
                        </div>
                        
                        <p><strong>Kích thước:</strong> {product.size || 'Tiêu chuẩn'}</p>
                        
                        <p>
                            <strong>Tình trạng: </strong> 
                            {info.stock > 0 ? 
                                <span style={{color:'green'}}>Còn hàng ({info.stock})</span> : 
                                <span style={{color:'red'}}>Hết hàng</span>
                            }
                        </p>
                    </div>

                    <button 
                        onClick={handleAddToCartClick}
                        disabled={info.stock <= 0}
                        style={{ 
                            width: '100%', padding: '15px', 
                            backgroundColor: info.stock > 0 ? '#2e7d32' : '#ccc', 
                            color: 'white', border: 'none', borderRadius: '4px', fontWeight: 'bold', 
                            cursor: info.stock > 0 ? 'pointer' : 'not-allowed', 
                            fontSize: '16px' 
                        }}
                    >
                        {info.stock > 0 ? "THÊM VÀO GIỎ HÀNG" : "HẾT HÀNG"}
                    </button>
                </div>
            </div>

            <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                <h3 style={{ borderBottom: '2px solid #2e7d32', display: 'inline-block', paddingBottom: '5px' }}>THÔNG TIN CHI TIẾT</h3>
                
                {/* DÙNG HÀM CLEAN Ở ĐÂY NỮA */}
                <div 
                    className="html-content"
                    style={{ marginTop: '20px' }}
                    dangerouslySetInnerHTML={{ __html: cleanHtmlContent(product.detailDescription) }} 
                />
            </div>

            <VariantSelectionModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                product={product}
                onConfirm={handleModalConfirm}
            />
        </div>
    );
};

const arrowButtonStyle = (isLeft) => ({
    position: 'absolute', top: '50%', [isLeft ? 'left' : 'right']: '10px', transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255,255,255,0.7)', border: 'none', width: '40px', height: '40px',
    borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '20px', color: '#333', transition: '0.3s'
});

export default ProductDetail;