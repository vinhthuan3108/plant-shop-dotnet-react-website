import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { API_BASE } from '../../utils/apiConfig.jsx';
function ProductStats() {
    // State for time range & filters
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    const [categoryId, setCategoryId] = useState('');
    const [slowDays, setSlowDays] = useState(60); 

    // State for Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10; 

    const [data, setData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    const COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];

    // Fetch Categories on Mount
    useEffect(() => {
        // Updated API endpoint to match TblCategoriesController
        axios.get(`${API_BASE}/api/TblCategories`)
             .then(res => setCategories(res.data))
             .catch(err => console.log(err));
    }, []);

    // Fetch Data whenever filters or page changes
    useEffect(() => {
        fetchData();
        // eslint-disable-next-line
    }, [currentPage, categoryId]); // Added categoryId dependency to trigger re-fetch

    const fetchData = async () => {
        setLoading(true);
        try {
            let url = `${API_BASE}/api/Statistics/products?startDate=${startDate}&endDate=${endDate}&slowMovingDays=${slowDays}&page=${currentPage}&pageSize=${pageSize}`;
            
            // Only append categoryId if it has a value
            if (categoryId) {
                url += `&categoryId=${categoryId}`;
            }

            const res = await axios.get(url);
            setData(res.data);
            setTotalPages(res.data.totalPages); 
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    // Handle filter button click (for dates/slow moving days)
    const handleFilter = () => {
        // Reset to page 1 if not already there, otherwise just fetch
        if (currentPage !== 1) {
            setCurrentPage(1);
        } else {
            fetchData();
        }
    };

    // Handle Category Change specifically
    const handleCategoryChange = (e) => {
        setCategoryId(e.target.value);
        setCurrentPage(1); // Reset to page 1 when category changes
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const renderPagination = () => {
        if (!data || totalPages <= 1) return null;

        let startPage, endPage;
        if (totalPages <= 10) {
            startPage = 1; endPage = totalPages;
        } else {
            if (currentPage <= 6) {
                startPage = 1; endPage = 10;
            } else if (currentPage + 4 >= totalPages) {
                startPage = totalPages - 9; endPage = totalPages;
            } else {
                startPage = currentPage - 5; endPage = currentPage + 4;
            }
        }

        const pages = [];
        for (let i = startPage; i <= endPage; i++) pages.push(i);

        return (
            <div className="d-flex justify-content-center align-items-center gap-1 py-3 border-top mt-3">
                <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1}
                        className="btn btn-white border btn-sm" style={{cursor: currentPage===1?'default':'pointer'}}>
                    &lsaquo; Trước
                </button>
                
                {pages.map(number => (
                    <button key={number} onClick={() => paginate(number)}
                        className={`btn btn-sm border ${currentPage === number ? 'btn-primary' : 'btn-white'}`}
                        style={{minWidth: '32px'}}>
                        {number}
                    </button>
                ))}

                <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages}
                        className="btn btn-white border btn-sm" style={{cursor: currentPage===totalPages?'default':'pointer'}}>
                    Sau &rsaquo;
                </button>
            </div>
        );
    };

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
            
            {/* --- HEADER & FILTERS --- */}
            <div className="card shadow-sm mb-4 border-0">
                <div className="card-body d-flex flex-column flex-xl-row justify-content-between align-items-center gap-3">
                    <h4 className="m-0 font-weight-bold text-primary">
                        <i className="bi bi-bar-chart-fill me-2"></i>Thống kê Sản phẩm
                    </h4>
                    
                    <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
                        {/* Category Dropdown */}
                        <select className="form-select form-select-sm" style={{maxWidth: '200px'}} 
                                value={categoryId} onChange={handleCategoryChange}>
                            <option value="">-- Tất cả danh mục --</option>
                            {categories.map(cat => (
                                <option key={cat.categoryId} value={cat.categoryId}>
                                    {cat.categoryName} ({cat.productCount} SP)
                                </option>
                            ))}
                        </select>

                        <div className="input-group input-group-sm" style={{width: 'auto'}}>
                            <span className="input-group-text bg-white">Từ</span>
                            <input type="date" className="form-control" value={startDate} onChange={e => setStartDate(e.target.value)} />
                        </div>
                        <div className="input-group input-group-sm" style={{width: 'auto'}}>
                            <span className="input-group-text bg-white">Đến</span>
                            <input type="date" className="form-control" value={endDate} onChange={e => setEndDate(e.target.value)} />
                        </div>

                        <button onClick={handleFilter} className="btn btn-primary btn-sm px-3">
                            <i className="bi bi-filter me-1"></i> Xem báo cáo
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>
            ) : data ? (
                <div className="row g-4">
                    
                    {/* --- LEFT COLUMN: TOP SELLING LIST --- */}
                    <div className="col-lg-8">
                        <div className="card shadow border-0 h-100 rounded-3">
                            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                                <h6 className="m-0 font-weight-bold text-success">
                                    <i className="bi bi-trophy-fill text-warning me-2"></i>Danh sách Sản phẩm Bán chạy
                                </h6>
                                <span className="badge bg-light text-muted border">Tổng: {data.totalProducts} SP</span>
                            </div>
                            <div className="table-responsive">
                                <table className="table align-middle table-hover mb-0">
                                    <thead className="bg-light text-secondary small">
                                        <tr>
                                            <th className="ps-4 text-center" style={{width: '60px'}}>#</th>
                                            <th>Sản phẩm</th>
                                            <th className="text-center">Đã bán</th>
                                            <th className="text-end">Doanh thu</th>
                                            <th className="text-end pe-4">Lợi nhuận</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.topProducts.map((item, index) => {
                                            const stt = (currentPage - 1) * pageSize + index + 1;
                                            return (
                                                <tr key={index}>
                                                    <td className="ps-4 fw-bold text-muted text-center">{stt}</td>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img src={item.thumbnail || 'https://via.placeholder.com/40'} 
                                                                 alt="" className="rounded me-2 border" 
                                                                 style={{width: '40px', height: '40px', objectFit: 'cover'}} />
                                                            <span className="fw-bold text-dark">{item.productName}</span>
                                                        </div>
                                                    </td>
                                                    <td className="text-center"><span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3">{item.quantitySold}</span></td>
                                                    <td className="text-end text-primary">{formatCurrency(item.totalRevenue)}</td>
                                                    <td className="text-end pe-4 text-success fw-bold">{formatCurrency(item.totalProfit)}</td>
                                                </tr>
                                            );
                                        })}
                                        {data.topProducts.length === 0 && (
                                            <tr><td colSpan="5" className="text-center py-4 text-muted">Không có dữ liệu bán hàng.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {renderPagination()}
                        </div>
                    </div>

                    {/* --- RIGHT COLUMN: PIE CHART --- */}
                    <div className="col-lg-4">
                        <div className="card shadow border-0 h-100 rounded-3">
                            <div className="card-header bg-white py-3 border-0">
                                <h6 className="m-0 font-weight-bold text-primary">Tỷ trọng theo Danh mục</h6>
                            </div>
                            <div className="card-body">
                                <div style={{ width: '100%', height: 300 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie data={data.categoryShares} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={5} dataKey="totalSold" nameKey="categoryName">
                                                {data.categoryShares.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `${value} cây`} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- BOTTOM ROW: SLOW MOVING INVENTORY --- */}
                    <div className="col-12">
                        <div className="card shadow border-0 rounded-3 border-start border-4 border-danger">
                            <div className="card-header bg-white py-3 border-0 d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="m-0 font-weight-bold text-danger">
                                        <i className="bi bi-hourglass-bottom me-2"></i>Báo cáo Hàng tồn kho lâu
                                    </h6>
                                </div>
                                <div className="d-flex align-items-center">
                                    <label className="me-2 small text-muted">Tồn kho trên:</label>
                                    <div className="input-group input-group-sm" style={{width: '130px'}}>
                                        <input type="number" className="form-control text-center" value={slowDays} onChange={(e) => setSlowDays(e.target.value)} />
                                        <span className="input-group-text">ngày</span>
                                    </div>
                                    <button className="btn btn-outline-secondary btn-sm ms-2" onClick={handleFilter}>Lọc</button>
                                </div>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-danger text-white small">
                                            <tr>
                                                <th className="ps-4">Sản phẩm</th>
                                                <th>Danh mục</th>
                                                <th className="text-center">Tồn hiện tại</th>
                                                <th className="text-center">Ngày nhập cuối</th>
                                                <th className="text-center">Thời gian kho</th>
                                                <th className="text-end pe-4">Vốn bị kẹt</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.slowMovingProducts && data.slowMovingProducts.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="ps-4">
                                                        <div className="d-flex align-items-center">
                                                            <img src={item.thumbnail || 'https://via.placeholder.com/40'} alt="" className="rounded me-2 border" style={{width: '40px', height: '40px'}} />
                                                            <span className="fw-bold">{item.productName}</span>
                                                        </div>
                                                    </td>
                                                    <td><span className="badge bg-light text-dark border">{item.categoryName}</span></td>
                                                    <td className="text-center fw-bold">{item.stockQuantity}</td>
                                                    <td className="text-center small text-muted">
                                                        {item.lastImportDate ? new Date(item.lastImportDate).toLocaleDateString('vi-VN') : 'N/A'}
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="badge bg-warning text-dark">{item.daysSinceLastImport} ngày</span>
                                                    </td>
                                                    <td className="text-end pe-4 text-danger fw-bold">
                                                        {formatCurrency(item.capitalPrice)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            ) : null}
        </div>
    );
}

export default ProductStats;