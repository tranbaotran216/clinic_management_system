from django.urls import path
from .views import index

urlpatterns = [
    path('', index),
    path('services', index),
    path('intro', index)
]
