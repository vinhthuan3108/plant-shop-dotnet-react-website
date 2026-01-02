import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PostModal from '../../components/admin/PostModal';
import axios from 'axios';
import { API_BASE } from '../../utils/apiConfig.jsx';
const AdminPosts = () => {
    // --- STATE QUẢN LÝ DỮ LIỆU ---
    const [posts, setPosts] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState(null);
    
    // --- STATE PHÂN TRANG (MỚI) ---
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // Số lượng hiển thị mỗi trang

    //const API_BASE = 'https://localhost:7298';
    const navigate = useNavigate();

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
            } catch (error) { 
                alert("Lỗi khi xóa vĩnh viễn!");
            }
        }
    };

    useEffect(() => { fetchPosts(); }, []);

    // --- LOGIC PHÂN TRANG ---
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = posts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(posts.length / itemsPerPage);
    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="admin-posts-container" style={{ padding: '20px', backgroundColor: '#f5f7fb', minHeight: '100vh' }}>
            <h2 style={{color: '#4e73df', marginBottom: '20px'}}>Quản lý bài viết</h2>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                <button 
                    onClick={() => { setSelectedPost(null); setIsModalOpen(true); }}
                    style={{ padding: '10px 20px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    + Viết bài mới
                </button>

                <button 
                    onClick={() => navigate('/admin/post-categories')} 
                    style={{ padding: '10px 20px', background: '#17a2b8', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    📁 Quản lý Danh mục 
                </button>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                    <thead style={{ backgroundColor: '#f1f3f5', borderBottom: '2px solid #ddd' }}>
                        <tr>
                            {/* CỘT STT MỚI */}
                            <th style={{ padding: '12px', textAlign: 'center', width: '50px' }}>STT</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Hình ảnh</th>
                            <th style={{ padding: '12px', textAlign: 'left' }}>Tiêu đề</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Tác giả</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Danh mục</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Ngày đăng</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Trạng thái</th>
                            <th style={{ padding: '12px', textAlign: 'center' }}>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentItems.length > 0 ? currentItems.map((post, index) => {
                             // TÍNH TOÁN STT
                             const stt = (currentPage - 1) * itemsPerPage + index + 1;
                             
                             return (
                                <tr key={post.postId} style={{ borderBottom: '1px solid #eee', backgroundColor: index % 2 === 0 ? 'white' : '#f9f9f9' }}>
                                    {/* HIỂN THỊ STT */}
                                    <td style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>{stt}</td>
                                    
                                    <td style={{ textAlign: 'center', padding: '12px' }}>
                                        <img src={`${API_BASE}${post.thumbnailUrl}`} width="60" height="40" style={{ objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} alt="" />
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: 'bold', maxWidth: '300px', color: '#333' }}>{post.title}</div>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center', color: '#666' }}>{post.authorName}</td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        <span style={{ backgroundColor: '#e3e6f0', padding: '3px 8px', borderRadius: '12px', fontSize: '12px', color: '#5a5c69' }}>
                                            {post.categoryName}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center', fontSize: '13px' }}>
                                        {post.createdAt ? new Date(post.createdAt).toLocaleDateString('vi-VN') : '---'}
                                    </td>
                                    <td style={{ textAlign: 'center', padding: '12px' }}>
                                        {(post.isDeleted || post.IsDeleted) ? (
                                            <span style={{ color: '#e74a3b', fontWeight: 'bold', fontSize:'12px' }}>● Ngừng hoạt động</span>
                                        ) : (
                                            <span style={{ color: '#1cc88a', fontWeight: 'bold', fontSize:'12px' }}>● Đang hoạt động</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {/* NÚT SỬA (STYLE MỚI) */}
                                        <button 
                                            onClick={() => { setSelectedPost(post); setIsModalOpen(true); }}
                                            style={{ marginRight: '8px', cursor: 'pointer', background:'transparent', color:'#4e73df', border:'1px solid #4e73df', padding:'5px 10px', borderRadius:'4px', fontSize:'12px' }}
                                        >
                                            Sửa
                                        </button>
                                        {/* NÚT XÓA (STYLE MỚI) */}
                                        <button 
                                            onClick={() => handleHardDelete(post.postId)}
                                            style={{ cursor: 'pointer', background:'transparent', color:'#e74a3b', border:'1px solid #e74a3b', padding:'5px 10px', borderRadius:'4px', fontSize:'12px' }}
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            );
                        }) : (
                            <tr><td colSpan="8" style={{textAlign:'center', padding:'30px', color:'#888'}}>Không tìm thấy bài viết nào.</td></tr>
                        )}
                    </tbody>
                </table>

                {/* --- THANH PHÂN TRANG UI (Copy từ AdminProduct) --- */}
                {posts.length > itemsPerPage && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 0', gap: '5px', borderTop: '1px solid #eee' }}>
                        
                        {/* NHÓM NÚT TRÁI */}
                        {currentPage > 1 && (
                            <>
                                <button 
                                    onClick={() => paginate(1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}
                                    title="Về trang đầu"
                                >
                                    &#171; Đầu
                                </button>
                                <button 
                                    onClick={() => paginate(currentPage - 1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
                                >
                                    &lsaquo; Trước
                                </button>
                            </>
                        )}

                        {/* DANH SÁCH SỐ TRANG */}
                        {(() => {
                            let startPage, endPage;
                            if (totalPages <= 10) {
                                startPage = 1;
                                endPage = totalPages;
                            } else {
                                if (currentPage <= 6) {
                                    startPage = 1;
                                    endPage = 10;
                                } else if (currentPage + 4 >= totalPages) {
                                    startPage = totalPages - 9;
                                    endPage = totalPages;
                                } else {
                                    startPage = currentPage - 5;
                                    endPage = currentPage + 4;
                                }
                            }
                            const pages = [];
                            for (let i = startPage; i <= endPage; i++) {
                                pages.push(i);
                            }
                            return pages.map(number => (
                                <button 
                                    key={number} 
                                    onClick={() => paginate(number)}
                                    style={{ 
                                        padding: '6px 12px', 
                                        border: '1px solid #ddd', 
                                        background: currentPage === number ? '#4e73df' : 'white', 
                                        color: currentPage === number ? 'white' : '#333',
                                        cursor: 'pointer', 
                                        borderRadius: '4px',
                                        fontWeight: currentPage === number ? 'bold' : 'normal',
                                        fontSize: '13px',
                                        minWidth: '32px'
                                    }}
                                >
                                    {number}
                                </button>
                            ));
                        })()}

                        {/* NHÓM NÚT PHẢI */}
                        {currentPage < totalPages && (
                            <>
                                <button 
                                    onClick={() => paginate(currentPage + 1)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px' }}
                                >
                                    Sau &rsaquo;
                                </button>
                                <button 
                                    onClick={() => paginate(totalPages)} 
                                    style={{ padding: '6px 12px', border: '1px solid #ddd', background: 'white', cursor: 'pointer', borderRadius: '4px', fontSize: '13px', color: '#4e73df', fontWeight: 'bold' }}
                                    title="Đến trang cuối"
                                >
                                    Cuối &#187;
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

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