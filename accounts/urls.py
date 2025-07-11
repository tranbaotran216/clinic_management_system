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
    RevenueReportView,
    
    # --- Views cho Reset Password ---
    PasswordResetRequestView
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

# --- DANH SÁCH URL CỦA APP ACCOUNTS (ĐÃ SẮP XẾP LẠI) ---
urlpatterns = [
    # --- Nhóm API xác thực & người dùng ---
    path('auth/login/', LoginView.as_view(), name='login'), # Đổi tên cho gọn
    path('auth/me/', CurrentUserDetailView.as_view(), name='current-user'),
    path('auth/password-reset/request/', PasswordResetRequestView.as_view(), name='password-reset-request'),
    # ================== SỬA LỖI TẠI ĐÂY ==================
    # Thêm <str:uidb64> để nhận UID từ URL mà frontend gửi lên

    # =======================================================

    # --- Nhóm API công khai ---
    path('public/register-appointment/', PublicAppointmentView.as_view(), name='public-register-appointment' ),

    # --- Nhóm API cho Dashboard & Báo cáo ---
    path('dashboard/summary/', DashboardSummaryView.as_view(), name='dashboard-summary'),
    path('reports/medication-usage/', MedicationUsageReportView.as_view(), name='report-medication-usage'),
    path('reports/revenue/', RevenueReportView.as_view(), name='report-revenue'),

    # --- Bao gồm tất cả các URL từ router ở cuối cùng ---
    path('', include(router.urls)),
]