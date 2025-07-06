# accounts/permissions.py
from rest_framework.permissions import BasePermission

class isManager(BasePermission):
    """
    Kiểm tra xem người dùng có phải là superuser HOẶC có thuộc về Group
    (Vai trò) có tên là 'Quản lý' hay không.
    """
    message = "Chỉ Quản lý hoặc Superuser mới có quyền thực hiện hành động này."

    def has_permission(self, request, view):
        # Bước 1: Đảm bảo user đã được xác thực
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Bước 2: Trả về True nếu một trong hai điều kiện được thỏa mãn
        # request.user.is_superuser: Kiểm tra xem có phải là superuser không
        # request.user.groups.filter(name='Quản lý').exists(): Kiểm tra có thuộc group "Quản lý" không
        return request.user.is_superuser or request.user.groups.filter(name='Quản lý').exists()

class isMedStaff(BasePermission):
    """
    Kiểm tra xem người dùng đã đăng nhập có thuộc về Group (Vai trò)
    có tên là 'Nhân viên y tế' hay không.
    """
    message = "Chỉ Nhân viên y tế mới có quyền thực hiện hành động này."

    def has_permission(self, request, view):
        # Bước 1: Đảm bảo user đã được xác thực
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Bước 2: Kiểm tra xem user có thuộc Group tên là 'Nhân viên y tế' không.
        return request.user.groups.filter(name='Nhân viên y tế').exists()

# (Tùy chọn) Một permission class tổng quát hơn để kiểm tra bất kỳ group nào
class IsInGroup(BasePermission):
    """
    Permission class để kiểm tra xem user có thuộc một hoặc nhiều group được chỉ định không.
    Sử dụng trong view:
    permission_classes = [IsAuthenticated, IsInGroup]
    required_groups = ['Quản lý', 'Bác sĩ cao cấp']
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Lấy danh sách các group yêu cầu từ view
        required_groups = getattr(view, 'required_groups', [])
        if not required_groups:
            # Nếu view không định nghĩa required_groups, mặc định là không cho phép
            # hoặc bạn có thể mặc định là cho phép (return True) tùy theo yêu cầu bảo mật.
            return False 
        
        user_groups = set(request.user.groups.values_list('name', flat=True))
        # Kiểm tra xem có bất kỳ group nào của user nằm trong danh sách các group yêu cầu không
        return bool(user_groups.intersection(required_groups))