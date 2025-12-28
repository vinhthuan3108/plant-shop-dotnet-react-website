import React, { useState, useEffect, useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaFilter, FaChevronLeft, FaChevronRight, FaMoneyBillWave } from 'react-icons/fa';

// Import thư viện Slider và CSS của nó
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';

import HomeProductCard from '../../components/client/HomeProductCard'; 
import { CartContext } from '../../context/CartContext';
import './HomePage.css'; 

const Shop = () => {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State phân trang
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);

    // --- CẤU HÌNH KHOẢNG GIÁ (0đ - 10 triệu đồng) ---
    const MIN_PRICE_LIMIT = 0;
    const MAX_PRICE_LIMIT = 10000000;
    
    // State lưu giá trị thanh trượt: [min, max]
    const [priceRange, setPriceRange] = useState([MIN_PRICE_LIMIT, MAX_PRICE_LIMIT]);
    
    // Biến này dùng để kích hoạt gọi lại API khi bấm nút "LỌC"
    const [applyFilterTrigger, setApplyFilterTrigger] = useState(0); 

    const { addToCart } = useContext(CartContext);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const categoryId = queryParams.get('category') || queryParams.get('cate');

    const API_BASE = 'https://localhost:7298';

    // Hàm định dạng tiền tệ (VD: 1.000.000 đ)
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // 1. Reset trang khi đổi danh mục
    useEffect(() => {
        setCurrentPage(1);
        // Tùy chọn: Reset giá về mặc định khi chuyển danh mục
        // setPriceRange([MIN_PRICE_LIMIT, MAX_PRICE_LIMIT]); 
    }, [categoryId]);

    // 2. GỌI API LẤY DỮ LIỆU (QUAN TRỌNG)
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

                // --- XÂY DỰNG URL VỚI CÁC THAM SỐ LỌC ---
                let productUrl = `${API_BASE}/api/TblProducts/shop?page=${currentPage}&pageSize=12`;
                
                // Thêm danh mục
                if (categoryId) {
                    productUrl += `&categoryId=${categoryId}`;
                }
                
                // Thêm lọc giá (Lấy từ state priceRange)
                // Chỉ gửi nếu giá khác mặc định để tối ưu
                if (priceRange[0] > MIN_PRICE_LIMIT) {
                    productUrl += `&minPrice=${priceRange[0]}`;
                }
                if (priceRange[1] < MAX_PRICE_LIMIT) {
                    productUrl += `&maxPrice=${priceRange[1]}`;
                }
                
                console.log("Calling API:", productUrl); // Log để kiểm tra đường dẫn

                const prodRes = await axios.get(productUrl);
                const responseData = prodRes.data;

                // Xử lý dữ liệu trả về
                if (responseData && responseData.data) {
                    setProducts(responseData.data);
                    setTotalPages(responseData.totalPages || 0);
                } else if (responseData && responseData.Data) {
                    setProducts(responseData.Data);
                    setTotalPages(responseData.TotalPages || 0);
                } else if (Array.isArray(responseData)) {
                    setProducts(responseData);
                    setTotalPages(1);
                } else {
                    setProducts([]);
                    setTotalPages(0);
                }

            } catch (error) {
                console.error("Lỗi tải dữ liệu shop:", error);
                setProducts([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchData();
        // Chạy lại khi: đổi danh mục, đổi trang, hoặc bấm nút Lọc (applyFilterTrigger)
    }, [categoryId, currentPage, applyFilterTrigger]); 

    // Hàm chuyển trang
    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo(0, 0);
        }
    };

    // Hàm xử lý khi kéo thanh trượt (chỉ cập nhật UI, chưa gọi API)
    const handleSliderChange = (value) => {
        setPriceRange(value);
    };

    // Hàm xử lý khi bấm nút "LỌC" -> Kích hoạt gọi API
    const handleApplyFilter = () => {
        setCurrentPage(1); // Về trang 1 khi lọc mới
        setApplyFilterTrigger(prev => prev + 1); // Thay đổi state để kích hoạt useEffect
    };

    return (
        <div className="container py-5">
            <div className="row">
                {/* --- SIDEBAR TRÁI --- */}
                <div className="col-md-3 mb-4">
                    
                    {/* 1. LỌC THEO GIÁ */}
                    <div className="card shadow-sm border-0 mb-4">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0"><FaMoneyBillWave className="me-2" /> LỌC THEO GIÁ</h5>
                        </div>
                        <div className="card-body">
                            {/* Thanh trượt */}
                            <div style={{ padding: '15px 10px 20px 10px' }}>
                                <Slider 
                                    range 
                                    min={MIN_PRICE_LIMIT} 
                                    max={MAX_PRICE_LIMIT} 
                                    step={50000} // Bước nhảy 50k
                                    value={priceRange} 
                                    onChange={handleSliderChange} 
                                    trackStyle={[{ backgroundColor: '#28a745', height: 6 }]} 
                                    handleStyle={[
                                        { borderColor: '#28a745', backgroundColor: '#fff', opacity: 1, marginTop: -4 }, 
                                        { borderColor: '#28a745', backgroundColor: '#fff', opacity: 1, marginTop: -4 }
                                    ]} 
                                    railStyle={{ backgroundColor: '#e9ecef', height: 6 }} 
                                />
                            </div>
                            
                            {/* Hiển thị số tiền */}
                            <div style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '13px', color: '#666', marginBottom: '15px' }}>
                                {formatCurrency(priceRange[0])} — {formatCurrency(priceRange[1])}
                            </div>

                            <button 
                                className="btn btn-outline-success w-100 fw-bold btn-sm"
                                onClick={handleApplyFilter}
                            >
                                LỌC
                            </button>
                        </div>
                    </div>

                    {/* 2. DANH MỤC */}
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
                                    <p>Không tìm thấy sản phẩm nào trong khoảng giá này.</p>
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