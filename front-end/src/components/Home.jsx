import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCat, setSelectedCat] = useState(null);

    const API_URL = 'https://localhost:7298'; // Base URL để nối chuỗi ảnh

    useEffect(() => {
        // 1. Lấy sản phẩm
        fetch(`${API_URL}/api/TblProducts`)
            .then(res => res.json())
            .then(data => {
                // Chỉ lấy sản phẩm đang hoạt động (IsActive == true)
                const activeProducts = data.filter(p => p.isActive);
                setProducts(activeProducts);
            });

        // 2. Lấy danh mục để làm bộ lọc
        fetch(`${API_URL}/api/TblCategories`)
            .then(res => res.json())
            .then(data => setCategories(data));
    }, []);

    // Lọc sản phẩm theo danh mục
    const filteredProducts = selectedCat 
        ? products.filter(p => p.categoryId === selectedCat) 
        : products;

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
            
            {/* Banner Quảng cáo (Ví dụ) */}
            <div style={{ height: '300px', background: '#e9ecef', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '30px', borderRadius: '8px' }}>
                <h1>Chào mừng đến với Plant Shop 🌿</h1>
            </div>

            <div style={{ display: 'flex', gap: '30px' }}>
                
                {/* CỘT TRÁI: DANH MỤC */}
                <div style={{ width: '250px', flexShrink: 0 }}>
                    <h3 style={{ borderBottom: '2px solid #28a745', paddingBottom: '10px' }}>Danh Mục</h3>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li 
                            onClick={() => setSelectedCat(null)}
                            style={{ padding: '10px', cursor: 'pointer', background: selectedCat === null ? '#d4edda' : 'white', borderBottom:'1px solid #eee' }}
                        >
                            Tất cả sản phẩm
                        </li>
                        {categories.map(cat => (
                            <li 
                                key={cat.categoryId}
                                onClick={() => setSelectedCat(cat.categoryId)}
                                style={{ padding: '10px', cursor: 'pointer', background: selectedCat === cat.categoryId ? '#d4edda' : 'white', borderBottom:'1px solid #eee' }}
                            >
                                {cat.categoryName}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* CỘT PHẢI: LƯỚI SẢN PHẨM */}
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '20px' }}>
                        {filteredProducts.map(item => {
                            // Logic tìm ảnh đại diện: Lấy cái isThumbnail=true, nếu ko có thì lấy cái đầu tiên
                            const thumbnail = item.tblProductImages?.find(img => img.isThumbnail) || item.tblProductImages?.[0];
                            const imageUrl = thumbnail ? `${API_URL}${thumbnail.imageUrl}` : 'https://via.placeholder.com/300';

                            return (
                                <div key={item.productId} style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', transition: 'transform 0.2s' }}>
                                    {/* Ảnh sản phẩm */}
                                    <Link to={`/product/${item.productId}`}>
                                        <div style={{ height: '200px', overflow: 'hidden' }}>
                                            <img src={imageUrl} alt={item.productName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                    </Link>

                                    {/* Thông tin */}
                                    <div style={{ padding: '15px' }}>
                                        <h4 style={{ margin: '0 0 10px', fontSize: '16px', height: '40px', overflow: 'hidden' }}>
                                            <Link to={`/product/${item.productId}`} style={{ textDecoration: 'none', color: '#333' }}>
                                                {item.productName}
                                            </Link>
                                        </h4>
                                        
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <span style={{ color: '#d0021b', fontWeight: 'bold', fontSize: '18px' }}>
                                                {(item.salePrice || item.originalPrice).toLocaleString('vi-VN')}đ
                                            </span>
                                            {item.salePrice && (
                                                <span style={{ textDecoration: 'line-through', color: '#999', fontSize: '14px' }}>
                                                    {item.originalPrice.toLocaleString('vi-VN')}đ
                                                </span>
                                            )}
                                        </div>

                                        <button style={{ width: '100%', marginTop: '10px', padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                            Thêm vào giỏ
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Home;