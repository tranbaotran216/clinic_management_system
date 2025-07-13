#frontend/urls.py
from django.urls import path, re_path # Thêm re_path
from .views import index

urlpatterns = [
    # Các path cũ của bạn
    path('', index),
    path('services', index),
    path('intro', index),
    path('login', index),
    path('register-appointment', index),
    path('unauthorized', index), # Thêm cho trang không có quyền

    # Path cho trang dashboard chính
    path('dashboard', index),

    # Catch-all cho tất cả các trang con của dashboard
    # Ví dụ: /dashboard/accounts, /dashboard/roles-permissions, /dashboard/medications/inventory
    # Dòng này sẽ bắt bất kỳ URL nào bắt đầu bằng 'dashboard/'
    re_path(r'^dashboard(?:/.*)?$', index),

    # Nếu có các route React khác không nằm trong danh sách trên, bạn cũng cần thêm chúng
    # Hoặc thêm một catch-all ở cuối cùng nếu tất cả các trang không khớp đều là React
    # re_path(r'^(?:.*)/?$', index) # Cẩn thận khi dùng catch-all này, nó có thể bắt cả các URL không mong muốn
]