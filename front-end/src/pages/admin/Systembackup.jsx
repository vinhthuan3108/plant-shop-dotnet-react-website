import React, { useState } from 'react';
import axios from 'axios'; // Hoặc instance axios bạn đã cấu hình
import { toast } from 'react-toastify';

const SystemBackup = () => {
    const [loading, setLoading] = useState(false);

    const handleBackup = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token'); // Hoặc key mà bạn tìm thấy ở bước 1
console.log("Token hiện tại:", token);

if (!token) {
    toast.error("Bạn chưa đăng nhập!");
    setLoading(false);
    return;
}
            // Gọi API với responseType là blob để nhận file
            const response = await axios.get('https://localhost:7298/api/backup/download-json', {
                responseType: 'blob', 
                headers: {
                    // Nhớ kèm token nếu bạn dùng JWT
                    Authorization: `Bearer ${localStorage.getItem('token')}` 
                }
            });

            // Tạo link ảo để trình duyệt tải file về
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // Lấy tên file từ header (nếu có) hoặc tự đặt
            const date = new Date().toISOString().slice(0,10);
            link.setAttribute('download', `Database_Backup_${date}.json`);
            
            document.body.appendChild(link);
            link.click();
            
            // Dọn dẹp
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success("Sao lưu dữ liệu thành công!");
        } catch (error) {
            console.error(error);
            toast.error("Có lỗi khi sao lưu dữ liệu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white shadow rounded">
            <h2 className="text-xl font-bold mb-4">Sao lưu hệ thống</h2>
            <p className="mb-4 text-gray-600">
                Tải xuống toàn bộ dữ liệu hệ thống (Sản phẩm, Đơn hàng, Users...) dưới dạng file JSON.
            </p>
            <button 
                onClick={handleBackup}
                disabled={loading}
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
            >
                {loading ? "Đang xử lý..." : "⬇ Tải xuống bản sao lưu (.json)"}
            </button>
        </div>
    );
};

export default SystemBackup;