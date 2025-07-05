# pages/urls.py

from django.urls import path
from . import views

app_name = 'pages'

urlpatterns = [
    # Trang chủ
    path('', views.index_view, name='index'),

    # Trang đăng nhập
    path('login/', views.login_view, name='login'),

    # Trang giới thiệu
    path('about/', views.about_view, name='about'), # Sửa 'intro/' thành 'about/' cho nhất quán

    # Trang dịch vụ
    path('services/', views.services_view, name='services'), # Đã xóa khoảng trắng thừa

    # Trang dashboard của admin
    path('admin/dashboard/', views.admin_dashboard_view, name='admin_dashboard'),
    
    # Trang quản lý tài khoản
    path('admin/accounts/', views.account_management_view, name='account_management'),
    
    # Bạn có thể thêm các URL khác ở đây nếu cần
    # Ví dụ: Trang thêm tài khoản
    path('admin/accounts/add/', views.add_account_view, name='add_account'),
    
    # Trang Phân quyền
    path('admin/groups/<int:group_id>/permissions/', views.permission_management_view, name='permission_management'), 
    # Trang quản lý quy định
    path('admin/regulations/', views.regulation_management_view, name='regulation_management'),
    
    #Trang thêm thuốc
    path('admin/medicines/add/', views.add_medicine_view, name='add_drugs'), 
    
    #Trang thêm loại bệnh
    path('admin/disease-types/add/', views.add_disease_type_view, name='add_disease_type'),
    
    # Trang Edit tiền thuốc
    path('admin/medicines/edit/<int:medicine_id>/', views.edit_medicine_view, name='edit_drugs'),
    
    # Trang Edit số lượng bệnh nhân
    path('admin/patient-numbers/edit/<int:patient_number_id>/', views.edit_patient_number_view, name='edit_patientnum'),
    
    # Trang reset mật khẩu
    path('admin/accounts/reset-password/<int:account_id>/', views.reset_password_view, name='reset_password'),

    # Trang đăng ký khám bệnh
    path('register/', views.register_view, name='register'),
    
    # Trang thêm cách dùng
    path('admin/medicines/add-usage/', views.add_usage_view, name='add_usage'),
    
    # Trang chỉnh sửa tài khoản
    path('admin/accounts/edit/<int:account_id>/', views.edit_account_view, name='edit_account'),
    
    # Trang danh sách khám bệnh
    path('admin/appointments/', views.appointment_management_view, name='examination_list'),
    
    # Trang dashboard nhân viên y tế
    path('staff/dashboard/', views.staff_dashboard_view, name='staff_dashboard'),
]