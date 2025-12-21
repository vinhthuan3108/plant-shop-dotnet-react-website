import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ProductStats() {
    // State thời gian
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Bảng màu Pastel hiện đại hơn cho biểu đồ
    const COLORS = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];

    const fetchData = async () => {
        setLoading(true);
        try {
            // Đảm bảo URL này đúng với port backend của bạn
            const res = await axios.get(`https://localhost:7298/api/Statistics/products?startDate=${startDate}&endDate=${endDate}`);
            setData(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Hàm render huy hiệu Top 1, 2, 3
    const renderRankBadge = (index) => {
        if (index === 0) return <span className="badge bg-warning text-dark">🥇 Top 1</span>;
        if (index === 1) return <span className="badge bg-secondary">🥈 Top 2</span>;
        if (index === 2) return <span className="badge" style={{backgroundColor: '#cd7f32'}}>🥉 Top 3</span>;
        return <span className="badge bg-light text-secondary">#{index + 1}</span>;
    };

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fc', minHeight: '100vh' }}>
            
            {/* Header + Bộ lọc */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 bg-white p-3 rounded shadow-sm">
                <h4 className="m-0 font-weight-bold text-primary">
                    <i className="bi bi-bar-chart-fill me-2"></i>Thống kê Sản phẩm & Tồn kho
                </h4>
                
                <div className="d-flex gap-2 align-items-center mt-3 mt-md-0">
                    <div className="input-group input-group-sm">
                        <span className="input-group-text bg-light border-0">Từ</span>
                        <input 
                            type="date" 
                            className="form-control border-light bg-light" 
                            value={startDate} 
                            onChange={e => setStartDate(e.target.value)} 
                        />
                    </div>
                    <div className="input-group input-group-sm">
                        <span className="input-group-text bg-light border-0">Đến</span>
                        <input 
                            type="date" 
                            className="form-control border-light bg-light" 
                            value={endDate} 
                            onChange={e => setEndDate(e.target.value)} 
                        />
                    </div>
                    <button onClick={fetchData} className="btn btn-primary btn-sm px-3 shadow-sm">
                        <i className="bi bi-search me-1"></i> Lọc
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : data ? (
                <div className="row g-4">
                    
                    {/* CỘT TRÁI: BIỂU ĐỒ TRÒN */}
                    <div className="col-lg-6 col-md-12">
                        <div className="card shadow border-0 h-100 rounded-3">
                            <div className="card-header py-3 d-flex flex-row align-items-center justify-content-between bg-white border-bottom-0">
                                <h6 className="m-0 font-weight-bold text-primary">Tỷ lệ bán theo Danh mục</h6>
                            </div>
                            <div className="card-body">
                                <div style={{ width: '100%', height: 350, minWidth: 0 }}>
                                    <ResponsiveContainer>
                                        <PieChart>
                                            <Pie
                                                data={data.categoryShares}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60} // Tạo hiệu ứng Doughnut chart đẹp hơn
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="totalSold"
                                                nameKey="categoryName"
                                            >
                                                {data.categoryShares.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `${value} sản phẩm`} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.15)'}} />
                                            <Legend verticalAlign="bottom" height={36}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="mt-2 text-center small text-muted">
                                    * Biểu đồ thể hiện mức độ ưa chuộng của từng nhóm cây
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: TOP BÁN CHẠY */}
                    <div className="col-lg-6 col-md-12">
                        <div className="card shadow border-0 h-100 rounded-3">
                            <div className="card-header py-3 bg-white border-bottom-0">
                                <h6 className="m-0 font-weight-bold text-success">
                                    <i className="bi bi-trophy-fill me-2 text-warning"></i>Top 5 Sản phẩm Bán chạy
                                </h6>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-hover align-middle mb-0">
                                        <thead className="bg-light text-secondary small text-uppercase">
                                            <tr>
                                                <th className="ps-4">Xếp hạng</th>
                                                <th>Sản phẩm</th>
                                                <th className="text-center">Số lượng</th>
                                                <th className="text-end pe-4">Doanh thu</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.topProducts.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="ps-4">{renderRankBadge(index)}</td>
                                                    <td className="fw-bold text-dark">{item.productName}</td>
                                                    <td className="text-center">
                                                        <span className="badge bg-primary bg-opacity-10 text-primary rounded-pill px-3">
                                                            {item.quantitySold}
                                                        </span>
                                                    </td>
                                                    <td className="text-end pe-4 fw-bold text-success">
                                                        {item.totalRevenue.toLocaleString('vi-VN')} đ
                                                    </td>
                                                </tr>
                                            ))}
                                            {data.topProducts.length === 0 && (
                                                <tr><td colSpan="4" className="text-center py-4">Chưa có dữ liệu bán hàng</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* HÀNG DƯỚI: TỒN KHO */}
                    <div className="col-12">
                        <div className="card shadow border-0 rounded-3 border-start border-4 border-warning">
                            <div className="card-header py-3 bg-white border-bottom-0 d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="m-0 font-weight-bold text-dark">
                                        <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
                                        Top 10 Sản phẩm Tồn kho cao
                                    </h6>
                                    <small className="text-muted">Cần chú ý đẩy hàng hoặc điều chỉnh kế hoạch nhập</small>
                                </div>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive">
                                    <table className="table table-striped align-middle mb-0">
                                        <thead className="bg-dark text-white small">
                                            <tr>
                                                <th className="ps-4 py-3">Tên Sản phẩm</th>
                                                <th>Danh mục</th>
                                                <th className="text-center">Tồn kho hiện tại</th>
                                                <th className="text-end pe-4">Giá trị tồn (Ước tính)</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {data.topInventory && data.topInventory.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="ps-4 fw-bold text-dark">{item.productName}</td>
                                                    <td>
                                                        <span className="badge border border-secondary text-secondary rounded-pill">
                                                            {item.categoryName}
                                                        </span>
                                                    </td>
                                                    <td className="text-center">
                                                        <span className="fw-bold text-danger fs-6">{item.stockQuantity}</span>
                                                    </td>
                                                    <td className="text-end pe-4 text-muted">
                                                        {(item.stockQuantity * item.price).toLocaleString('vi-VN')} đ
                                                    </td>
                                                </tr>
                                            ))}
                                            {(!data.topInventory || data.topInventory.length === 0) && (
                                                <tr><td colSpan="4" className="text-center py-4">Kho hàng đang trống</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="text-center mt-5">
                    <img src="https://cdn-icons-png.flaticon.com/512/7486/7486777.png" alt="No Data" style={{width: '100px', opacity: 0.5}} />
                    <p className="text-muted mt-3">Không có dữ liệu trong khoảng thời gian này.</p>
                </div>
            )}
        </div>
    );
}

export default ProductStats;