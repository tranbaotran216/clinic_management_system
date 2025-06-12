from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import Group as DjangoGroup

from .models import (
    TaiKhoan, 
    # VaiTro, # Không cần nữa vì đã chuyển sang Django Group
    BenhNhan, DSKham, PKB, ChiTietPKB, 
    LoaiBenh, Thuoc, DonViTinh, HoaDon, CachDung
)
from .forms import TaiKhoanChangeForm, TaiKhoanCreationForm # Sẽ tạo các form này để Admin đẹp hơn

# Unregister model Group mặc định để đăng ký lại với filter_horizontal
# Điều này giúp giao diện chọn quyền cho Group đẹp hơn (giống hình bạn gửi)
# Nếu bạn không unregister, bạn sẽ thấy 2 mục "Groups" trong admin
try:
    admin.site.unregister(DjangoGroup)
except admin.sites.NotRegistered:
    pass

@admin.register(DjangoGroup)
class CustomGroupAdmin(admin.ModelAdmin):
    # Dùng filter_horizontal để có giao diện chọn quyền 2 ô
    filter_horizontal = ('permissions',)
    list_display = ('name',)
    search_fields = ('name',)

@admin.register(TaiKhoan)
class TaiKhoanAdmin(BaseUserAdmin):
    # Sử dụng các form tùy chỉnh để làm việc với Custom User Model
    form = TaiKhoanChangeForm
    add_form = TaiKhoanCreationForm

    # Các trường hiển thị trong danh sách User
    list_display = ('ten_dang_nhap', 'email', 'ho_ten', 'is_staff', 'is_active')
    list_filter = ('is_staff', 'is_superuser', 'is_active', 'groups')
    
    # Các trường để tìm kiếm
    search_fields = ('ten_dang_nhap', 'ho_ten', 'email')
    ordering = ('ten_dang_nhap',)
    
    # Dùng filter_horizontal cho giao diện chọn groups và permissions
    filter_horizontal = ('groups', 'user_permissions',)

    # Các trường hiển thị khi sửa một User
    # (Loại bỏ `vai_tro`, sử dụng `groups` thay thế)
    fieldsets = (
        (None, {'fields': ('ten_dang_nhap', 'password')}),
        ('Thông tin cá nhân', {'fields': ('ho_ten', 'email')}),
        ('Quyền hạn', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
    )

    # Các trường hiển thị khi thêm mới một User
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('ten_dang_nhap', 'email', 'ho_ten', 'password', 'password2'),
        }),
    )

# Đăng ký các model danh mục và nghiệp vụ khác để có thể quản lý chúng trong Admin
@admin.register(BenhNhan)
class BenhNhanAdmin(admin.ModelAdmin):
    list_display = ('id', 'ho_ten', 'nam_sinh', 'gioi_tinh', 'dia_chi')
    search_fields = ('ho_ten', 'id')

@admin.register(DSKham)
class DSKhamAdmin(admin.ModelAdmin):
    list_display = ('id', 'ngay_kham', 'benh_nhan')
    list_filter = ('ngay_kham',)
    search_fields = ('benh_nhan__ho_ten',)

@admin.register(LoaiBenh)
class LoaiBenhAdmin(admin.ModelAdmin):
    search_fields = ('ten_loai_benh',)

@admin.register(DonViTinh)
class DonViTinhAdmin(admin.ModelAdmin):
    search_fields = ('ten_don_vi_tinh',)

@admin.register(CachDung)
class CachDungAdmin(admin.ModelAdmin):
    search_fields = ('ten_cach_dung',)

@admin.register(Thuoc)
class ThuocAdmin(admin.ModelAdmin):
    list_display = ('ten_thuoc', 'don_vi_tinh', 'so_luong_ton', 'don_gia')
    list_filter = ('don_vi_tinh',)
    search_fields = ('ten_thuoc',)

@admin.register(PKB)
class PKBAdmin(admin.ModelAdmin):
    list_display = ('id', 'ngay_kham', 'benh_nhan', 'loai_benh_chuan_doan')
    list_filter = ('ngay_kham', 'loai_benh_chuan_doan')
    search_fields = ('benh_nhan__ho_ten', 'trieu_chung')

@admin.register(ChiTietPKB)
class ChiTietPKBAdmin(admin.ModelAdmin):
    list_display = ('phieu_kham_benh', 'thuoc', 'so_luong_ke', 'cach_dung_chi_dinh')

@admin.register(HoaDon)
class HoaDonAdmin(admin.ModelAdmin):
    list_display = ('id', 'phieu_kham_benh', 'ngay_thanh_toan', 'tien_kham', 'tien_thuoc', 'tong_tien')
    list_filter = ('ngay_thanh_toan',)