import React, { useState, useMemo, useRef, useEffect } from 'react';
import ReactQuill from 'react-quill-new'; 
import 'react-quill-new/dist/quill.snow.css';
import axios from 'axios';

const PostModal = ({ post, onClose, onSuccess }) => {
    const quillRef = useRef(null);
    const API_BASE = 'https://localhost:7298';

    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);
    const [shortDescription, setShortDescription] = useState('');
    const [isActive, setIsActive] = useState(true); // Thêm state cho checkbox Hoạt động

    // 1. Lấy danh mục
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await axios.get(`${API_BASE}/api/TblPostCategories`);
                setCategories(res.data);
            } catch (err) { console.error("Lỗi lấy danh mục:", err); }
        };
        fetchCategories();
    }, []);

    // 2. Đồng bộ dữ liệu khi Sửa/Thêm mới
    useEffect(() => {
        if (post) {
            setTitle(post.title || '');
            setContent(post.content || '');
            setThumbnailUrl(post.thumbnailUrl || '');
            setCategoryId(post.postCategoryId?.toString() || '');
            setShortDescription(post.shortDescription || '');
            // Nếu isDeleted = true thì isActive = false
            setIsActive(!(post.isDeleted || post.IsDeleted)); 
        } else {
            setTitle(''); setContent(''); setThumbnailUrl(''); setCategoryId(''); setShortDescription('');
            setIsActive(true); // Mặc định thêm mới là đang hoạt động
        }
    }, [post]);

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const res = await axios.post(`${API_BASE}/api/Upload/posts`, formData);
        return res.data.url;
    };

    const imageHandler = () => {
        const input = document.createElement('input');
        input.setAttribute('type', 'file');
        input.setAttribute('accept', 'image/*');
        input.click();
        input.onchange = async () => {
            const file = input.files[0];
            if (file) {
                const url = await uploadFile(file);
                const quill = quillRef.current.getEditor();
                const range = quill.getSelection();
                quill.insertEmbed(range.index, 'image', `${API_BASE}${url}`);
            }
        };
    };

    const modules = useMemo(() => ({
        toolbar: {
            container: [
                [{ 'header': [1, 2, 3, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'list': 'ordered' }, { 'list': 'bullet' }],
                ['image', 'link', 'video'],
                ['clean']
            ],
            handlers: { image: imageHandler }
        }
    }), []);

    const handleSubmit = async () => {
        if (!title || !categoryId) return alert("Vui lòng nhập đầy đủ thông tin!");

        // 1. Lấy Token từ localStorage (Kiểm tra xem lúc login bạn lưu tên là 'token' hay gì nhé)
        const token = localStorage.getItem('token'); 
        
        if (!token) {
            alert("Bạn chưa đăng nhập hoặc phiên đăng nhập đã hết hạn!");
            return;
        }

        // 2. Tạo Header chứa Token
        const config = {
            headers: {
                Authorization: `Bearer ${token}` // Quan trọng: Phải có chữ Bearer và khoảng trắng
            }
        };

        const payload = {
            postId: post?.postId,
            title,
            shortDescription,
            content,
            thumbnailUrl,
            postCategoryId: parseInt(categoryId),
            status: 'Published',
            isDeleted: !isActive 
        };

        try {
            if (post?.postId) {
                // Sửa bài viết (PUT) -> truyền config vào tham số thứ 3
                await axios.put(`${API_BASE}/api/TblPosts/${post.postId}`, payload, config);
            } else {
                // Thêm mới (POST) -> truyền config vào tham số thứ 3
                await axios.post(`${API_BASE}/api/TblPosts`, payload, config);
            }
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 401) {
                alert("Hết phiên đăng nhập, vui lòng đăng nhập lại!");
            } else {
                alert("Lỗi khi lưu bài viết!");
            }
        }
    };

    return (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
            <div className="modal-content post-modal" style={{ backgroundColor: 'white', padding: '25px', borderRadius: '8px', width: '80%', maxHeight: '90vh', overflowY: 'auto' }}>
                <h3>{post ? "Chỉnh sửa bài viết" : "Thêm bài viết mới"}</h3>
                
                <input className="form-control" placeholder="Tiêu đề" value={title} onChange={e => setTitle(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />
                <textarea className="form-control" placeholder="Mô tả ngắn" value={shortDescription} onChange={e => setShortDescription(e.target.value)} style={{ width: '100%', marginBottom: '10px', padding: '8px' }} />

                <div className="row" style={{ display: 'flex', gap: '20px', marginBottom: '15px' }}>
                    <div className="col" style={{ flex: 1 }}>
                        <label>Danh mục:</label>
                        <select className="form-control" value={categoryId} onChange={e => setCategoryId(e.target.value)} style={{ width: '100%', padding: '8px' }}>
                            <option value="">-- Chọn danh mục --</option>
                            {categories.map(cat => (
                                <option key={cat.postCategoryId} value={cat.postCategoryId}>{cat.categoryName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col" style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{ fontWeight: 'bold', cursor: 'pointer' }}>
                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} /> Hoạt động
                        </label>
                    </div>
                    <div className="col" style={{ flex: 1 }}>
                        <label>Ảnh đại diện:</label>
                        <input type="file" onChange={async (e) => setThumbnailUrl(await uploadFile(e.target.files[0]))} />
                        {thumbnailUrl && <img src={`${API_BASE}${thumbnailUrl}`} className="preview-img" style={{ width: '100px', marginTop: '10px' }} alt="Thumb" />}
                    </div>
                </div>

                <div className="editor-wrapper" style={{ marginBottom: '50px' }}>
                    <ReactQuill ref={quillRef} theme="snow" value={content} onChange={setContent} modules={modules} style={{ height: '300px' }} />
                </div>
                
                <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                    <button onClick={onClose} style={{ padding: '8px 15px', backgroundColor: '#ccc', border: 'none', borderRadius: '4px' }}>Hủy bỏ</button>
                    <button onClick={handleSubmit} style={{ padding: '8px 15px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px' }}>Lưu bài viết</button>
                </div>
            </div>
        </div>
    );
};

export default PostModal;