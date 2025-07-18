# accounts/forms.py
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from .models import TaiKhoan

class TaiKhoanCreationForm(UserCreationForm):
    class Meta(UserCreationForm.Meta):
        model = TaiKhoan
        fields = ('ten_dang_nhap', 'email', 'ho_ten') # Các trường hiển thị khi tạo user trong Admin

class TaiKhoanChangeForm(UserChangeForm):
    class Meta(UserChangeForm.Meta):
        model = TaiKhoan
        fields = ('ten_dang_nhap', 'email', 'ho_ten', 'is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions') # Các trường hiển thị khi sửa user trong Admin