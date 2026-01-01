import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaLeaf, FaRobot, FaPaperPlane, FaUser } from 'react-icons/fa';
import './PlantCare.css';

const PlantCare = () => {
    // State lưu lịch sử chat
    const [messages, setMessages] = useState([
        { 
            sender: 'bot', 
            text: "Xin chào! 🌱 Tôi là chuyên gia Plant Shop. Tôi có thể giúp bạn chẩn đoán bệnh cây, tư vấn cách chăm sóc hoặc chọn loại cây phù hợp. Bạn cần giúp gì hôm nay?" 
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    
    const messagesEndRef = useRef(null);
    const API_BASE = 'https://localhost:7298'; // Cấu hình đúng port backend của bạn

    // Tự động cuộn xuống cuối khi có tin nhắn mới
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Hàm gửi tin nhắn
    const handleSend = async (textToSend) => {
        const messageText = textToSend || input;
        if (!messageText.trim()) return;

        // 1. Thêm tin nhắn người dùng vào UI
        const userMsg = { sender: 'user', text: messageText };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            // 2. Gọi API Backend
            const res = await axios.post(`${API_BASE}/api/Chat/ask`, {
                message: messageText
            });

            // 3. Thêm phản hồi của Bot vào UI
            const botMsg = { sender: 'bot', text: res.data.reply };
            setMessages(prev => [...prev, botMsg]);

        } catch (error) {
            console.error(error);
            const errorMsg = { sender: 'bot', text: "Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau! 🥀" };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSend();
    };

    // Danh sách câu hỏi mẫu
    const faqs = [
        "Cây của tôi bị vàng lá, phải làm sao?",
        "Cách tưới nước cho cây Kim Tiền?",
        "Cây nào phù hợp để trong phòng ngủ?",
        "Làm sao để diệt rệp sáp trắng?",
        "Phân bón nào tốt cho cây ra hoa?"
    ];

    return (
        <div className="plant-care-container">
            {/* CỘT TRÁI: FAQ */}
            <div className="faq-sidebar">
                <div className="faq-title">
                    <FaLeaf /> Câu hỏi thường gặp
                </div>
                {faqs.map((q, index) => (
                    <button 
                        key={index} 
                        className="faq-btn" 
                        onClick={() => handleSend(q)}
                        disabled={loading}
                    >
                        {q}
                    </button>
                ))}
            </div>

            {/* CỘT PHẢI: CHAT */}
            <div className="chat-window">
                <div className="chat-header">
                    <FaRobot style={{fontSize: '20px'}}/> Plant Shop Tư Vấn Cây Cảnh
                </div>

                <div className="messages-area">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message-bubble ${msg.sender === 'bot' ? 'bot-msg' : 'user-msg'}`}>
                            {msg.sender === 'bot' && <strong style={{display:'block', marginBottom:'5px', color:'#2e7d32'}}>Plant Shop</strong>}
                            <span style={{whiteSpace: 'pre-wrap'}}>{msg.text}</span>
                        </div>
                    ))}
                    {loading && <div className="typing-indicator">PlantShop đang soạn tin...</div>}
                    <div ref={messagesEndRef} />
                </div>

                <div className="input-area">
                    <input 
                        type="text" 
                        className="chat-input" 
                        placeholder="Nhập câu hỏi về cây cảnh..." 
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={loading}
                    />
                    <button className="send-btn" onClick={() => handleSend()} disabled={loading}>
                        <FaPaperPlane />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PlantCare;