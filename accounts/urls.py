from django.urls import path
from .views import RegisterView, LoginView

# nếu muốn nhiều /link/ trỏ tới cùng 1 trang thì thêm path('', function name here)
urlpatterns = [
    path('them-tai-khoan/', RegisterView.as_view()), # point to the function & do whatever it's said in the function
    path('login/', LoginView.as_view())
]
