from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # Các view xác thực và nghiệp vụ cơ bản
    RegisterView,
    LoginView,
    CurrentUserDetailView,
    DashboardSummaryView,
    
    # Các ViewSet
    UserViewSet,
    GroupViewSet, # <<<< THAY THẾ CustomVaiTroViewSet BẰNG GroupViewSet
    PermissionViewSet
)

# Tạo một router để tự động tạo các URL cho ViewSets
router = DefaultRouter()

# Đăng ký các ViewSet vào router
# URL sẽ là /api/users/ (ví dụ)
router.register(r'users', UserViewSet, basename='user') 

# URL sẽ là /api/groups/ (ví dụ)
# Đây là endpoint để CRUD "Vai trò", giờ sẽ làm việc với Django Group
router.register(r'groups', GroupViewSet, basename='group') 

# URL sẽ là /api/permissions/ (ví dụ)
router.register(r'permissions', PermissionViewSet, basename='permission')

# --- DANH SÁCH URL CỦA APP ACCOUNTS ---
urlpatterns = [
    # URLs cho các API đơn lẻ (Class-Based Views không thuộc ViewSet)
    # URL cuối cùng sẽ là /api/auth/register/ (ví dụ)
    path('auth/register/', RegisterView.as_view(), name='auth_register'),
    
    # URL cuối cùng sẽ là /api/login/
    path('login/', LoginView.as_view(), name='auth_login'), # Giữ lại nếu bạn có logic đặc biệt, hoặc để SimpleJWT xử lý

    # URL cuối cùng sẽ là /api/auth/me/
    path('auth/me/', CurrentUserDetailView.as_view(), name='current_user_details'),
    
    # URL cuối cùng sẽ là /api/dashboard/summary/
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),

    # Bao gồm tất cả các URL được tạo tự động bởi router
    # Điều này sẽ tạo ra các URL như:
    # /users/, /users/{pk}/
    # /users/{pk}/assign-groups/
    # /groups/, /groups/{pk}/
    # /groups/{pk}/permissions/, /groups/{pk}/assign-permissions/
    # /permissions/
    path('', include(router.urls)),
]