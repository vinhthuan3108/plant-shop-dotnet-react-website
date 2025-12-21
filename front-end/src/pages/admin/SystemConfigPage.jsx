import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Hoặc axios instance của bạn
import { toast } from 'react-toastify'; // Nếu có dùng thư viện toast

const SystemConfigPage = () => {
    // State lưu trữ giá trị các cấu hình
    const [configs, setConfigs] = useState({
        StoreName: '',
        Hotline: '',
        Email: '',
        Address: '',
        Copyright: '',
        SocialZalo: '',
        SocialFacebook: '',
        SocialMessenger: '',
        LogoUrl: '',
        FaviconUrl: ''
    });

    // Hàm lấy dữ liệu khi mới vào trang
    useEffect(() => {
        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await axios.get('https://localhost:7298/api/TblSystemConfig'); // Sửa port theo máy bạn
            const data = res.data;
            
            // Chuyển mảng Key-Value thành Object để dễ binding vào input
            const newConfig = { ...configs };
            data.forEach(item => {
                if (newConfig.hasOwnProperty(item.configKey)) {
                    newConfig[item.configKey] = item.configValue;
                }
            });
            setConfigs(newConfig);
        } catch (error) {
            console.error(error);
        }
    };

    // Hàm xử lý khi nhập liệu
    const handleChange = (e) => {
        const { name, value } = e.target;
        setConfigs(prev => ({ ...prev, [name]: value }));
    };

    // Hàm xử lý upload ảnh (Logo/Favicon)
    const handleUpload = async (e, keyName) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('file', file);

        try {
            // SỬA 1: Đổi đường dẫn thành /configs để Backend biết tạo folder configs
            const res = await axios.post('https://localhost:7298/api/Upload/configs', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            // SỬA 2: Backend trả về { url: ... } nên phải dùng res.data.url
            if (res.data.url) {
                setConfigs(prev => ({ ...prev, [keyName]: res.data.url }));
                // Có thể alert nhẹ để biết đã upload xong (chưa lưu vào DB, chỉ mới lên server)
                // alert("Đã upload ảnh lên server, hãy bấm Lưu cấu hình!"); 
            }
        } catch (error) {
            console.error(error);
            alert('Upload ảnh thất bại');
        }
    };

    // Hàm lưu dữ liệu
    const handleSave = async () => {
        // Chuyển object state về dạng mảng Key-Value để gửi lên API
        const payload = Object.keys(configs).map(key => ({
            configKey: key,
            configValue: configs[key]
        }));

        try {
            await axios.post('https://localhost:7298/api/TblSystemConfig/BulkUpdate', payload);
            alert('Cập nhật thành công!');
            // Reload lại trang hoặc cập nhật lại context nếu cần
        } catch (error) {
            alert('Lỗi khi lưu cấu hình');
        }
    };

    return (
        <div className="p-4 bg-white shadow rounded">
            <h2 className="text-xl font-bold mb-4">Cấu hình hệ thống (Header/Footer)</h2>
            
            <div className="grid grid-cols-2 gap-4">
                {/* Thông tin chung */}
                <div className="col-span-2"><h3 className="font-semibold mt-4">Thông tin cửa hàng</h3></div>
                
                <div>
                    <label>Tên cửa hàng</label>
                    <input type="text" name="StoreName" value={configs.StoreName} onChange={handleChange} className="border p-2 w-full"/>
                </div>
                <div>
                    <label>Hotline</label>
                    <input type="text" name="Hotline" value={configs.Hotline} onChange={handleChange} className="border p-2 w-full"/>
                </div>
                <div>
                    <label>Email</label>
                    <input type="email" name="Email" value={configs.Email} onChange={handleChange} className="border p-2 w-full"/>
                </div>
                <div>
                    <label>Địa chỉ</label>
                    <input type="text" name="Address" value={configs.Address} onChange={handleChange} className="border p-2 w-full"/>
                </div>
                <div className="col-span-2">
                    <label>Copyright</label>
                    <input type="text" name="Copyright" value={configs.Copyright} onChange={handleChange} className="border p-2 w-full"/>
                </div>

                {/* Mạng xã hội */}
                <div className="col-span-2"><h3 className="font-semibold mt-4">Liên kết Mạng xã hội</h3></div>
                <div>
                    <label>Zalo (SĐT/Link)</label>
                    <input type="text" name="SocialZalo" value={configs.SocialZalo} onChange={handleChange} className="border p-2 w-full"/>
                </div>
                <div>
                    <label>Facebook Fanpage</label>
                    <input type="text" name="SocialFacebook" value={configs.SocialFacebook} onChange={handleChange} className="border p-2 w-full"/>
                </div>
                <div>
                    <label>Messenger Link</label>
                    <input type="text" name="SocialMessenger" value={configs.SocialMessenger} onChange={handleChange} className="border p-2 w-full"/>
                </div>

                {/* Hình ảnh */}
                <div className="col-span-2"><h3 className="font-semibold mt-4">Logo & Favicon</h3></div>
                
                <div>
                    <label>Logo Website</label>
                    <input type="file" onChange={(e) => handleUpload(e, 'LogoUrl')} className="block mt-1"/>
                    {configs.LogoUrl && <img src={`https://localhost:7298${configs.LogoUrl}`} alt="Logo" className="h-20 mt-2 object-contain bg-gray-100"/>}
                </div>

                <div>
                    <label>Favicon</label>
                    <input type="file" onChange={(e) => handleUpload(e, 'FaviconUrl')} className="block mt-1"/>
                    {configs.FaviconUrl && <img src={`https://localhost:7298${configs.FaviconUrl}`} alt="Favicon" className="h-10 mt-2 object-contain bg-gray-100"/>}
                </div>
            </div>

            <button onClick={handleSave} className="mt-6 bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
                Lưu cấu hình
            </button>
        </div>
    );
};

export default SystemConfigPage;