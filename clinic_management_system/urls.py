# clinic_management_system/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from frontend.views import index as react_app_view # Import view của React

urlpatterns = [
    # --- ƯU TIÊN 1: API ---
    # Tất cả các request tới /api/... sẽ được xử lý bởi app 'accounts'.
    path('api/', include('accounts.urls')),

    # --- ƯU TIÊN 2: DJANGO ADMIN GỐC ---
    # Request tới /admin/... sẽ vào trang admin mặc định của Django.
    path('admin/', admin.site.urls),

    # --- ƯU TIÊN 3: CÁC TRANG QUẢN TRỊ CỦA REACT ---
    # Chúng ta bắt các URL cụ thể của dashboard và trỏ chúng về ứng dụng React.
    # Dấu * ở cuối để bắt cả các URL con (ví dụ: /dashboard/accounts/add).
    path('dashboard/', react_app_view, name='dashboard_base'), # Bắt /dashboard
    path('dashboard/<path:subpath>', react_app_view), # Bắt tất cả các URL con của dashboard

    # --- ƯU TIÊN 4: CÁC TRANG TĨNH CÔNG KHAI ---
    # Tất cả các request còn lại sẽ được xử lý bởi app 'pages'.
    # Dòng này phải đặt ở CUỐI CÙNG.
    path('', include('pages.urls')),
]