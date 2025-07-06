from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    # --- Views/ViewSets bạn đã có ---
   # RegisterView,
    LoginView,
    CurrentUserDetailView,
    DashboardSummaryView,
    UserViewSet, # Đã đổi tên từ TaiKhoanViewSet trong views.py
    GroupViewSet,
    PermissionViewSet,
    LoaiBenhViewSet,
    DonViTinhViewSet,
    CachDungViewSet,
    
    # --- ViewSets MỚI cần import ---
    ThuocViewSet,
    QuyDinhValueViewSet,
    BenhNhanViewSet,
    DSKhamViewSet,
    PKBViewSet,
    HoaDonViewSet,
    PublicAppointmentView,
    
    # --- APIViews MỚI cho Báo cáo ---
    MedicationUsageReportView,
    RevenueReportView
)

# Tạo một router để tự động tạo các URL cho ViewSets
router = DefaultRouter()

# --- Đăng ký các ViewSet đã có ---
router.register(r'users', UserViewSet, basename='user') 
router.register(r'groups', GroupViewSet, basename='group') 
router.register(r'permissions', PermissionViewSet, basename='permission')

# --- Đăng ký các ViewSet cho Danh mục (Quản lý Quy định) ---
router.register(r'loai-benh', LoaiBenhViewSet, basename='loaibenh') # Giữ tên tiếng Việt có dấu hoặc đổi sang không dấu
router.register(r'don-vi-tinh', DonViTinhViewSet, basename='donvitinh')
router.register(r'cach-dung', CachDungViewSet, basename='cachdung')
router.register(r'thuoc', ThuocViewSet, basename='thuoc')

# --- Đăng ký ViewSet cho QuyDinhValue (Quản lý Quy định) ---
router.register(r'quy-dinh-value', QuyDinhValueViewSet, basename='quydinhvalue')

# --- Đăng ký ViewSets cho Nghiệp vụ Khám Bệnh ---
router.register(r'benh-nhan', BenhNhanViewSet, basename='benhnhan')
router.register(r'ds-kham', DSKhamViewSet, basename='dskham') # Danh sách chờ khám
router.register(r'pkb', PKBViewSet, basename='pkb') # Phiếu khám bệnh
router.register(r'hoa-don', HoaDonViewSet, basename='hoadon')


# --- DANH SÁCH URL CỦA APP ACCOUNTS ---
urlpatterns = [
  # URLs cho các API đơn lẻ (Class-Based Views không thuộc ViewSet)
  #  path('auth/register/', RegisterView.as_view(), name='auth_register'),
    path('login/', LoginView.as_view(), name='auth_login'),
    path('auth/me/', CurrentUserDetailView.as_view(), name='current_user_details'),
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard_summary'),

    # URLs cho các API Báo cáo
    path('reports/medication-usage/', MedicationUsageReportView.as_view(), name='report_medication_usage'),
    path('reports/revenue/', RevenueReportView.as_view(), name='report_revenue'),

    # Bao gồm tất cả các URL được tạo tự động bởi router
    # Bạn chỉ cần include router một lần.
    # Nếu file urls.py này được include trong project urls.py với prefix 'api/',
    # thì các URL của router sẽ tự động có prefix đó.
    # Ví dụ: /api/users/, /api/groups/
    path('', include(router.urls)), # Giữ lại dòng này là đủ nếu project urls.py đã có prefix 'api/'
    # Bỏ dòng path('api/', include(router.urls)), vì nó sẽ tạo ra /api/api/users/ (lặp prefix)
    path('register-appointment/', PublicAppointmentView.as_view(), name='register-appointment' )

]