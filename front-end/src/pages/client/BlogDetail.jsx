import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaTag, FaArrowLeft } from 'react-icons/fa';
import './BlogDetail.css';
const BlogDetail = () => {
    const { id } = useParams(); // Lấy ID từ URL
    const [post, setPost] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE = 'https://localhost:7298';

    useEffect(() => {
        const fetchPostDetail = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblPosts/${id}`);
                setPost(res.data);
            } catch (error) {
                console.error("Lỗi tải chi tiết bài viết:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPostDetail();
    }, [id]);

    if (loading) return <div className="container" style={{padding: '50px'}}>Đang tải...</div>;
    if (!post) return <div className="container" style={{padding: '50px'}}>Không tìm thấy bài viết.</div>;
    const processContent = (content) => {
        if (!content) return "";
        return content.replace(/&nbsp;/g, ' '); 
    };
    return (
        <div className="container" style={{ padding: '40px 15px', maxWidth: '900px', margin: '0 auto' }}>
            <Link to="/blog" style={{ display: 'flex', alignItems: 'center', gap: '5px', textDecoration: 'none', color: '#666', marginBottom: '20px' }}>
                <FaArrowLeft /> Quay lại danh sách
            </Link>

            <h1 style={{ color: '#333', fontSize: '2rem', marginBottom: '15px' }}>{post.title}</h1>

            <div style={{ display: 'flex', gap: '20px', color: '#888', fontSize: '14px', marginBottom: '30px', borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                <span><FaCalendarAlt /> {new Date(post.publishedAt || post.createdAt).toLocaleDateString('vi-VN')}</span>
                <span><FaUser /> {post.authorName || 'Admin'}</span>
                {post.categoryName && <span><FaTag /> {post.categoryName}</span>}
            </div>

            {/* Hiển thị nội dung HTML (CKEditor thường lưu dạng HTML) */}
            <div 
                className="blog-content" 
                dangerouslySetInnerHTML={{ __html: processContent(post.content) }} 
                style={{ lineHeight: '1.8', fontSize: '16px', color: '#333' }}
            />
            
            <div style={{marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '20px'}}>
                <strong>Tags: </strong> {post.tags || "Không có tag"}
            </div>
        </div>
    );
};

export default BlogDetail;