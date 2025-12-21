import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function RevenueStats() {
    // State chọn ngày (Mặc định: 30 ngày gần nhất)
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().slice(0, 10));
    const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
    
    // State dữ liệu
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);

    // Hàm gọi API
    const fetchData = async () => {
        setLoading(true);
        try {
            // API cần nhận format yyyy-MM-dd
            const res = await axios.get(`https://localhost:7298/api/Statistics/revenue?startDate=${startDate}&endDate=${endDate}`);
            
            // Format lại data cho biểu đồ (Date sang string ngắn gọn)
            const formattedData = {
                ...res.data,
                DailyStats: res.data.dailyStats.map(item => ({
                    ...item,
                    dateStr: new Date(item.date).toLocaleDateString('vi-VN') // Chuyển 2024-01-01T00:00 -> 01/01/2024
                }))
            };
            
            setData(formattedData);
        } catch (error) {
            console.error("Lỗi lấy thống kê:", error);
            alert("Không thể tải dữ liệu thống kê");
        } finally {
            setLoading(false);
        }
    };

    // Gọi lần đầu khi vào trang
    useEffect(() => {
        fetchData();
    }, []);

    // --- STYLE OBJECTS (CSS Inline) ---
    const containerStyle = { padding: '20px', fontFamily: 'Arial, sans-serif' };
    const headerStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' };
    const filterStyle = { display: 'flex', gap: '10px', alignItems: 'center', backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px' };
    const inputStyle = { padding: '8px', border: '1px solid #ccc', borderRadius: '4px' };
    const btnStyle = { padding: '8px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
    
    // Style cho các thẻ Card tổng hợp
    const cardsContainer = { display: 'flex', gap: '20px', marginBottom: '30px' };
    const cardStyle = { flex: 1, padding: '20px', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', backgroundColor: 'white', textAlign: 'center' };
    const numberStyle = { fontSize: '24px', fontWeight: 'bold', margin: '10px 0', color: '#333' };
    const labelStyle = { color: '#666', fontSize: '14px' };

    return (
        <div style={containerStyle}>
            <div style={headerStyle}>
                <h2>Thống kê Doanh thu & Lợi nhuận</h2>
            </div>

            {/* 1. BỘ LỌC THỜI GIAN */}
            <div style={filterStyle}>
                <label>Từ ngày:</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
                
                <label>Đến ngày:</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
                
                <button onClick={fetchData} style={btnStyle}>Xem Thống Kê</button>
            </div>

            <hr style={{ margin: '20px 0', border: 'none', borderTop: '1px solid #eee' }} />

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>Đang tải dữ liệu...</div>
            ) : data ? (
                <>
                    {/* 2. CHI TIẾT DOANH THU/LỢI NHUẬN (CARDS) */}
                    <div style={cardsContainer}>
                        <div style={{ ...cardStyle, borderLeft: '5px solid #007bff' }}>
                            <div style={labelStyle}>Tổng Doanh Thu</div>
                            <div style={{ ...numberStyle, color: '#007bff' }}>
                                {data.totalRevenue.toLocaleString('vi-VN')} đ
                            </div>
                        </div>
                        <div style={{ ...cardStyle, borderLeft: '5px solid #28a745' }}>
                            <div style={labelStyle}>Tổng Lợi Nhuận</div>
                            <div style={{ ...numberStyle, color: '#28a745' }}>
                                {data.totalProfit.toLocaleString('vi-VN')} đ
                            </div>
                        </div>
                        <div style={{ ...cardStyle, borderLeft: '5px solid #ffc107' }}>
                            <div style={labelStyle}>Tổng Đơn Hàng</div>
                            <div style={{ ...numberStyle, color: '#d39e00' }}>
                                {data.totalOrders} đơn
                            </div>
                        </div>
                    </div>

                    {/* 3. BIỂU ĐỒ (CHART) */}
{/* QUAN TRỌNG: Phải có height: '400px' ở thẻ div này */}
<div style={{ height: '400px', width: '100%', backgroundColor: 'white', padding: '20px', borderRadius: '8px' }}>
    
    <h4 style={{ marginBottom: '20px', textAlign: 'center' }}>Biểu đồ tăng trưởng theo ngày</h4>
    
    {/* ResponsiveContainer sẽ lấy 100% của 400px phía trên */}
    <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.DailyStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dateStr" />
            <YAxis />
            <Tooltip formatter={(value) => new Intl.NumberFormat('vi-VN').format(value) + ' đ'} />
            <Legend />
            <Line type="monotone" dataKey="revenue" name="Doanh thu" stroke="#007bff" />
            <Line type="monotone" dataKey="profit" name="Lợi nhuận" stroke="#28a745" />
        </LineChart>
    </ResponsiveContainer>
                    </div>
                </>
            ) : (
                <div style={{ textAlign: 'center', color: '#999' }}>Chưa có dữ liệu để hiển thị</div>
            )}
        </div>
    );
}

export default RevenueStats;