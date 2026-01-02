import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaArrowRight } from 'react-icons/fa';
import './BlogPage.css'; // <--- Nhớ import file CSS vừa tạo
import { API_BASE } from '../../utils/apiConfig.jsx';
const BlogPage = () => {
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    //const API_BASE = 'https://localhost:7298'; 

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblPosts?status=Published`);
                
                // --- BỔ SUNG LỌC DỮ LIỆU TẠI ĐÂY ---
                // Chỉ lấy những bài KHÔNG PHẢI là Giới thiệu hoặc Hướng dẫn
                const newsPosts = res.data.filter(p => {
                    const catName = p.categoryName ? p.categoryName.toLowerCase() : "";
                    return !catName.includes("giới thiệu") && !catName.includes("hướng dẫn");
                });
                
                setPosts(newsPosts);
                // ------------------------------------
                
            } catch (error) {
                console.error("Lỗi tải bài viết:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPosts();
    }, []);

    const getImageUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/400x250?text=No+Image';
        if (url.startsWith('http')) return url;
        return `${API_BASE}${url}`;
    };

    if (loading) return <div style={{textAlign: 'center', padding: '50px'}}>Đang tải bài viết...</div>;

    return (
        <div className="blog-container">
            {/* Header */}
            <div className="blog-header">
                <h2>Bài viết & Tin tức</h2>
                <div className="blog-divider"></div>
                <p>Chia sẻ kiến thức và kinh nghiệm chăm sóc cây cảnh</p>
            </div>

            {posts.length === 0 ? (
                <p style={{textAlign: 'center', color: '#666'}}>Chưa có bài viết nào.</p>
            ) : (
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

                            {/* Nội dung */}
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
                                    ĐỌC THÊM <FaArrowRight style={{fontSize: '12px'}}/>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default BlogPage;