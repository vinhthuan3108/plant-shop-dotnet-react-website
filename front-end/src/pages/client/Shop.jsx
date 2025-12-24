import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaFilter } from 'react-icons/fa';

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Lấy tham số ?category=... trên URL
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const categoryId = queryParams.get('category'); // Lấy ID danh mục từ URL

    const API_BASE = 'https://localhost:7298'; // Đổi port nếu cần

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 1. Lấy danh mục cho Sidebar
                const cateRes = await axios.get(`${API_BASE}/api/TblCategories`);
                const activeCates = cateRes.data
                    .filter(c => c.isActive && !c.isDeleted)
                    .sort((a, b) => a.displayOrder - b.displayOrder);
                setCategories(activeCates);

                // 2. Lấy sản phẩm (có lọc theo categoryId nếu có)
                let productUrl = `${API_BASE}/api/TblProducts/shop`;
                if (categoryId) {
                    productUrl += `?categoryId=${categoryId}`;
                }
                
                const prodRes = await axios.get(productUrl);
                setProducts(prodRes.data);

            } catch (error) {
                console.error("Lỗi tải dữ liệu shop:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [categoryId]); // Chạy lại khi categoryId thay đổi

    // Hàm format tiền tệ
    const formatPrice = (price) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
    };

    return (
        <div className="container py-5">
            <div className="row">
                {/* --- SIDEBAR DANH MỤC (BÊN TRÁI) --- */}
                <div className="col-md-3 mb-4">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0"><FaFilter className="me-2" /> Danh Mục</h5>
                        </div>
                        <div className="list-group list-group-flush">
                            <Link 
                                to="/shop" 
                                className={`list-group-item list-group-item-action ${!categoryId ? 'active fw-bold' : ''}`}
                            >
                                Tất cả sản phẩm
                            </Link>
                            {categories.map(cat => (
                                <Link 
                                    key={cat.categoryId}
                                    to={`/shop?category=${cat.categoryId}`}
                                    className={`list-group-item list-group-item-action ${parseInt(categoryId) === cat.categoryId ? 'active fw-bold' : ''}`}
                                >
                                    {cat.categoryName}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                {/* --- DANH SÁCH SẢN PHẨM (BÊN PHẢI) --- */}
                <div className="col-md-9">
                    <h3 className="mb-4 border-bottom pb-2">
                        {categoryId 
                            ? categories.find(c => c.categoryId === parseInt(categoryId))?.categoryName || "Sản phẩm"
                            : "Tất cả sản phẩm"
                        }
                    </h3>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-success" role="status"></div>
                            <p>Đang tải sản phẩm...</p>
                        </div>
                    ) : (
                        <div className="row g-4">
                            {products.length > 0 ? (
                                products.map(p => (
                                    <div className="col-6 col-md-4" key={p.productId}>
                                        <div className="card h-100 shadow-sm border-0 product-card">
                                            {/* Ảnh sản phẩm */}
                                            <div style={{ height: '250px', overflow: 'hidden', position: 'relative' }}>
                                                <img 
                                                    src={p.thumbnail ? `${API_BASE}${p.thumbnail}` : 'https://via.placeholder.com/300'} 
                                                    className="card-img-top w-100 h-100" 
                                                    style={{ objectFit: 'cover', transition: '0.3s' }}
                                                    alt={p.productName} 
                                                />
                                                {p.salePrice && (
                                                    <span className="badge bg-danger position-absolute top-0 end-0 m-2">Giảm giá</span>
                                                )}
                                            </div>
                                            
                                            {/* Thông tin */}
                                            <div className="card-body d-flex flex-column text-center">
                                                <h6 className="card-title text-success text-truncate">
                                                    <Link to={`/product/${p.productId}`} className="text-decoration-none text-success">
                                                        {p.productName}
                                                    </Link>
                                                </h6>
                                                
                                                <div className="mt-auto">
                                                    {p.salePrice ? (
                                                        <>
                                                            <span className="text-decoration-line-through text-muted small me-2">
                                                                {formatPrice(p.originalPrice)}
                                                            </span>
                                                            <span className="fw-bold text-danger">
                                                                {formatPrice(p.salePrice)}
                                                            </span>
                                                        </>
                                                    ) : (
                                                        <span className="fw-bold text-dark">
                                                            {formatPrice(p.originalPrice)}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <button className="btn btn-outline-success btn-sm mt-3 rounded-pill">
                                                    Xem chi tiết
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-12 text-center text-muted py-5">
                                    <p>Không tìm thấy sản phẩm nào trong danh mục này.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Shop;