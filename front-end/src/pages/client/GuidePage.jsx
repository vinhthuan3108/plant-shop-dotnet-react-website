import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaArrowRight } from 'react-icons/fa';
import './BlogPage.css'; // QUAN TRỌNG: Dùng CSS của trang danh sách (Grid)
import { API_BASE } from '../../utils/apiConfig.jsx';
const GuidePage = () => {
    // Sửa thành mảng [] vì Hướng dẫn là danh sách nhiều bài
    const [posts, setPosts] = useState([]); 
    const [loading, setLoading] = useState(true);

    //const API_BASE = 'https://localhost:7298'; 

    useEffect(() => {
        const fetchGuidePosts = async () => {
            try {
                // 1. Lấy tất cả bài viết đã xuất bản
                const res = await axios.get(`${API_BASE}/api/TblPosts?status=Published`);
                
                // 2. Lọc ra những bài có danh mục chứa chữ "Hướng dẫn"
                const guidePosts = res.data.filter(p => 
                    p.categoryName && p.categoryName.toLowerCase().includes("hướng dẫn")
                );

                setPosts(guidePosts);
            } catch (error) {
                console.error("Lỗi tải bài hướng dẫn:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchGuidePosts();
    }, []);

    const getImageUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/400x250?text=No+Image';
        if (url.startsWith('http')) return url;
        return `${API_BASE}${url}`;
    };

    if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Đang tải dữ liệu...</div>;

    return (
        <div className="blog-container">
            {/* Header Trang Hướng Dẫn */}
            <div className="blog-header">
                <h2>GÓC HƯỚNG DẪN</h2>
                <div className="blog-divider"></div>
                <p>Tổng hợp các hướng dẫn mua hàng, thanh toán và chăm sóc cây</p>
            </div>

            {posts.length === 0 ? (
                <div style={{textAlign: 'center', padding: '50px'}}>
                    <p style={{color: '#666'}}>Chưa có bài hướng dẫn nào.</p>
                </div>
            ) : (
                // Hiển thị dạng lưới (Grid 3 cột)
                <div className="blog-grid">
                    {posts.map(post => (
                        <div key={post.postId} className="blog-card">
                            {/* Ảnh thumb */}
                            <Link to={`/blog/${post.postId}`} className="blog-thumb">
                                <img 
                                    src={getImageUrl(post.thumbnailUrl)} 
                                    alt={post.title} 
                                />
                            </Link>

                            {/* Nội dung tóm tắt */}
                            <div className="blog-content-wrap">
                                <div className="blog-meta">
                                    <span><FaCalendarAlt /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}</span>
                                    <span><FaUser /> {post.authorName || 'Admin'}</span>
                                </div>

                                <h3 className="blog-title">
                                    <Link to={`/blog/${post.postId}`}>
                                        {post.title}
                                    </Link>
                                </h3>

                                <p className="blog-desc">
                                    {post.shortDescription}
                                </p>

                                <Link to={`/blog/${post.postId}`} className="read-more-btn">
                                    XEM CHI TIẾT <FaArrowRight style={{fontSize: '12px'}}/>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GuidePage;