import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'; // Cài đặt: npm install react-icons
import { useContext } from 'react';
import { CartContext } from '../../context/CartContext';
const ProductDetail = () => {
    const { id } = useParams();
    const [product, setProduct] = useState(null);
    const [images, setImages] = useState([]); // Lưu danh sách ảnh đã sắp xếp
    const [currentIndex, setCurrentIndex] = useState(0); // Vị trí ảnh đang xem
    const { addToCart } = useContext(CartContext);
    const BASE_URL = 'https://localhost:7298';

    useEffect(() => {
        fetch(`${BASE_URL}/api/TblProducts/${id}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data);
                if (data.tblProductImages && data.tblProductImages.length > 0) {
                    // Sắp xếp: Ảnh nào có isThumbnail = true sẽ lên đầu mảng
                    const sorted = [...data.tblProductImages].sort((a, b) => 
                        (b.isThumbnail === true ? 1 : 0) - (a.isThumbnail === true ? 1 : 0)
                    );
                    setImages(sorted);
                }
            })
            .catch(err => console.error("Lỗi:", err));
    }, [id]);

    // Hàm chuyển ảnh
    const nextImage = () => {
        setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    };

    const prevImage = () => {
        setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    };

    if (!product) return <div style={{ padding: '50px', textAlign: 'center' }}>Đang tải...</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: '50px', flexWrap: 'wrap' }}>
                
                {/* --- KHỐI HÌNH ẢNH (SLIDESHOW) --- */}
                <div style={{ flex: '1', minWidth: '350px', position: 'relative' }}>
                    <div style={{ 
                        width: '100%', 
                        height: '450px', 
                        backgroundColor: '#f5f5f5',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        {/* Kiểm tra nếu có ảnh mới render thẻ img, tránh lỗi src="" */}
                        {images.length > 0 ? (
                            <img 
                                src={`${BASE_URL}${images[currentIndex].imageUrl}`} 
                                alt="product"
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                        ) : (
                            <span>Không có hình ảnh</span>
                        )}

                        {/* Nút điều hướng (Chỉ hiện nếu có nhiều hơn 1 ảnh) */}
                        {images.length > 1 && (
                            <>
                                <button onClick={prevImage} style={arrowButtonStyle(true)}>
                                    <FaChevronLeft />
                                </button>
                                <button onClick={nextImage} style={arrowButtonStyle(false)}>
                                    <FaChevronRight />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Danh sách ảnh nhỏ bên dưới (Thumbnails) */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '15px', overflowX: 'auto' }}>
                        {images.map((img, index) => (
                            <img 
                                key={index}
                                src={`${BASE_URL}${img.imageUrl}`}
                                alt="sub"
                                onClick={() => setCurrentIndex(index)}
                                style={{ 
                                    width: '70px', 
                                    height: '70px', 
                                    objectFit: 'cover', 
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    border: currentIndex === index ? '2px solid #2e7d32' : '2px solid transparent'
                                }}
                            />
                        ))}
                    </div>
                </div>

                {/* --- KHỐI THÔNG TIN SẢN PHẨM --- */}
                <div style={{ flex: '1', minWidth: '350px' }}>
                    <h1 style={{ marginBottom: '10px' }}>{product.productName}</h1>
                    <p style={{ color: '#666' }}>Mã sản phẩm: <strong>{product.productCode}</strong></p>
                    
                    <div style={{ margin: '20px 0', fontSize: '24px', fontWeight: 'bold', color: '#d32f2f' }}>
                        {product.salePrice && product.salePrice < product.originalPrice ? (
                            <>
                                <span style={{ textDecoration: 'line-through', color: '#999', marginRight: '15px', fontSize: '18px' }}>
                                    {product.originalPrice?.toLocaleString()}đ
                                </span>
                                {product.salePrice?.toLocaleString()}đ
                            </>
                        ) : (
                            `${product.originalPrice?.toLocaleString()}đ`
                        )}
                    </div>

                    <div style={{ backgroundColor: '#f9f9f9', padding: '15px', borderRadius: '4px', marginBottom: '20px' }}>
                        <p><strong>Mô tả ngắn:</strong> {product.shortDescription}</p>
                        <p><strong>Kích thước:</strong> {product.size || 'Theo mẫu'}</p>
                        <p><strong>Tình trạng:</strong> {product.stockQuantity > 0 ? `Còn hàng (${product.stockQuantity})` : 'Hết hàng'}</p>
                    </div>

                    <button style={{ 
                        width: '100%', 
                        padding: '15px', 
                        backgroundColor: '#2e7d32', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        fontWeight: 'bold', 
                        cursor: 'pointer',
                        fontSize: '16px'
                    }}onClick={() => addToCart(product)}>
                        THÊM VÀO GIỎ HÀNG
                    </button>
                </div>
            </div>

            {/* Chi tiết bên dưới */}
            <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '30px' }}>
                <h3 style={{ borderBottom: '2px solid #2e7d32', display: 'inline-block', paddingBottom: '5px' }}>
                    THÔNG TIN CHI TIẾT
                </h3>
                <div 
                    style={{ marginTop: '20px', lineHeight: '1.6' }}
                    dangerouslySetInnerHTML={{ __html: product.detailDescription }} 
                />
            </div>
        </div>
    );
};

// Style cho nút mũi tên
const arrowButtonStyle = (isLeft) => ({
    position: 'absolute',
    top: '50%',
    [isLeft ? 'left' : 'right']: '10px',
    transform: 'translateY(-50%)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    border: 'none',
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    color: '#333',
    transition: '0.3s'
});

export default ProductDetail;