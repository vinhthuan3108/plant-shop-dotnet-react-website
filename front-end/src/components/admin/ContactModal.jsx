import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContactModal = ({ isOpen, onClose, contact, onUpdateStatus, refreshData }) => {
    // State quản lý nội dung phản hồi
    const [replyMessage, setReplyMessage] = useState('');
    const [isReplying, setIsReplying] = useState(false); // Trạng thái mở khung soạn thảo
    const [sending, setSending] = useState(false);

    // Reset state khi mở modal mới
    useEffect(() => {
        if (isOpen) {
            setReplyMessage('');
            setIsReplying(false);
            setSending(false);
        }
    }, [isOpen, contact]);

    if (!isOpen || !contact) return null;

    // Hàm gửi phản hồi
    const handleSendReply = async () => {
        if (!replyMessage.trim()) return alert("Vui lòng nhập nội dung phản hồi");

        setSending(true);
        try {
            // Gọi API Backend vừa viết
            await axios.post(`https://localhost:7298/api/Contacts/reply/${contact.contactId}`, {
                subject: contact.subject || "Hỗ trợ khách hàng",
                message: replyMessage
            });
            
            alert("Đã gửi phản hồi thành công!");
            refreshData(); // Load lại danh sách bên ngoài
            onClose(); // Đóng modal
        } catch (error) {
            console.error(error);
            alert("Lỗi khi gửi mail: " + (error.response?.data || error.message));
        } finally {
            setSending(false);
        }
    };

    // Style
    const labelStyle = { display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#555' };
    const valueStyle = { width: '100%', padding: '10px', marginBottom: '15px', backgroundColor: '#f9f9f9', border: '1px solid #ddd', borderRadius: '4px' };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '600px', maxWidth: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                    <h3 style={{ margin: 0 }}>Chi Tiết Liên Hệ</h3>
                    <span style={{ 
                        padding: '5px 10px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', color: 'white',
                        backgroundColor: contact.status === 'Replied' ? '#17a2b8' : (contact.status === 'New' ? '#dc3545' : '#28a745')
                    }}>
                        {contact.status === 'New' ? 'Mới' : (contact.status === 'Replied' ? 'Đã phản hồi' : 'Đã xem')}
                    </span>
                </div>
                
                {/* --- Thông tin khách hàng --- */}
                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Họ tên:</label>
                        <div style={valueStyle}>{contact.fullName}</div>
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={labelStyle}>Email:</label>
                        <div style={valueStyle}>{contact.email}</div>
                    </div>
                </div>

                <div>
                    <label style={labelStyle}>Nội dung khách gửi:</label>
                    <textarea readOnly value={contact.message} style={{ ...valueStyle, height: '80px', resize: 'none' }} />
                </div>

                {/* --- KHU VỰC PHẢN HỒI --- */}
                {isReplying ? (
                    <div style={{ marginTop: '20px', borderTop: '2px dashed #007bff', paddingTop: '15px' }}>
                        <h5 style={{ color: '#007bff' }}>Soạn phản hồi gửi khách:</h5>
                        <textarea 
                            rows="5"
                            placeholder="Nhập nội dung trả lời tại đây..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            style={{ width: '100%', padding: '10px', border: '1px solid #007bff', borderRadius: '4px', marginBottom: '10px' }}
                        ></textarea>
                        
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button onClick={() => setIsReplying(false)} disabled={sending} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px' }}>Hủy</button>
                            <button onClick={handleSendReply} disabled={sending} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>
                                {sending ? 'Đang gửi...' : 'Gửi Email'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <button onClick={onClose} style={{ padding: '8px 15px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                            Đóng
                        </button>
                        
                        {/* Chỉ hiện nút Đã xem nếu chưa xử lý */}
                        {contact.status === 'New' && (
                            <button 
                                onClick={() => onUpdateStatus(contact.contactId, 'Processed')} 
                                style={{ padding: '8px 15px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                Đã xem
                            </button>
                        )}

                        {/* Nút mở khung phản hồi */}
                        <button 
                            onClick={() => setIsReplying(true)} 
                            style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                        >
                            <i className="bi bi-reply-fill"></i> Phản hồi
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContactModal;