from django.db import models
from django.contrib.auth.models import (
    AbstractBaseUser, BaseUserManager, PermissionsMixin,
    Group as DjangoGroup, Permission as DjangoPermission
)
from django.utils.translation import gettext_lazy as _
from decimal import Decimal, InvalidOperation # Import Decimal

# --- Choices ---
class GioiTinh(models.TextChoices):
    NAM = 'M', _('Nam')
    NU = 'F', _('Nữ')

# --- TaiKhoanManager ---
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
        if not extra_fields.get('is_staff'):
            raise ValueError(_('Superuser phải có is_staff=True.'))
        if not extra_fields.get('is_superuser'):
            raise ValueError(_('Superuser phải có is_superuser=True.'))
        email = extra_fields.get('email')
        if not email:
            raise ValueError(_('Superuser phải có một địa chỉ email.'))
        user = self.create_user(ten_dang_nhap, password, **extra_fields)
        manager_group, created = DjangoGroup.objects.get_or_create(name='Quản lý')
        if created: # Gán quyền mặc định cho group Quản lý nếu mới tạo
            # Ví dụ: Gán tất cả các quyền cho group Quản lý (Cẩn thận khi dùng trong production)
            # for perm in DjangoPermission.objects.all():
            #    manager_group.permissions.add(perm)
            pass # Bạn có thể thêm logic gán quyền ở đây
        user.groups.add(manager_group)
        return user

# --- Model TaiKhoan (User) ---
class TaiKhoan(AbstractBaseUser, PermissionsMixin):
    ho_ten = models.CharField(_('họ tên'), max_length=150, blank=True, default='')
    email = models.EmailField(_('địa chỉ email'), max_length=255, unique=True, null=True, blank=True)
    ten_dang_nhap = models.CharField(_('tên đăng nhập'), max_length=150, unique=True)
    is_active = models.BooleanField(_('kích hoạt'), default=True)
    is_staff = models.BooleanField(_('nhân viên'), default=False, help_text=_('Chỉ định user có thể đăng nhập vào trang admin hay không.'))
    groups = models.ManyToManyField(
        DjangoGroup, verbose_name=_('các vai trò'), blank=True,
        related_name="tai_khoan_groups", # Đổi related_name để rõ ràng hơn
        help_text=_('Các vai trò mà người dùng này thuộc về.')
    )
    user_permissions = models.ManyToManyField(
        DjangoPermission, verbose_name=_('quyền trực tiếp'), blank=True,
        related_name="tai_khoan_user_permissions", # Đổi related_name
        help_text=_('Các quyền được gán trực tiếp cho người dùng này.')
    )
    objects = TaiKhoanManager()
    USERNAME_FIELD = 'ten_dang_nhap'
    REQUIRED_FIELDS = ['email']
    class Meta: verbose_name = _('Tài Khoản'); verbose_name_plural = _('Các Tài Khoản'); ordering = ['ho_ten', 'ten_dang_nhap']
    def __str__(self): return self.ten_dang_nhap

# --- CÁC MODEL DANH MỤC (Dùng cho "Quản lý Quy định" và nghiệp vụ) ---
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
    mo_ta = models.TextField(_('mô tả'), blank=True, null=True) # Thêm mô tả nếu cần
    class Meta: verbose_name = _("Cách Dùng Thuốc"); verbose_name_plural = _("Các Cách Dùng Thuốc"); ordering = ['ten_cach_dung']
    def __str__(self): return self.ten_cach_dung

class Thuoc(models.Model):
    ten_thuoc = models.CharField(_('tên thuốc'), max_length=100, unique=True)
    don_vi_tinh = models.ForeignKey(DonViTinh, verbose_name=_('đơn vị tính'), on_delete=models.PROTECT, related_name='thuoc_theo_don_vi')
    so_luong_ton = models.PositiveIntegerField(_('số lượng tồn'), default=0)
    don_gia = models.DecimalField(_('đơn giá'), max_digits=12, decimal_places=0, default=0) # Tăng max_digits cho đơn giá lớn
    han_su_dung = models.DateField(_('hạn sử dụng'), null=True, blank=True)
    
    cach_dung_mac_dinh = models.ForeignKey(
        CachDung,
        verbose_name=_('cách dùng mặc định'),
        on_delete=models.SET_NULL, # Nếu xóa cách dùng, thuốc không bị xóa theo
        null=True,
        blank=True,
        related_name='thuoc_theo_cach_dung'
    )
    
    class Meta: verbose_name = _("Thuốc"); verbose_name_plural = _("Các Loại Thuốc"); ordering = ['ten_thuoc']
    def __str__(self): return self.ten_thuoc

# --- MODEL QUY ĐỊNH GIÁ TRỊ ---
class LoaiQuyDinhValue(models.TextChoices):
    SO_BENH_NHAN_TOI_DA = 'MAX_PATIENTS_PER_DAY', _('Số bệnh nhân tối đa mỗi ngày')
    TIEN_KHAM_CO_BAN = 'BASE_EXAMINATION_FEE', _('Tiền khám cơ bản')

# Model để lưu giá trị của các quy định
class QuyDinhValue(models.Model):
    ma_quy_dinh = models.CharField(
        _('mã quy định'),
        max_length=50,
        choices=LoaiQuyDinhValue.choices,
        unique=True,
        primary_key=True
    )
    gia_tri = models.PositiveIntegerField(
        _('giá trị'),
        help_text=_("Giá trị số của quy định.")
    )

    class Meta:
        verbose_name = _("Giá Trị Quy Định")
        verbose_name_plural = _("Các Giá Trị Quy Định")
        ordering = ['ma_quy_dinh']

    def __str__(self):
        return self.get_ma_quy_dinh_display()

# --- HÀM HELPER ĐỂ LẤY TIỀN KHÁM ---
def get_tien_kham_co_ban(default_value=30000):
    try:
        tien_kham = QuyDinhValue.objects.values_list('gia_tri', flat=True).get(
            ma_quy_dinh=LoaiQuyDinhValue.TIEN_KHAM_CO_BAN
        )
        return tien_kham
    except QuyDinhValue.DoesNotExist:
        return default_value

def get_so_benh_nhan_toi_da(default_value=40):
    try:
        so_benh_nhan = QuyDinhValue.objects.values_list('gia_tri', flat=True).get(
            ma_quy_dinh=LoaiQuyDinhValue.SO_BENH_NHAN_TOI_DA
        )
        return so_benh_nhan
    except QuyDinhValue.DoesNotExist:
        return default_value

# --- CÁC MODEL NGHIỆP VỤ KHÁM BỆNH ---
class BenhNhan(models.Model):
    ho_ten = models.CharField(_('họ tên'), max_length=100)
    dia_chi = models.CharField(_('địa chỉ'), max_length=255, blank=True, default='')
    nam_sinh = models.IntegerField(_('năm sinh'), null=True, blank=True)
    gioi_tinh = models.CharField(_('giới tính'), max_length=1, choices=GioiTinh.choices, null=True, blank=True)
    class Meta: verbose_name = _("Bệnh Nhân"); verbose_name_plural = _("Các Bệnh Nhân"); ordering = ['ho_ten']
    def __str__(self): return self.ho_ten

class DSKham(models.Model):
    ngay_kham = models.DateField(_('ngày khám'))
    benh_nhan = models.ForeignKey(BenhNhan, verbose_name=_('bệnh nhân'), on_delete=models.PROTECT, related_name='lich_kham')
    # trang_thai: có thể thêm CHO_KHAM, DA_KHAM, HUY
    class Meta:
        verbose_name = _("Danh Sách Chờ Khám")
        verbose_name_plural = _("Các Danh Sách Chờ Khám")
        ordering = ['ngay_kham', 'id']
        unique_together = ('ngay_kham', 'benh_nhan')
    def __str__(self): return f"{self.benh_nhan.ho_ten} - {self.ngay_kham}"

class PKB(models.Model):
    ngay_kham = models.DateField(_('ngày khám'))
    trieu_chung = models.TextField(_('triệu chứng'), blank=True, default='')
    benh_nhan = models.ForeignKey(BenhNhan, verbose_name=_('bệnh nhân'), on_delete=models.PROTECT, related_name='phieu_kham_benh')
    loai_benh_chuan_doan = models.ForeignKey(LoaiBenh, verbose_name=_('loại bệnh chẩn đoán'), on_delete=models.SET_NULL, null=True, blank=True, related_name='pkb_theo_loai_benh')
    ds_kham = models.OneToOneField(DSKham, on_delete=models.SET_NULL, null=True, blank=True, related_name='phieu_kham')
    nguoi_lap_phieu = models.ForeignKey(
        TaiKhoan, verbose_name=_('người lập phiếu'),
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='phieu_kham_da_lap'
    )
    
    class Meta: verbose_name = _("Phiếu Khám Bệnh"); verbose_name_plural = _("Các Phiếu Khám Bệnh"); ordering = ['-ngay_kham', '-id']
    def __str__(self): return f"PKB {self.id} - {self.benh_nhan.ho_ten} - {self.ngay_kham}"

    def tinh_tien_thuoc(self):
        tong_tien_thuoc = Decimal(0)
        for chi_tiet in self.chi_tiet_don_thuoc.all():
            if chi_tiet.thuoc and chi_tiet.thuoc.don_gia is not None:
                tong_tien_thuoc += Decimal(chi_tiet.so_luong_ke) * chi_tiet.thuoc.don_gia
        return tong_tien_thuoc

    def tao_hoac_cap_nhat_hoa_don(self):
        tien_kham = get_tien_kham_co_ban()
        tien_thuoc_tinh_toan = self.tinh_tien_thuoc()
        hoa_don, created = HoaDon.objects.get_or_create(
            phieu_kham_benh=self,
            defaults={'tien_kham': tien_kham, 'tien_thuoc': tien_thuoc_tinh_toan}
        )
        if not created:
            if hoa_don.tien_kham != tien_kham or hoa_don.tien_thuoc != tien_thuoc_tinh_toan:
                hoa_don.tien_kham = tien_kham
                hoa_don.tien_thuoc = tien_thuoc_tinh_toan
                hoa_don.save(update_fields=['tien_kham', 'tien_thuoc'])
        return hoa_don

class ChiTietPKB(models.Model):
    phieu_kham_benh = models.ForeignKey(PKB, verbose_name=_('phiếu khám bệnh'), related_name='chi_tiet_don_thuoc', on_delete=models.CASCADE)
    thuoc = models.ForeignKey(Thuoc, verbose_name=_('thuốc'), on_delete=models.PROTECT, related_name='chi_tiet_su_dung')
    so_luong_ke = models.PositiveIntegerField(_('số lượng kê'))
    cach_dung_chi_dinh = models.ForeignKey(CachDung, verbose_name=_('cách dùng chỉ định'), on_delete=models.SET_NULL, null=True, blank=True, related_name='chi_tiet_theo_cach_dung')
    # don_gia_tai_thoi_diem_ke = models.DecimalField(_('đơn giá lúc kê'), max_digits=12, decimal_places=0, null=True, blank=True)

    class Meta:
        verbose_name = _("Chi Tiết Đơn Thuốc")
        verbose_name_plural = _("Các Chi Tiết Đơn Thuốc")
        unique_together = ('phieu_kham_benh', 'thuoc') # Mỗi thuốc chỉ xuất hiện 1 lần trong 1 đơn
    def __str__(self): return f"{self.thuoc.ten_thuoc} - SL: {self.so_luong_ke}"

class HoaDon(models.Model):
    phieu_kham_benh = models.OneToOneField(PKB, verbose_name=_('phiếu khám bệnh'), on_delete=models.CASCADE, related_name="hoa_don_lien_ket") # Đổi related_name ở đây để không trùng với related_query_name của PKB
    ngay_thanh_toan = models.DateTimeField(_('ngày thanh toán'), auto_now_add=True)
    tien_kham = models.DecimalField(_('tiền khám'), max_digits=10, decimal_places=0)
    tien_thuoc = models.DecimalField(_('tiền thuốc'), max_digits=12, decimal_places=0, default=0)
    # nguoi_tao_hoa_don = models.ForeignKey(TaiKhoan, verbose_name=_('người tạo'), on_delete=models.SET_NULL, null=True, blank=True, related_name='hoa_don_da_tao')
    class Meta: verbose_name = _("Hóa Đơn"); verbose_name_plural = _("Các Hóa Đơn"); ordering = ['-ngay_thanh_toan']
    @property
    def tong_tien(self): return self.tien_kham + self.tien_thuoc
    def __str__(self): return f"Hóa đơn cho PKB {self.phieu_kham_benh_id} - Tổng: {self.tong_tien}"