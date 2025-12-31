import React, { useState, useEffect, useContext, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaFilter, FaChevronLeft, FaChevronRight, FaMoneyBillWave } from 'react-icons/fa';

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

    // --- CẤU HÌNH KHOẢNG GIÁ ĐỘNG ---
    // bounds: Giới hạn min/max của thanh trượt (Lấy từ DB)
    const [bounds, setBounds] = useState({ min: 0, max: 10000000 });
    // priceRange: Giá trị người dùng đang chọn
    const [priceRange, setPriceRange] = useState([0, 10000000]);
    
    // useRef để check lần đầu load của danh mục (để set lại bounds)
    const isFirstLoad = useRef(true);

    const [applyFilterTrigger, setApplyFilterTrigger] = useState(0); 

    const { addToCart } = useContext(CartContext);
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);
    const categoryId = queryParams.get('category') || queryParams.get('cate');
    const keyword = queryParams.get('keyword'); // <--- THÊM DÒNG NÀY

    const API_BASE = 'https://localhost:7298';

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    };

    // 1. Reset trang & Cờ load lần đầu khi đổi danh mục
    useEffect(() => {
        setCurrentPage(1);
        isFirstLoad.current = true; // Đánh dấu là danh mục mới -> Cần lấy lại Min/Max chuẩn từ DB
    }, [categoryId]);

    // 2. GỌI API LẤY DỮ LIỆU
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

                // --- XÂY DỰNG URL ---
                let productUrl = `${API_BASE}/api/TblProducts/shop?page=${currentPage}&pageSize=12`;
                
                if (categoryId) {
                    productUrl += `&categoryId=${categoryId}`;
                }
                if (keyword) {
                    productUrl += `&keyword=${encodeURIComponent(keyword)}`;
                }
                
                // Logic gửi lọc giá:
                // Nếu KHÔNG PHẢI là lần đầu load (tức là người dùng đã bấm Lọc hoặc đổi trang), thì gửi kèm giá.
                // Nếu là lần đầu load danh mục, KHÔNG gửi giá để server trả về Min/Max gốc của toàn danh mục.
                if (!isFirstLoad.current) {
                     productUrl += `&minPrice=${priceRange[0]}`;
                     productUrl += `&maxPrice=${priceRange[1]}`;
                }
                
                const prodRes = await axios.get(productUrl);
                const responseData = prodRes.data;

                // Xử lý dữ liệu trả về
                // API mới trả về cấu trúc: { data, totalPages, minPrice, maxPrice, ... }
                const listProducts = responseData.data || [];
                setProducts(listProducts);
                setTotalPages(responseData.totalPages || 0);

                // --- CẬP NHẬT SLIDER BOUNDS (CHỈ LẦN ĐẦU) ---
                if (isFirstLoad.current) {
                    const serverMin = responseData.minPrice || 0;
                    const serverMax = responseData.maxPrice || 10000000;

                    // Set giới hạn thanh trượt theo DB
                    setBounds({ min: serverMin, max: serverMax });
                    
                    // Set khoảng chọn mặc định full range
                    setPriceRange([serverMin, serverMax]);

                    // Đánh dấu đã load xong lần đầu
                    isFirstLoad.current = false;
                }

            } catch (error) {
                console.error("Lỗi tải dữ liệu shop:", error);
                setProducts([]); 
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [categoryId, currentPage, applyFilterTrigger, keyword]); 

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
            window.scrollTo(0, 0);
        }
    };

    const handleSliderChange = (value) => {
        setPriceRange(value);
    };

    const handleApplyFilter = () => {
        setCurrentPage(1);
        setApplyFilterTrigger(prev => prev + 1);
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
                            <div style={{ padding: '15px 10px 20px 10px' }}>
                                {/* Slider với bounds động */}
                                <Slider 
                                    range 
                                    min={bounds.min} 
                                    max={bounds.max} 
                                    step={10000} 
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