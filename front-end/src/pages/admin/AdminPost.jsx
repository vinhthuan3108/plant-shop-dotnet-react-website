import React, { useState, useEffect } from 'react';
import PostModal from '../../components/admin/PostModal';
import axios from 'axios';

const AdminPosts = () => {
    const [posts, setPosts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    const API_BASE = 'https://localhost:7298';

    const fetchPosts = async () => {
        try {
            const res = await axios.get(`${API_BASE}/api/TblPosts`);
            setPosts(res.data);
        } catch (error) { 
            console.error("Lỗi tải bài viết:", error); 
        }
    };

    const handleHardDelete = async (id) => {
        if (window.confirm("CẢNH BÁO: Bài viết sẽ bị xóa vĩnh viễn khỏi Database!")) {
            try {
                await axios.delete(`${API_BASE}/api/TblPosts/hard/${id}`);
                fetchPosts();
            } catch (error) { alert("Lỗi khi xóa vĩnh viễn!"); }
        }
    };

    useEffect(() => { fetchPosts(); }, []);

    return (
        <div className="admin-posts-container" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2>Quản lý bài viết</h2>
                <button 
                    onClick={() => { setSelectedPost(null); setIsModalOpen(true); }}
                    style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    + Viết bài mới
                </button>
            </div>

            <table border="1" style={{ width: '100%', borderCollapse: 'collapse', borderColor: '#ddd' }}>
                <thead>
                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                        <th style={{ padding: '12px' }}>Hình ảnh</th>
                        <th style={{ padding: '12px' }}>Tiêu đề</th>
                        <th style={{ padding: '12px' }}>Tác giả</th>
                        <th style={{ padding: '12px' }}>Danh mục</th>
                        <th style={{ padding: '12px' }}>Ngày đăng</th>
                        <th style={{ padding: '12px' }}>Trạng thái</th>
                        <th style={{ padding: '12px' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {posts.map(post => (
                        <tr key={post.postId}>
                            <td style={{ textAlign: 'center', padding: '10px' }}>
                                <img src={`${API_BASE}${post.thumbnailUrl}`} width="60" height="40" style={{ objectFit: 'cover', borderRadius: '4px' }} alt="" />
                            </td>
                            <td style={{ padding: '10px' }}>
                                <div style={{ fontWeight: 'bold', maxWidth: '250px' }}>{post.title}</div>
                            </td>
                            {/* THÊM TÁC GIẢ */}
                            <td style={{ padding: '10px', textAlign: 'center' }}>{post.authorName}</td>
                            {/* THÊM DANH MỤC */}
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                <span style={{ backgroundColor: '#eee', padding: '2px 8px', borderRadius: '4px', fontSize: '13px' }}>
                                    {post.categoryName}
                                </span>
                            </td>
                            {/* THÊM NGÀY ĐĂNG */}
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : '---'}
                            </td>
                            <td style={{ textAlign: 'center', padding: '10px' }}>
                                {(post.isDeleted || post.IsDeleted) ? (
                                    <span style={{ color: '#dc3545', fontWeight: 'bold' }}>Ngừng hoạt động</span>
                                ) : (
                                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>Đang hoạt động</span>
                                )}
                            </td>
                            <td style={{ padding: '10px', textAlign: 'center' }}>
                                <button 
                                    onClick={() => { setSelectedPost(post); setIsModalOpen(true); }}
                                    style={{ marginRight: '8px', padding: '5px 12px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Sửa
                                </button>
                                <button 
                                    onClick={() => handleHardDelete(post.postId)}
                                    style={{ padding: '5px 12px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                >
                                    Xóa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isModalOpen && (
                <PostModal 
                    key={selectedPost?.postId || 'new'} 
                    post={selectedPost} 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={fetchPosts}
                />
            )}
        </div>
    );
};

export default AdminPosts;