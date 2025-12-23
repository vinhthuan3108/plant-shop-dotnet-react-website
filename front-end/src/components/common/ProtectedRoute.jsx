import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRoles }) => {
  // Lấy user từ localStorage (hoặc nơi bạn lưu state đăng nhập)
  const user = JSON.parse(localStorage.getItem('user'));

  // 1. Chưa đăng nhập -> Về trang Login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Có đăng nhập nhưng sai quyền -> Về trang chủ hoặc trang báo lỗi 403
  if (allowedRoles && !allowedRoles.includes(user.roleId)) {
    // Có thể thay bằng trang <AccessDenied /> nếu muốn
    alert("Bạn không có quyền truy cập trang này!");
    return <Navigate to="/" replace />; 
  }

  // 3. Hợp lệ -> Cho đi tiếp
  return <Outlet />;
};

export default ProtectedRoute;