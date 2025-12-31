import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { FaCalendarAlt, FaUser, FaTag, FaArrowLeft } from 'react-icons/fa';
import './BlogDetail.css';

const BlogDetail = () => {
    const { id } = useParams();
    const [post, setPost] = useState(null);
    // 1. Thêm state cho bài viết liên quan
    const [relatedPosts, setRelatedPosts] = useState([]); 
    const [loading, setLoading] = useState(true);

    const API_BASE = 'https://localhost:7298';

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // 2. Gọi API lấy chi tiết bài viết
                const res = await axios.get(`${API_BASE}/api/TblPosts/${id}`); 
                setPost(res.data);

                // 3. Gọi API lấy bài viết liên quan (MỚI)
                const relatedRes = await axios.get(`${API_BASE}/api/TblPosts/related/${id}`);
                setRelatedPosts(relatedRes.data);

            } catch (error) {
                console.error("Lỗi tải dữ liệu blog:", error);
            } finally {
                setLoading(false);
                // Cuộn lên đầu trang khi chuyển bài viết
                window.scrollTo(0, 0);
            }
        };

        fetchData();
    }, [id]);

    const getImageUrl = (url) => {
        if (!url) return 'https://via.placeholder.com/400x250?text=No+Image';
        if (url.startsWith('http')) return url;
        return `${API_BASE}${url}`;
    };

    const processContent = (content) => {
        if (!content) return "";
        return content.replace(/&nbsp;/g, ' ');
    };

    if (loading) return <div className="container" style={{ padding: '50px' }}>Đang tải...</div>;
    if (!post) return <div className="container" style={{ padding: '50px' }}>Không tìm thấy bài viết.</div>;

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

            <div
                className="blog-content"
                dangerouslySetInnerHTML={{ __html: processContent(post.content) }}
                style={{ lineHeight: '1.8', fontSize: '16px', color: '#333' }}
            />

            <div style={{ marginTop: '50px', borderTop: '1px solid #eee', paddingTop: '20px' }}>
                <strong>Tags: </strong> {post.tags || "Không có tag"}
            </div>

            {/* --- 4. PHẦN HIỂN THỊ BÀI VIẾT LIÊN QUAN (MỚI) --- */}
            {relatedPosts.length > 0 && (
                <div style={{ marginTop: '60px' }}>
                    <h3 style={{ borderLeft: '4px solid #2e7d32', paddingLeft: '10px', marginBottom: '20px', color: '#333' }}>
                        BÀI VIẾT LIÊN QUAN
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                        {relatedPosts.map(p => (
                            <Link to={`/blog/${p.postId}`} key={p.postId} style={{ textDecoration: 'none', color: 'inherit' }}>
                                <div style={{ border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', transition: 'transform 0.2s' }}
                                     onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'}
                                     onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <div style={{ height: '160px', overflow: 'hidden' }}>
                                        <img 
                                            src={getImageUrl(p.thumbnailUrl)} 
                                            alt={p.title} 
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                    </div>
                                    <div style={{ padding: '15px', flex: 1, display:'flex', flexDirection:'column' }}>
                                        <h4 style={{ fontSize: '16px', margin: '0 0 10px 0', lineHeight: '1.4', color: '#333' }}>{p.title}</h4>
                                        <span style={{ fontSize: '12px', color: '#888', marginTop: 'auto' }}>
                                            {new Date(p.publishedAt || p.createdAt).toLocaleDateString('vi-VN')}
                                        </span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogDetail;