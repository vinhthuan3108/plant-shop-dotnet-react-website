import React, { useState, useEffect } from 'react';
import axios from 'axios';
import VoucherModal from '../../components/admin/VoucherModal';

function Vouchers() {
    const [vouchers, setVouchers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] = useState(null);

    // State cho filter
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const API_URL = 'https://localhost:7298/api/vouchers';

    const fetchVouchers = async () => {
        try {
            let url = `${API_URL}?search=${search}`;
            if (filterStatus === 'active') url += '&isActive=true';
            if (filterStatus === 'inactive') url += '&isActive=false';
            
            const res = await axios.get(url);
            setVouchers(res.data);
        } catch (error) {
            console.error("Lỗi tải danh sách voucher", error);
        }
    };

    useEffect(() => {
        fetchVouchers();
    }, [filterStatus]); // Reload khi đổi filter, search thì bấm nút tìm

    const handleOpenAdd = () => {
        setEditingVoucher(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (voucher) => {
        setEditingVoucher(voucher);
        setIsModalOpen(true);
    };

    const handleSaveFromModal = async (formData) => {
        try {
            if (editingVoucher) {
                await axios.put(`${API_URL}/${editingVoucher.voucherId}`, formData);
                alert("Cập nhật thành công!");
            } else {
                await axios.post(API_URL, formData);
                alert("Tạo mã giảm giá thành công!");
            }
            setIsModalOpen(false);
            fetchVouchers();
        } catch (error) {
            console.error(error);
            alert(error.response?.data || "Có lỗi xảy ra.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa hoặc ngừng voucher này?")) {
            try {
                const res = await axios.delete(`${API_URL}/${id}`);
                alert(res.data.message);
                fetchVouchers();
            } catch (error) {
                alert("Lỗi khi xóa voucher");
            }
        }
    };

    // Hàm render badge trạng thái theo style inline
    const renderStatusBadge = (voucher) => {
        const now = new Date();
        const endDate = new Date(voucher.endDate);
        
        let style = { padding: '5px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
        let text = "";

        if (!voucher.isActive) {
            style = { ...style, backgroundColor: '#6c757d', color: 'white' }; // Xám
            text = "Đã khóa";
        } else if (now > endDate) {
            style = { ...style, backgroundColor: '#f8d7da', color: 'red' }; // Đỏ nhạt
            text = "Hết hạn";
        } else if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
            style = { ...style, backgroundColor: '#fff3cd', color: '#856404' }; // Vàng
            text = "Hết lượt";
        } else {
            style = { ...style, backgroundColor: '#d4edda', color: '#155724' }; // Xanh lá
            text = "Đang chạy";
        }

        return <span style={style}>{text}</span>;
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản lý Mã Giảm Giá</h2>

            {/* Thanh công cụ tìm kiếm đơn giản */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input 
                    type="text" 
                    placeholder="Tìm theo mã..." 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                />
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    style={{ padding: '8px', border: '1px solid #ddd', borderRadius: '4px' }}
                >
                    <option value="all">Tất cả</option>
                    <option value="active">Đang hoạt động</option>
                    <option value="inactive">Đã ngừng</option>
                </select>
                <button onClick={fetchVouchers} style={{ padding: '8px 15px', backgroundColor: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                    Tìm kiếm
                </button>
            </div>

            <button onClick={handleOpenAdd} style={{ marginBottom: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                + Tạo Voucher
            </button>

            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#ddd' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Mã Code</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Mức giảm</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Đơn tối thiểu</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Thời gian</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Đã dùng</th>
                        <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '150px' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {vouchers.length === 0 ? (
                         <tr><td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>Không có dữ liệu</td></tr>
                    ) : (
                        vouchers.map(v => (
                            <tr key={v.voucherId}>
                                <td style={{ padding: '10px', fontWeight: 'bold', color: '#007bff' }}>{v.code}</td>
                                <td style={{ padding: '10px' }}>
                                    {v.discountType === 'PERCENT' 
                                        ? `${v.discountValue}% (Tối đa ${v.maxDiscountAmount?.toLocaleString()}đ)` 
                                        : `${v.discountValue?.toLocaleString()}đ`
                                    }
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>{v.minOrderValue?.toLocaleString()}đ</td>
                                <td style={{ padding: '10px', fontSize: '13px' }}>
                                    {new Date(v.startDate).toLocaleDateString('vi-VN')} - <br/>
                                    {new Date(v.endDate).toLocaleDateString('vi-VN')}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                    {v.usageCount} / {v.usageLimit || '∞'}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                    {renderStatusBadge(v)}
                                </td>
                                <td style={{ padding: '10px', textAlign: 'center' }}>
                                    <button 
                                        onClick={() => handleOpenEdit(v)} 
                                        style={{ marginRight: '8px', padding: '5px 10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}
                                    >
                                        Sửa
                                    </button>
                                    <button 
                                        onClick={() => handleDelete(v.voucherId)} 
                                        style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                                    >
                                        {v.isActive ? 'Xóa' : 'Xóa'}
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>

            {/* Gọi Modal */}
            <VoucherModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSubmit={handleSaveFromModal} 
                editingVoucher={editingVoucher}
            />
        </div>
    );
}

export default Vouchers;