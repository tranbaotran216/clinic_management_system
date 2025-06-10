from rest_framework.permissions import BasePermission

class isManager(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user.vai_tro, 'ten_vai_tro', None) == 'manager'

class isMedStaff(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and getattr(request.user.vai_tro, 'ten_vai_tro', None) == 'med_staff'