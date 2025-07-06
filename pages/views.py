# pages/views.py

from django.shortcuts import render

# Create your views here.

def index_view(request):
    """
    View này sẽ render trang chủ (index.html).
    """
    return render(request, 'pages/index.html')

def login_view(request):
    """
    View này sẽ render trang đăng nhập (login.html).
    """
    return render(request, 'pages/login.html')

def about_view(request):
    """
    View này sẽ render trang giới thiệu (about.html).
    """
    return render(request, 'pages/about.html')

def account_management_view(request):
    """
    View này sẽ render trang quản lý tài khoản (account_management.html).
    """
    # Sau này, bạn có thể truyền dữ liệu từ database vào đây, ví dụ:
    # from accounts.models import TaiKhoan
    # all_accounts = TaiKhoan.objects.all()
    # context = {'accounts': all_accounts}
    # return render(request, 'pages/account_management.html', context)
    
    return render(request, 'pages/account_management.html')

def admin_dashboard_view(request):
    """
    View này sẽ render trang dashboard của admin (admin_dashboard.html).
    """
    return render(request, 'pages/admin_dashboard.html')

def services_view(request):
    """
    View này sẽ render trang dịch vụ (services.html).
    """
    return render(request, 'pages/services.html')

# BẠN CÓ THỂ THÊM CÁC HÀM VIEW KHÁC CHO CÁC TRANG CÒN LẠI TƯƠNG TỰ NHƯ TRÊN
# Ví dụ:
def add_account_view(request):
    return render(request, 'pages/add_account.html')

def permission_management_view(request, group_id):
    # Chúng ta chỉ cần truyền group_id vào template, JavaScript sẽ xử lý phần còn lại.
    return render(request, 'pages/permission_management.html', {'group_id': group_id})

def regulation_management_view(request):
    """
    View này sẽ render trang quản lý quy định (regulation_management.html).
    """
    return render(request, 'pages/regulation_management.html')

def add_medicine_view(request):
    """
    View này sẽ render trang thêm thuốc (add_medicine.html).
    """
    return render(request, 'pages/add_drugs.html')

def add_disease_type_view(request):
    """
    View này sẽ render trang thêm loại bệnh (add_disease_type.html).
    """
    return render(request, 'pages/add_disease_type.html')

def edit_medicine_view(request, medicine_id):
    """
    View này sẽ render trang chỉnh sửa thông tin thuốc (edit_medicine.html).
    """
    # Chúng ta có thể truyền medicine_id vào template để JavaScript xử lý.
    return render(request, 'pages/edit_medicine.html', {'medicine_id': medicine_id})

def edit_patient_number_view(request, patient_number_id):
    """
    View này sẽ render trang chỉnh sửa số lượng bệnh nhân (edit_patient_number.html).
    """
    # Chúng ta có thể truyền patient_number_id vào template để JavaScript xử lý.
    return render(request, 'pages/edit_patient_number.html', {'patient_number_id': patient_number_id})

def reset_password_view(request, account_id):
    """
    View này sẽ render trang reset mật khẩu (reset_password.html).
    """
    return render(request, 'pages/reset_password.html', {'account_id': account_id})

def register_view(request):
    """
    View này sẽ render trang đăng ký khám bệnh (register.html).
    """
    return render(request, 'pages/register.html')

def add_usage_view(request):
    """
    View này sẽ render trang thêm cách dùng thuốc (add_usage.html).
    """
    return render(request, 'pages/add_usage.html')

def edit_account_view(request, account_id):
    """
    View này sẽ render trang chỉnh sửa tài khoản (edit_account.html).
    """
    # Chúng ta có thể truyền account_id vào template để JavaScript xử lý.
    return render(request, 'pages/edit_account.html', {'account_id': account_id})

def appointment_management_view(request):

    return render(request, 'pages/examination_list.html')

def staff_dashboard_view(request):
    """
    View này sẽ render trang dashboard của nhân viên y tế (staff_dashboard.html).
    """
    return render(request, 'pages/staff_dashboard.html')