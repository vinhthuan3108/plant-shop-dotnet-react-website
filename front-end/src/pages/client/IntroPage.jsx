import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BlogDetail.css'; // Dùng lại CSS của trang chi tiết bài viết cho đẹp
import { API_BASE } from '../../utils/apiConfig.jsx';
const IntroPage = () => {
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    //const API_BASE = 'https://localhost:7298'; 

    useEffect(() => {
        const fetchIntroPost = async () => {
            try {
                // 1. Lấy danh sách bài viết
                // Lưu ý: Cách tốt nhất là bạn biết ID của danh mục "Giới thiệu"
                // Ví dụ: Nếu ID danh mục Giới thiệu là 10, hãy gọi: 
                // await axios.get(`${API_BASE}/api/TblPosts?categoryId=10`);
                
                // Cách củ chuối hơn (nhưng tự động) nếu không nhớ ID:
                // Lấy tất cả bài viết, sau đó tìm bài nào có categoryName là "Giới thiệu"
                const res = await axios.get(`${API_BASE}/api/TblPosts?status=Published`);
                
                // Tìm bài mới nhất có tên danh mục là "Giới thiệu"
                // (Bạn cần đảm bảo trong Admin đã tạo danh mục tên chính xác là "Giới thiệu")
                const introPost = res.data.find(p => 
                    p.categoryName.toLowerCase().includes("giới thiệu") || 
                    p.categoryName.toLowerCase().includes("about")
                );

                if (introPost) {
                    // Nếu API list chỉ trả về thông tin tóm tắt, 
                    // bạn nên gọi thêm 1 lần API Detail để lấy full nội dung (Content)
                    const detailRes = await axios.get(`${API_BASE}/api/TblPosts/${introPost.postId}`);
                    setPost(detailRes.data);
                }
            } catch (error) {
                console.error("Lỗi tải bài giới thiệu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchIntroPost();
    }, []);

    // Hàm xử lý xuống dòng và ảnh (copy từ BlogDetail qua)
    const processContent = (content) => {
        if (!content) return "";
        return content.replace(/&nbsp;/g, ' '); 
    };

    if (loading) return <div className="container" style={{padding: '50px', textAlign: 'center'}}>Đang tải dữ liệu...</div>;
    
    // Nếu chưa có bài viết nào
    if (!post) return (
        <div className="container" style={{padding: '50px', textAlign: 'center'}}>
            <h2>Về Chúng Tôi</h2>
            <p>Nội dung đang được cập nhật...</p>
        </div>
    );

    return (
        <div className="container" style={{ padding: '40px 15px', maxWidth: '900px', margin: '0 auto' }}>
            {/* Tiêu đề trang (Hardcode hoặc lấy từ title bài viết) */}
            <h1 style={{ color: '#2e7d32', textAlign: 'center', marginBottom: '30px', textTransform: 'uppercase' }}>
                {post.title}
            </h1>

            {/* Nội dung bài viết */}
            <div 
                className="blog-content" 
                dangerouslySetInnerHTML={{ __html: processContent(post.content) }} 
            />
        </div>
    );
};

export default IntroPage;