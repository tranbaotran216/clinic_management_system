# clinic_management_system/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    # CHỈ GIỮ LẠI 2 DÒNG NÀY
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')), 
]

# Các dòng dưới này có thể giữ lại hoặc xóa đi, nó không ảnh hưởng trên Vercel
# if settings.DEBUG:
#     urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)