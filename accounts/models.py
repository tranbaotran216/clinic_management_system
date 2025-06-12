from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin,
    Group as DjangoGroup, Permission as DjangoPermission
)
from django.utils.translation import gettext_lazy as _

# --- Choices ---
class GioiTinh(models.TextChoices):
    NAM = 'M', _('Nam')
    NU = 'F', _('Nữ')
    KHAC = 'O', _('Khác')

# <<<< XÓA BỎ HOÀN TOÀN MODEL `VaiTro` và `VAI_TRO_CHOICES` >>>>
# class VaiTro(models.Model): ... -> Xóa

# --- TaiKhoanManager (Sửa đổi để không phụ thuộc vào VaiTro) ---
class TaiKhoanManager(BaseUserManager):
    def create_user(self, ten_dang_nhap, password=None, **extra_fields):
        if not ten_dang_nhap:
            raise ValueError(_('Tên đăng nhập là bắt buộc.'))
        
        email = extra_fields.pop('email', None)
        if email:
            email = self.normalize_email(email)
            extra_fields['email'] = email
        
        user = self.model(ten_dang_nhap=ten_dang_nhap, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, ten_dang_nhap, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser phải có is_staff=True.'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser phải có is_superuser=True.'))
        
        email = extra_fields.get('email')
        if not email:
            raise ValueError(_('Superuser phải có một địa chỉ email.'))

        user = self.create_user(ten_dang_nhap, password, **extra_fields)
        
        # Tự động tạo Group 'Quản lý' và gán superuser vào đó
        manager_group, created = DjangoGroup.objects.get_or_create(name='Quản lý')
        user.groups.add(manager_group)

        return user

# --- Model TaiKhoan (User) - Đã đơn giản hóa ---
class TaiKhoan(AbstractBaseUser, PermissionsMixin):
    ho_ten = models.CharField(_('họ tên'), max_length=150, blank=True, default='')
    email = models.EmailField(_('địa chỉ email'), max_length=255, unique=True, null=True, blank=True)
    ten_dang_nhap = models.CharField(_('tên đăng nhập'), max_length=150, unique=True)
    
    # <<<< XÓA BỎ trường `vai_tro = models.ForeignKey(...)` >>>>

    is_active = models.BooleanField(_('kích hoạt'), default=True)
    is_staff = models.BooleanField(_('nhân viên'), default=False, help_text=_('Chỉ định user có thể đăng nhập vào trang admin hay không.'))

    # Trường `groups` và `user_permissions` đã có sẵn từ PermissionsMixin và được khai báo đúng
    # với related_name tùy chỉnh để tránh xung đột.
    groups = models.ManyToManyField(
        DjangoGroup,
        verbose_name=_('các vai trò (groups)'),
        blank=True,
        related_name="taikhoan_set", # Có thể giữ tên này
        help_text=_('Các vai trò mà người dùng này thuộc về. Người dùng sẽ có tất cả các quyền được gán cho mỗi vai trò của họ.'),
    )
    user_permissions = models.ManyToManyField(
        DjangoPermission,
        verbose_name=_('quyền trực tiếp'),
        blank=True,
        related_name="taikhoan_permissions_set", # Đổi tên này cho khác với groups
        help_text=_('Các quyền được gán trực tiếp cho người dùng này.'),
    )

    objects = TaiKhoanManager()

    USERNAME_FIELD = 'ten_dang_nhap'
    REQUIRED_FIELDS = ['email']

    class Meta:
        verbose_name = _('Tài Khoản')
        verbose_name_plural = _('Các Tài Khoản')
        ordering = ['ho_ten', 'ten_dang_nhap']

    def __str__(self):
        return self.ten_dang_nhap
    
# --- CÁC MODEL KHÁC ĐÃ ĐƯỢC CẬP NHẬT VỚI `unique=True` VÀ TỐI ƯU HƠN ---

class LoaiBenh(models.Model):
    ten_loai_benh = models.CharField(_('tên loại bệnh'), max_length=100, unique=True)
    class Meta: verbose_name = _("Loại Bệnh"); verbose_name_plural = _("Các Loại Bệnh"); ordering = ['ten_loai_benh']
    def __str__(self): return self.ten_loai_benh

class DonViTinh(models.Model):
    ten_don_vi_tinh = models.CharField(_('tên đơn vị tính'), max_length=50, unique=True)
    class Meta: verbose_name = _("Đơn Vị Tính"); verbose_name_plural = _("Các Đơn Vị Tính"); ordering = ['ten_don_vi_tinh']
    def __str__(self): return self.ten_don_vi_tinh

class CachDung(models.Model):
    ten_cach_dung = models.CharField(_('tên cách dùng'), max_length=100, unique=True)
    class Meta: verbose_name = _("Cách Dùng Thuốc"); verbose_name_plural = _("Các Cách Dùng Thuốc"); ordering = ['ten_cach_dung']
    def __str__(self): return self.ten_cach_dung

class BenhNhan(models.Model):
    ho_ten = models.CharField(_('họ tên'), max_length=100)
    dia_chi = models.CharField(_('địa chỉ'), max_length=255, blank=True)
    nam_sinh = models.DateField(_('năm sinh'), null=True, blank=True)
    gioi_tinh = models.CharField(_('giới tính'), max_length=1, choices=GioiTinh.choices, null=True, blank=True)
    class Meta: verbose_name = _("Bệnh Nhân"); verbose_name_plural = _("Các Bệnh Nhân"); ordering = ['ho_ten']
    def __str__(self): return self.ho_ten

class DSKham(models.Model):
    ngay_kham = models.DateField(_('ngày khám'))
    benh_nhan = models.ForeignKey(BenhNhan, verbose_name=_('bệnh nhân'), on_delete=models.PROTECT)
    class Meta:
        verbose_name = _("Danh Sách Khám")
        verbose_name_plural = _("Các Danh Sách Khám")
        ordering = ['ngay_kham', 'id']
        unique_together = ('ngay_kham', 'benh_nhan')
    def __str__(self): return f"{self.benh_nhan.ho_ten} - {self.ngay_kham}"

class PKB(models.Model): # Phiếu Khám Bệnh
    ngay_kham = models.DateField(_('ngày khám'))
    trieu_chung = models.TextField(_('triệu chứng'), blank=True)
    benh_nhan = models.ForeignKey(BenhNhan, verbose_name=_('bệnh nhân'), on_delete=models.PROTECT)
    loai_benh_chuan_doan = models.ForeignKey(LoaiBenh, verbose_name=_('loại bệnh chẩn đoán'), on_delete=models.SET_NULL, null=True, blank=True)
    class Meta: verbose_name = _("Phiếu Khám Bệnh"); verbose_name_plural = _("Các Phiếu Khám Bệnh"); ordering = ['-ngay_kham']
    def __str__(self): return f"PKB {self.id} - {self.benh_nhan.ho_ten} - {self.ngay_kham}"

class Thuoc(models.Model):
    ten_thuoc = models.CharField(_('tên thuốc'), max_length=100, unique=True)
    don_vi_tinh = models.ForeignKey(DonViTinh, verbose_name=_('đơn vị tính'), on_delete=models.PROTECT)
    so_luong_ton = models.PositiveIntegerField(_('số lượng tồn'), default=0)
    don_gia = models.DecimalField(_('đơn giá'), max_digits=10, decimal_places=0, default=0)
    class Meta: verbose_name = _("Thuốc"); verbose_name_plural = _("Các Loại Thuốc"); ordering = ['ten_thuoc']
    def __str__(self): return self.ten_thuoc

class ChiTietPKB(models.Model):
    phieu_kham_benh = models.ForeignKey(PKB, verbose_name=_('phiếu khám bệnh'), related_name='chi_tiet_don_thuoc', on_delete=models.CASCADE)
    thuoc = models.ForeignKey(Thuoc, verbose_name=_('thuốc'), on_delete=models.PROTECT)
    so_luong_ke = models.PositiveIntegerField(_('số lượng kê'))
    cach_dung_chi_dinh = models.ForeignKey(CachDung, verbose_name=_('cách dùng chỉ định'), on_delete=models.SET_NULL, null=True, blank=True)
    class Meta:
        verbose_name = _("Chi Tiết Đơn Thuốc")
        verbose_name_plural = _("Các Chi Tiết Đơn Thuốc")
        unique_together = ('phieu_kham_benh', 'thuoc')
    def __str__(self): return f"{self.thuoc.ten_thuoc} - SL: {self.so_luong_ke}"

class HoaDon(models.Model):
    phieu_kham_benh = models.OneToOneField(PKB, verbose_name=_('phiếu khám bệnh'), on_delete=models.CASCADE, related_name="hoa_don")
    ngay_thanh_toan = models.DateTimeField(_('ngày thanh toán'), auto_now_add=True)
    tien_kham = models.DecimalField(_('tiền khám'), max_digits=10, decimal_places=0)
    tien_thuoc = models.DecimalField(_('tiền thuốc'), max_digits=12, decimal_places=0)
    
    class Meta: verbose_name = _("Hóa Đơn"); verbose_name_plural = _("Các Hóa Đơn"); ordering = ['-ngay_thanh_toan']
    
    @property
    def tong_tien(self):
        return self.tien_kham + self.tien_thuoc

    def __str__(self): return f"Hóa đơn cho PKB {self.phieu_kham_benh.id} - Tổng: {self.tong_tien}"