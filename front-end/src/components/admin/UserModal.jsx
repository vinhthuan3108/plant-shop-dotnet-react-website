import { useState, useEffect } from 'react';

function UserModal({ isOpen, onClose, onSubmit, initialData, roles }) {
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [roleId, setRoleId] = useState(2); 
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (initialData) {
            setEmail(initialData.email);
            setFullName(initialData.fullName);
            setPhoneNumber(initialData.phoneNumber || '');
            setRoleId(initialData.roleId);
            setIsActive(initialData.isActive);
            setPassword(''); 
        } else {
            setEmail('');
            setFullName('');
            setPhoneNumber('');
            setPassword('');
            setRoleId(2);
            setIsActive(true);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {

        if(!email || !fullName) return alert("Vui lòng nhập đủ thông tin");
        if(!initialData && !password) return alert("Tạo mới phải nhập mật khẩu!");

        const formData = {
            email,
            fullName,
            phoneNumber,
            roleId: parseInt(roleId),
            isActive,
            // Nếu có nhập pass thì gửi, ko thì gửi chuỗi rỗng
            passwordHash: password 
        };
        onSubmit(formData);
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <div style={{ background: 'white', padding: 20, borderRadius: 8, width: 400 }}>
                <h3>{initialData ? 'Sửa Nhân Viên' : 'Thêm Nhân Viên'}</h3>
                
                {/* ... Các ô input cũ giữ nguyên ... */}
                
                <label>Email (Tên đăng nhập):</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} disabled={!!initialData} style={{ display: 'block', width: '100%', marginBottom: 10, padding: 5 }} />

                <label>Họ tên:</label>
                <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 10, padding: 5 }} />

                {/* 4. THÊM Ô NHẬP SỐ ĐIỆN THOẠI Ở ĐÂY */}
                <label>Số điện thoại:</label>
                <input 
                    type="text" 
                    value={phoneNumber} 
                    onChange={e => setPhoneNumber(e.target.value)} 
                    style={{ display: 'block', width: '100%', marginBottom: 10, padding: 5 }} 
                />

                <label>Mật khẩu {initialData && <small>(Để trống nếu không đổi)</small>}:</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 10, padding: 5 }} />

                <label>Vai trò:</label>
                <select value={roleId} onChange={e => setRoleId(e.target.value)} style={{ display: 'block', width: '100%', marginBottom: 10, padding: 5 }}>
                    {roles.map(r => (
                        <option key={r.roleId} value={r.roleId}>{r.roleName}</option>
                    ))}
                </select>

                <div style={{ marginBottom: 15 }}>
                    <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Đang hoạt động
                </div>

                <div style={{ textAlign: 'right' }}>
                    <button onClick={onClose} style={{ marginRight: 10 }}>Hủy</button>
                    <button onClick={handleSubmit} style={{ background: 'blue', color: 'white', border: 'none', padding: '5px 15px' }}>Lưu</button>
                </div>
            </div>
        </div>
    );
}

export default UserModal;