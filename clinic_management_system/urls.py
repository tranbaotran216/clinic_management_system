# clinic_management_system/urls.py

from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
# Import trực tiếp các view từ app 'pages'
from pages.views import home_page_view, about_page_view, services_page_view

urlpatterns = [
    # === ƯU TIÊN 1: CÁC ENDPOINT CỤ THỂ (API & ADMIN) ===
    # Các URL này được khớp trước tiên.
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')), 
    
    # === ƯU TIÊN 2: CÁC TRANG TĨNH CỦA DJANGO ===
    # Định nghĩa tường minh các trang do Django render.
    # Không dùng include() để tránh xung đột.
    path('', home_page_view, name='home'),
    path('about/', about_page_view, name='about'),
    path('services/', services_page_view, name='services'),

    # === ƯU TIÊN 3 (CUỐI CÙNG): "BẮT TẤT CẢ" CHO REACT ===
    # Bất kỳ URL nào không khớp với các mẫu ở trên sẽ được giao cho React xử lý.
    # Django chỉ cần render file HTML vỏ, React sẽ đọc URL và hiển thị component tương ứng.
    re_path(r'^(?!api/|admin/).*$', TemplateView.as_view(template_name='frontend/index.html')),
]