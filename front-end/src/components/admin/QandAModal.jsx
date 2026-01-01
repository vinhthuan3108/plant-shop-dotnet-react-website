import { useState, useEffect } from 'react';

function QandAModal({ isOpen, onClose, onSubmit, initialData }) {
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');
    const [active, setActive] = useState(true);
    // 1. Thêm state lưu thứ tự
    const [displayOrder, setDisplayOrder] = useState(0);

    useEffect(() => {
        if (initialData) {
            setQuestion(initialData.question || '');
            setAnswer(initialData.answer || '');
            setActive(initialData.isActive ?? true);
            // 2. Load thứ tự cũ nếu có, không thì mặc định 0
            setDisplayOrder(initialData.displayOrder || 0);
        } else {
            setQuestion('');
            setAnswer('');
            setActive(true);
            // 3. Reset về 0 khi thêm mới
            setDisplayOrder(0);
        }
    }, [initialData, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!question.trim()) return alert("Câu hỏi không được trống");
        if (!answer.trim()) return alert("Câu trả lời không được trống");

        const formData = {
            question: question,
            answer: answer,
            isActive: active,
            // 4. Gửi kèm displayOrder (ép kiểu số nguyên)
            displayOrder: parseInt(displayOrder) || 0 
        };
        onSubmit(formData);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', width: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3>{initialData ? 'Cập Nhật Câu Hỏi' : 'Thêm Câu Hỏi Mới'}</h3>

                {/* Ô nhập câu hỏi */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Câu hỏi:</label>
                    <input 
                        type="text" 
                        value={question} 
                        onChange={e => setQuestion(e.target.value)} 
                        style={{ width: '100%', padding: '10px', border:'1px solid #ddd', borderRadius:'4px' }} 
                        placeholder="Nhập câu hỏi..."
                    />
                </div>

                {/* Ô nhập câu trả lời */}
                <div style={{ marginBottom: '15px' }}>
                    <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Câu trả lời:</label>
                    <textarea 
                        value={answer} 
                        onChange={e => setAnswer(e.target.value)} 
                        style={{ width: '100%', height: '100px', padding: '10px', border:'1px solid #ddd', borderRadius:'4px' }} 
                        placeholder="Nhập câu trả lời..."
                    />
                </div>

                {/* Hàng chứa Thứ tự hiển thị + Checkbox Active */}
                <div style={{ marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '30px' }}>
                    {/* 5. Ô nhập Thứ tự hiển thị */}
                    <div>
                        <label style={{display:'block', marginBottom:'5px', fontWeight:'bold'}}>Thứ tự hiển thị:</label>
                        <input 
                            type="number" 
                            value={displayOrder} 
                            onChange={e => setDisplayOrder(e.target.value)} 
                            style={{ width: '100px', padding: '8px', border:'1px solid #ddd', borderRadius:'4px' }} 
                            placeholder="0"
                        />
                        <small style={{display:'block', color:'#666', marginTop:'2px', fontSize:'12px'}}>Số nhỏ hiện trước</small>
                    </div>

                    <div style={{ marginTop: '20px' }}>
                        <label style={{ cursor: 'pointer', display:'flex', alignItems:'center', gap:'10px' }}>
                            <input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> 
                            Hiển thị lên trang web
                        </label>
                    </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 20px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Hủy</button>
                    <button onClick={handleSubmit} style={{ padding: '8px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Lưu</button>
                </div>
            </div>
        </div>
    );
}

export default QandAModal;