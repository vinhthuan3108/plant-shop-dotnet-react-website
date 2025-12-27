import React, { useEffect, useState } from 'react';
import axios from 'axios'; 
import SupplierModal from '../../components/admin/SupplierModal';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const API_URL = 'https://localhost:7298/api/suppliers';

    const fetchSuppliers = async () => {
        try {
            const res = await axios.get(API_URL);
            setSuppliers(res.data);
        } catch (error) {
            console.error("Lỗi khi tải dữ liệu:", error);
        }
    };

    useEffect(() => { fetchSuppliers(); }, []);

    const handleOpenAdd = () => {
        setSelectedSupplier(null);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (item) => {
        setSelectedSupplier(item);
        setIsModalOpen(true);
    };

    const handleSave = async (data) => {
        try {
            if (selectedSupplier) {
                await axios.put(`${API_URL}/${selectedSupplier.supplierId}`, data);
            } else {
                await axios.post(API_URL, data);
            }
            setIsModalOpen(false);
            fetchSuppliers();
        } catch (error) {
            alert('Có lỗi xảy ra: ' + error.message);
        }
    };

    const handleDelete = async (id) => {
        if(window.confirm("Bạn có chắc chắn muốn xóa nhà cung cấp này?")) {
            try {
                await axios.delete(`${API_URL}/${id}`);
                fetchSuppliers();
            } catch (error) {
                alert('Không thể xóa: ' + error.message);
            }
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h2>Quản Lý Nhà Cung Cấp</h2>
            
            <button 
                onClick={handleOpenAdd} 
                style={{ marginBottom: '15px', padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                + Thêm mới
            </button>
            
            {/* Thêm tableLayout: 'fixed' để cố định độ rộng cột */}
            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#ddd', tableLayout: 'fixed' }}>
                <thead style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                        {/* Tổng các width cộng lại nên là 100% */}
                        <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Tên Nhà Cung Cấp</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '15%' }}>SĐT</th>
                        <th style={{ padding: '12px', textAlign: 'left', width: '30%' }}>Địa chỉ</th>
                        <th style={{ padding: '12px', textAlign: 'left', width: '20%' }}>Ghi chú</th>
                        <th style={{ padding: '12px', textAlign: 'center', width: '15%' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.map(s => (
                        <tr key={s.supplierId}>
                            {/* Thêm wordWrap: 'break-word' để nội dung dài tự xuống dòng */}
                            <td style={{ padding: '10px', wordWrap: 'break-word' }}>
                                <strong>{s.supplierName}</strong>
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center', wordWrap: 'break-word' }}>
                                {s.phoneNumber}
                            </td>
                            <td style={{ padding: '10px', wordWrap: 'break-word' }}>
                                {s.address}
                            </td>
                            <td style={{ padding: '10px', color: '#666', fontStyle: 'italic', wordWrap: 'break-word' }}>
                                {s.note}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button 
                                    onClick={() => handleOpenEdit(s)}
                                    style={{ marginRight: '8px', padding: '5px 10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '3px' }}
                                >
                                    Sửa
                                </button>
                                <button 
                                    onClick={() => handleDelete(s.supplierId)}
                                    style={{ padding: '5px 10px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '3px' }}
                                >
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                    {suppliers.length === 0 && (
                        <tr>
                            <td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#888' }}>
                                Chưa có dữ liệu nhà cung cấp
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <SupplierModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onSave={handleSave}
                selectedSupplier={selectedSupplier}
            />
        </div>
    );
};

export default Suppliers;