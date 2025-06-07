from rest_framework.permissions import BasePermission

# xác thực danh tính thành công thì is_authenticated = True
class isManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.vai_tro == 'manager'
    
class isMedStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.vai_tro == 'med_staff'
    