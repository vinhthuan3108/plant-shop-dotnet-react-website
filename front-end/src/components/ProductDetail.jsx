import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

function ProductDetail() {
    const { id } = useParams(); // Lấy ID từ URL
    const [product, setProduct] = useState(null);
    const [mainImage, setMainImage] = useState('');

    const API_URL = 'https://localhost:7298';

    useEffect(() => {
        fetch(`${API_URL}/api/TblProducts/${id}`)
            .then(res => res.json())
            .then(data => {
                setProduct(data);
                // Set ảnh mặc định là ảnh thumbnail hoặc ảnh đầu tiên
                const thumb = data.tblProductImages?.find(img => img.isThumbnail) || data.tblProductImages?.[0];
                if(thumb) setMainImage(thumb.imageUrl);
            })
            .catch(err => console.error(err));
    }, [id]);

    if (!product) return <div style={{padding:20}}>Đang tải...</div>;

    return (
        <div style={{ maxWidth: '1100px', margin: '30px auto', padding: '20px', background: 'white', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', gap: '40px' }}>
                
                {/* Bên trái: Gallery ảnh */}
                <div style={{ width: '40%', flexShrink: 0 }}>
                    <div style={{ border: '1px solid #eee', marginBottom: '10px' }}>
                        <img src={mainImage ? `${API_URL}${mainImage}` : 'https://via.placeholder.com/400'} alt="Main" style={{ width: '100%', display: 'block' }} />
                    </div>
                    {/* List ảnh nhỏ */}
                    <div style={{ display: 'flex', gap: '10px', overflowX: 'auto' }}>
                        {product.tblProductImages?.map((img, idx) => (
                            <img 
                                key={idx} 
                                src={`${API_URL}${img.imageUrl}`} 
                                onClick={() => setMainImage(img.imageUrl)}
                                style={{ width: '70px', height: '70px', objectFit: 'cover', cursor: 'pointer', border: mainImage === img.imageUrl ? '2px solid green' : '1px solid #ddd' }}
                            />
                        ))}
                    </div>
                </div>

                {/* Bên phải: Thông tin */}
                <div style={{ flex: 1 }}>
                    <h1 style={{ marginTop: 0 }}>{product.productName}</h1>
                    <p>Mã SP: <strong>{product.productCode}</strong></p>
                    
                    <div style={{ fontSize: '24px', color: '#d0021b', fontWeight: 'bold', margin: '20px 0' }}>
                        {(product.salePrice || product.originalPrice).toLocaleString('vi-VN')}đ
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <button style={{ padding: '12px 30px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '16px', cursor: 'pointer' }}>
                            THÊM VÀO GIỎ HÀNG
                        </button>
                    </div>

                    <div style={{ borderTop: '1px solid #eee', paddingTop: '20px' }}>
                        <h4>Mô tả sản phẩm:</h4>
                        {/* Hiển thị HTML mô tả */}
                        <div dangerouslySetInnerHTML={{ __html: product.detailDescription || product.shortDescription }} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProductDetail;