import React, { useEffect, useState } from 'react';
import axios from 'axios'; // Đảm bảo bạn đã cài axios: npm install axios
import SupplierModal from '../../components/admin/SupplierModal';

const Suppliers = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSupplier, setSelectedSupplier] = useState(null);

    const fetchSuppliers = async () => {
        const res = await axios.get('https://localhost:7298/api/suppliers'); // Thay port của bạn
        setSuppliers(res.data);
    };

    useEffect(() => { fetchSuppliers(); }, []);

    const handleSave = async (data) => {
        if (selectedSupplier) {
            await axios.put(`https://localhost:7298/api/suppliers/${selectedSupplier.supplierId}`, data);
        } else {
            await axios.post('https://localhost:7298/api/suppliers', data);
        }
        setIsModalOpen(false);
        fetchSuppliers();
    };

    const handleDelete = async (id) => {
        if(window.confirm("Bạn có chắc muốn xóa?")) {
            await axios.delete(`https://localhost:7298/api/suppliers/${id}`);
            fetchSuppliers();
        }
    };

    return (
        <div className="admin-container">
            <h1>Quản lý nhà cung cấp</h1>
            <button onClick={() => { setSelectedSupplier(null); setIsModalOpen(true); }}>
                Thêm mới
            </button>
            <table>
                <thead>
                    <tr>
                        <th>Tên</th>
                        <th>SĐT</th>
                        <th>Địa chỉ</th>
                        <th>Ghi chú</th>
                        <th>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.map(s => (
                        <tr key={s.supplierId}>
                            <td>{s.supplierName}</td>
                            <td>{s.phoneNumber}</td>
                            <td>{s.address}</td>
                            <td>{s.note}</td>
                            <td>
                                <button onClick={() => { setSelectedSupplier(s); setIsModalOpen(true); }}>Sửa</button>
                                <button onClick={() => handleDelete(s.supplierId)}>Xóa</button>
                            </td>
                        </tr>
                    ))}
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