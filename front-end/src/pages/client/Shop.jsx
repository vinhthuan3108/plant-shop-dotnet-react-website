import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaFilter, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

// Import Component Card và Context
import HomeProductCard from '../../components/client/HomeProductCard'; 
import { CartContext } from '../../context/CartContext';

// Import CSS của HomePage để ăn theo style (card, button,...)
import './HomePage.css'; 

const Shop = () => {
    // Khởi tạo products là mảng rỗng [] ngay từ đầu để tránh lỗi undefined
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // Lấy hàm thêm giỏ hàng từ Context
    const { addToCart } = useContext(CartContext);

    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const categoryId = queryParams.get('category'); 

    const API_BASE = 'https://localhost:7298';

    // 1. Khi đổi danh mục -> Reset về trang 1
    useEffect(() => {
        setCurrentPage(1);
    }, [categoryId]);

    // 2. Gọi API lấy dữ liệu
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Lấy danh mục
                const cateRes = await axios.get(`${API_BASE}/api/TblCategories`);
                const activeCates = cateRes.data
                    .filter(c => c.isActive && !c.isDeleted)
                    .sort((a, b) => a.displayOrder - b.displayOrder);
                setCategories(activeCates);

                // Lấy sản phẩm (Có phân trang)
                let productUrl = `${API_BASE}/api/TblProducts/shop?page=${currentPage}&pageSize=12`;
                if (categoryId) {
                    productUrl += `&categoryId=${categoryId}`;
                }
                
                const prodRes = await axios.get(productUrl);
                const responseData = prodRes.data;

                // --- SỬA LỖI Ở ĐÂY: Kiểm tra kỹ mọi trường hợp dữ liệu trả về ---
                if (responseData && responseData.data) {
                    // TH1: Backend trả về object chuẩn { data: [...], totalPages: ... }
                    setProducts(responseData.data);
                    setTotalPages(responseData.totalPages || 0);
                } else if (responseData && responseData.Data) {
                    // TH2: Backend trả về chữ hoa { Data: [...], TotalPages: ... }
                    setProducts(responseData.Data);
                    setTotalPages(responseData.TotalPages || 0);
                } else if (Array.isArray(responseData)) {
                    // TH3: Backend trả về mảng trực tiếp [...] (không phân trang)
                    setProducts(responseData);
                    setTotalPages(1);
                } else {
                    // TH4: Không có dữ liệu hoặc lỗi
                    setProducts([]);
                    setTotalPages(0);
                }
                // -----------------------------------------------------------

            } catch (error) {
                console.error("Lỗi tải dữ liệu shop:", error);
                setProducts([]); // Nếu lỗi, set về mảng rỗng để không bị crash trang
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [categoryId, currentPage]);

    // Hàm chuyển trang
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo(0, 0);
        }
    };

    return (
        <div className="container py-5">
            <div className="row">
                {/* --- SIDEBAR --- */}
                <div className="col-md-3 mb-4">
                    <div className="card shadow-sm border-0">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0"><FaFilter className="me-2" /> Danh Mục</h5>
                        </div>
                        <div className="list-group list-group-flush">
                            <Link to="/shop" className={`list-group-item list-group-item-action ${!categoryId ? 'active fw-bold' : ''}`}>
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

                {/* --- DANH SÁCH SẢN PHẨM --- */}
                <div className="col-md-9">
                    <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-2">
                        <h3 className="mb-0 section-title" style={{margin: 0, fontSize: '24px', textAlign: 'left'}}>
                            {categoryId 
                                ? categories.find(c => c.categoryId === parseInt(categoryId))?.categoryName || "Sản phẩm"
                                : "Tất cả sản phẩm"
                            }
                        </h3>
                        <span className="text-muted small">Trang {currentPage} / {totalPages}</span>
                    </div>

                    {loading ? (
                        <div className="text-center py-5">
                            <div className="spinner-border text-success" role="status"></div>
                        </div>
                    ) : (
                        <>
                            {/* QUAN TRỌNG: Thêm dấu ? (products?.length) để an toàn tuyệt đối */}
                            {products && products.length > 0 ? (
                                <div className="row g-4">
                                    {products.map(p => (
                                        <div className="col-6 col-md-4" key={p.productId}>
                                            <HomeProductCard 
                                                product={p} 
                                                addToCart={addToCart} 
                                                baseUrl={API_BASE} 
                                            />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="col-12 text-center text-muted py-5">
                                    <p>Không tìm thấy sản phẩm nào.</p>
                                </div>
                            )}

                            {/* --- PHÂN TRANG --- */}
                            {totalPages > 1 && (
                                <nav className="mt-5">
                                    <ul className="pagination justify-content-center">
                                        <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>
                                                <FaChevronLeft />
                                            </button>
                                        </li>
                                        {[...Array(totalPages)].map((_, index) => (
                                            <li key={index + 1} className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}>
                                                <button className="page-link" onClick={() => handlePageChange(index + 1)}>
                                                    {index + 1}
                                                </button>
                                            </li>
                                        ))}
                                        <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                            <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>
                                                <FaChevronRight />
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Shop;