from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin, Group, Permission

class GioiTinh(models.TextChoices):
    NAM = 'M', 'Nam'
    NU = 'F', 'Nữ'

VAI_TRO_CHOICES = (
    ('manager', 'Quản lý'),
    ('med_staff', 'Nhân viên y tế')
)

# Create your models here.
class VaiTro(models.Model):
    ten_vai_tro = models.CharField(max_length=50, choices=VAI_TRO_CHOICES, default='med_staff')

    def __str__(self):
        return self.ten_vai_tro
    
# đn các tạo tk
class TaiKhoanManager(BaseUserManager):
    def create_user(self, ten_dang_nhap, email, password=None, **extra_fields):
        if not email:
            raise ValueError('tài khoản bắt buộc phải có email')
        email = self.normalize_email(email)
        user = self.model(ten_dang_nhap=ten_dang_nhap, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    # tạo tk quản lý
    def create_superuser(self, ten_dang_nhap, email, password=None, **extra_fields):
        if 'vai_tro' not in extra_fields or not extra_fields['vai_tro']:
            extra_fields['vai_tro'] = VaiTro.objects.get(ten_vai_tro='manager')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(ten_dang_nhap, email, password, **extra_fields)

    
# định n cấu trúc
class TaiKhoan(AbstractBaseUser, PermissionsMixin):
    ho_ten = models.CharField(max_length=100)
    email = models.EmailField(max_length=100, unique=True)
    ten_dang_nhap= models.CharField(max_length=50, unique=True)
    vai_tro = models.ForeignKey(VaiTro, on_delete=models.CASCADE)

    is_active = models.BooleanField(default=True) #kiểm tra tài khoản đã được kích hoạt hay chưa
    is_staff = models.BooleanField(default=False) # True cho nv y tế + quản lý

    # tránh khứa này bị xung đột vs auth.User(user model mặc định)
    groups = models.ManyToManyField(
        Group,
        related_name='tai_khoan_set',  # đặt tên riêng
        blank=True,
        help_text='The groups this user belongs to.',
        verbose_name='groups',
    )

    user_permissions = models.ManyToManyField(
        Permission,
        related_name='tai_khoan_set',  # đặt tên riêng
        blank=True,
        help_text='Specific permissions for this user.',
        verbose_name='user permissions',
    )
    objects = TaiKhoanManager() # kế thừa BaseUserManager, tạo tài khoản mới

    USERNAME_FIELD = 'ten_dang_nhap' # trường dùng xác thực login
    REQUIRED_FIELDS = ['email'] # trường bắt buộc, ell có khỏi đăng nhập

    def __str__(self):
        return f"ten dang nhap: {self.ten_dang_nhap}"
    
class BenhNhan(models.Model):
    ho_ten = models.CharField( max_length=100)
    dia_chi = models.CharField(max_length=255, null=True)
    nam_sinh = models.DateField(null=True)
    gioi_tinh = models.CharField(max_length=3, choices=GioiTinh.choices, default=GioiTinh.NAM, null=True)

class DSKham(models.Model):
    ngay_kham = models.DateField()
    id_benh_nhan = models.ForeignKey(BenhNhan, on_delete=models.CASCADE)

class LoaiBenh(models.Model):
    ten_loai_benh = models.CharField(max_length=100)

# phieu kham benh
class PKB(models.Model):
    ngay_kham = models.DateField()
    trieu_chung = models.CharField(max_length=255, null=True)
    id_benh_nhan = models.ForeignKey(BenhNhan, on_delete=models.CASCADE)
    id_loai_benh = models.ForeignKey(LoaiBenh, on_delete=models.CASCADE)

class DonViTinh(models.Model):
    ten_don_vi_tinh = models.CharField(max_length=50)

class CachDung(models.Model):
    ten_cach_dung = models.CharField(max_length=100)

class HoaDon(models.Model):
    id_pkb = models.ForeignKey(PKB, on_delete=models.CASCADE)
    tien_kham = models.FloatField()
    tien_thuoc = models.FloatField()
    tong_tien = models.FloatField()

class Thuoc(models.Model):
    ten_thuoc = models.CharField(max_length=100)
    id_don_vi = models.ForeignKey(DonViTinh, on_delete=models.CASCADE)
    id_cach_dung = models.ForeignKey(CachDung, on_delete=models.CASCADE)
    so_luong = models.IntegerField(null=True)
    gia = models.FloatField()
    hsd = models.DateField(null=True)


class ChiTietPKB(models.Model):
    id_pkb = models.ForeignKey(PKB, on_delete=models.CASCADE)
    id_thuoc = models.ForeignKey(Thuoc, on_delete=models.CASCADE)
    sl = models.IntegerField(null=True)
    
