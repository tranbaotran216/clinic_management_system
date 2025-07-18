# clinic_management_system/urls.py
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView
from pages.views import home_page_view, about_page_view, services_page_view

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('accounts.urls')), 
    
    path('', home_page_view, name='home'),
    path('about/', about_page_view, name='about'),
    path('services/', services_page_view, name='services'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    
urlpatterns.append(re_path(r'^(?!api/|admin/).*$', TemplateView.as_view(template_name='frontend/index.html'))),
