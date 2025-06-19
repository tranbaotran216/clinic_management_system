# accounts/serializers.py (PHIÊN BẢN HOÀN CHỈNH)

from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import Group as DjangoGroup, Permission as DjangoPermission
from .models import (
    TaiKhoan, BenhNhan, DSKham, PKB, ChiTietPKB,
    LoaiBenh, Thuoc, DonViTinh, HoaDon, CachDung, QuyDinhValue, get_so_benh_nhan_toi_da
)

# ===================================================================
# == SERIALIZERS HỆ THỐNG & TÀI KHOẢN (Đã ổn định, giữ nguyên)
# ===================================================================

class PermissionSerializer(serializers.ModelSerializer):
    full_codename = serializers.SerializerMethodField()
    class Meta:
        model = DjangoPermission
        fields = ['id', 'name', 'full_codename']
    def get_full_codename(self, obj):
        return f"{obj.content_type.app_label}.{obj.codename}"

class GroupSerializer(serializers.ModelSerializer):
    permissions = PermissionSerializer(many=True, read_only=True)
    class Meta:
        model = DjangoGroup
        fields = ['id', 'name', 'permissions']

class GroupCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = DjangoGroup
        fields = ['name']

class TaiKhoanPublicSerializer(serializers.ModelSerializer):
    groups = GroupSerializer(many=True, read_only=True)
    permissions = serializers.SerializerMethodField()
    class Meta:
        model = TaiKhoan
        fields = ['id', 'ho_ten', 'email', 'ten_dang_nhap', 'is_active', 'is_staff', 'is_superuser', 'groups', 'permissions']
    def get_permissions(self, obj: TaiKhoan) -> list:
        return sorted(list(obj.get_all_permissions()))

class TaiKhoanCreateSerializer(serializers.ModelSerializer):
    # ... (Giữ nguyên không thay đổi)
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})
    groups = serializers.PrimaryKeyRelatedField(queryset=DjangoGroup.objects.all(), many=True, required=False, allow_empty=True)
    class Meta:
        model = TaiKhoan
        fields = ['ho_ten', 'email', 'password', 'password2', 'ten_dang_nhap', 'groups', 'is_active', 'is_staff']
        extra_kwargs = {
            'password': {'write_only': True, 'validators': [validate_password]},
            'is_active': {'required': False, 'default': True},
            'is_staff': {'required': False, 'default': False},
        }
    def validate(self, data):
        if data.get('password') != data.get('password2'): raise serializers.ValidationError({"password": "Mật khẩu không khớp."})
        return data
    def create(self, validated_data):
        groups_data = validated_data.pop('groups', [])
        validated_data.pop('password2')
        user = TaiKhoan.objects.create_user(**validated_data)
        if groups_data: user.groups.set(groups_data)
        return user

class TaiKhoanUpdateSerializer(serializers.ModelSerializer):
    # ... (Giữ nguyên không thay đổi)
    groups = serializers.PrimaryKeyRelatedField(queryset=DjangoGroup.objects.all(), many=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=False, allow_blank=True, allow_null=True)
    class Meta:
        model = TaiKhoan
        fields = ['id', 'ho_ten', 'email', 'groups', 'is_active', 'is_staff', 'password', 'password2', 'ten_dang_nhap']
        read_only_fields = ['ten_dang_nhap']
    def validate(self, attrs):
        password = attrs.get('password'); password2 = attrs.get('password2')
        if password or password2:
            if password != password2: raise serializers.ValidationError({"password": "Mật khẩu không khớp."})
            if not password: raise serializers.ValidationError({"password": "Mật khẩu không được để trống nếu muốn thay đổi."})
        return attrs
    def update(self, instance, validated_data):
        groups_data = validated_data.pop('groups', None); password = validated_data.pop('password', None)
        validated_data.pop('password2', None); instance = super().update(instance, validated_data)
        if groups_data is not None: instance.groups.set(groups_data)
        if password: instance.set_password(password)
        instance.save(); return instance

# ===================================================================
# == SERIALIZERS DANH MỤC (Đã ổn định, giữ nguyên)
# ===================================================================

class LoaiBenhSerializer(serializers.ModelSerializer):
    class Meta: model = LoaiBenh; fields = '__all__'

class DonViTinhSerializer(serializers.ModelSerializer):
    class Meta: model = DonViTinh; fields = '__all__'

class CachDungSerializer(serializers.ModelSerializer):
    class Meta: model = CachDung; fields = '__all__'

class ThuocSerializer(serializers.ModelSerializer):
    don_vi_tinh = DonViTinhSerializer(read_only=True)
    don_vi_tinh_id = serializers.PrimaryKeyRelatedField(queryset=DonViTinh.objects.all(), source='don_vi_tinh', write_only=True)
    class Meta: model = Thuoc; fields = ['id', 'ten_thuoc', 'don_vi_tinh_id', 'don_vi_tinh', 'so_luong_ton', 'don_gia']

class QuyDinhValueSerializer(serializers.ModelSerializer):
    ma_quy_dinh_display = serializers.CharField(source='get_ma_quy_dinh_display', read_only=True)
    class Meta: model = QuyDinhValue; fields = ['ma_quy_dinh', 'ma_quy_dinh_display', 'gia_tri']
    
class QuyDinhValueUpdateSerializer(serializers.ModelSerializer):
    """Serializer này chỉ dùng để cập nhật giá trị của một quy định."""
    class Meta:
        model = QuyDinhValue
        fields = ['gia_tri']

# ===================================================================
# == SERIALIZERS CHO NGHIỆP VỤ KHÁM BỆNH (PHẦN QUAN TRỌNG NHẤT)
# ===================================================================

# --- Bệnh nhân ---
class BenhNhanSerializer(serializers.ModelSerializer):
    class Meta: 
        model = BenhNhan
        fields = ['id', 'ho_ten', 'dia_chi', 'nam_sinh', 'gioi_tinh']

# --- Danh sách chờ khám (DSKham) ---

# Dùng để ĐỌC danh sách
class DSKhamSerializer(serializers.ModelSerializer):
    benh_nhan = BenhNhanSerializer(read_only=True)
    gioi_tinh_display = serializers.CharField(source='benh_nhan.get_gioi_tinh_display', read_only=True) # Để hiển thị "Nam", "Nữ"
    da_kham = serializers.SerializerMethodField()
    
    class Meta: 
        model = DSKham
        fields = ['id', 'ngay_kham', 'benh_nhan', 'gioi_tinh_display', 'da_kham']

    def get_da_kham(self, obj: DSKham) -> bool: 
        return hasattr(obj, 'phieu_kham') and obj.phieu_kham is not None
    
# Dùng để TẠO MỚI một lượt đăng ký
class DSKhamCreateSerializer(serializers.ModelSerializer):
    benh_nhan = BenhNhanSerializer(write_only=True) 
 
    class Meta:
        model = DSKham
        fields = ['ngay_kham', 'benh_nhan']

    def create(self, validated_data):
        benh_nhan_data = validated_data.pop('benh_nhan')
        # Dùng get_or_create để không tạo bệnh nhân trùng
        benh_nhan_instance, _ = BenhNhan.objects.get_or_create(
            ho_ten=benh_nhan_data['ho_ten'],
            nam_sinh=benh_nhan_data['nam_sinh'],
            defaults={'gioi_tinh': benh_nhan_data['gioi_tinh'], 'dia_chi': benh_nhan_data.get('dia_chi', '')}
        )
        ds_kham_instance = DSKham.objects.create(benh_nhan=benh_nhan_instance, **validated_data)
        return ds_kham_instance
    
    def validate(self, data):
        ngay_kham = data.get('ngay_kham')
        max_patients = get_so_benh_nhan_toi_da() # <-- Gọi hàm helper, code gọn hơn
        current_patients = DSKham.objects.filter(ngay_kham=ngay_kham).count()

        if current_patients >= max_patients:
            raise serializers.ValidationError(...)
            
        return data
# Dùng để CẬP NHẬT (SỬA) một lượt đăng ký
class DSKhamUpdateSerializer(serializers.ModelSerializer):
    benh_nhan = BenhNhanSerializer() # Nhận object bệnh nhân để cập nhật

    class Meta:
        model = DSKham
        fields = ['id', 'ngay_kham', 'benh_nhan']

    def update(self, instance, validated_data):
        benh_nhan_data = validated_data.pop('benh_nhan')
        benh_nhan_instance = instance.benh_nhan
        
        # Cập nhật thông tin của bệnh nhân liên quan
        benh_nhan_serializer = BenhNhanSerializer(benh_nhan_instance, data=benh_nhan_data, partial=True)
        if benh_nhan_serializer.is_valid(raise_exception=True):
            benh_nhan_serializer.save()

        # Cập nhật thông tin của bản ghi DSKham (chỉ có ngay_kham)
        instance.ngay_kham = validated_data.get('ngay_kham', instance.ngay_kham)
        instance.save()

        return instance


# --- Phiếu Khám Bệnh (PKB) và các chi tiết (Giữ nguyên) ---

class HoaDonSerializer(serializers.ModelSerializer):
    tong_tien = serializers.DecimalField(max_digits=12, decimal_places=0, read_only=True)
    class Meta: model = HoaDon; fields = ['id', 'phieu_kham_benh', 'ngay_thanh_toan', 'tien_kham', 'tien_thuoc', 'tong_tien']

class ChiTietPKBReadSerializer(serializers.ModelSerializer):
    thuoc = ThuocSerializer(read_only=True)
    cach_dung_chi_dinh = CachDungSerializer(read_only=True)
    class Meta: model = ChiTietPKB; fields = ['id', 'thuoc', 'so_luong_ke', 'cach_dung_chi_dinh']

class PKBSerializer(serializers.ModelSerializer):
    benh_nhan = BenhNhanSerializer(read_only=True)
    loai_benh_chuan_doan = LoaiBenhSerializer(read_only=True)
    chi_tiet_don_thuoc = ChiTietPKBReadSerializer(many=True, read_only=True)
    hoa_don_lien_ket = HoaDonSerializer(read_only=True)
    class Meta: model = PKB; fields = ['id', 'ngay_kham', 'trieu_chung', 'benh_nhan', 'loai_benh_chuan_doan', 'chi_tiet_don_thuoc', 'hoa_don_lien_ket']

class ChiTietPKBWriteSerializer(serializers.ModelSerializer):
    thuoc_id = serializers.PrimaryKeyRelatedField(queryset=Thuoc.objects.all(), source='thuoc')
    cach_dung_chi_dinh_id = serializers.PrimaryKeyRelatedField(queryset=CachDung.objects.all(), source='cach_dung_chi_dinh', allow_null=True, required=False)
    class Meta: model = ChiTietPKB; fields = ['thuoc_id', 'so_luong_ke', 'cach_dung_chi_dinh_id']

class PKBCreateUpdateSerializer(serializers.ModelSerializer):
    benh_nhan_id = serializers.PrimaryKeyRelatedField(queryset=BenhNhan.objects.all(), source='benh_nhan')
    loai_benh_chuan_doan_id = serializers.PrimaryKeyRelatedField(queryset=LoaiBenh.objects.all(), source='loai_benh_chuan_doan', allow_null=True, required=False)
    chi_tiet_don_thuoc = ChiTietPKBWriteSerializer(many=True, write_only=True, required=False, allow_empty=True)
    class Meta: model = PKB; fields = ['ngay_kham', 'trieu_chung', 'benh_nhan_id', 'loai_benh_chuan_doan_id', 'chi_tiet_don_thuoc']

    def create(self, validated_data):
        chi_tiet_data_list = validated_data.pop('chi_tiet_don_thuoc', [])
        pkb = PKB.objects.create(**validated_data)
        for chi_tiet_data in chi_tiet_data_list:
            ChiTietPKB.objects.create(phieu_kham_benh=pkb, **chi_tiet_data)
        return pkb

    def update(self, instance, validated_data):
        chi_tiet_data_list = validated_data.pop('chi_tiet_don_thuoc', None)
        instance = super().update(instance, validated_data)
        if chi_tiet_data_list is not None:
            instance.chi_tiet_don_thuoc.all().delete()
            for chi_tiet_data in chi_tiet_data_list:
                ChiTietPKB.objects.create(phieu_kham_benh=instance, **chi_tiet_data)
        return instance

# ===================================================================
# == SERIALIZERS BÁO CÁO (Đã ổn định, giữ nguyên)
# ===================================================================
class BaoCaoDoanhThuNgaySerializer(serializers.Serializer):
    ngay = serializers.DateField()
    so_benh_nhan = serializers.IntegerField()
    doanh_thu = serializers.DecimalField(max_digits=15, decimal_places=0)
    ty_le = serializers.FloatField(allow_null=True)

class BaoCaoSuDungThuocSerializer(serializers.Serializer):
    thuoc_id = serializers.IntegerField(source='thuoc__id')
    ten_thuoc = serializers.CharField(source='thuoc__ten_thuoc')
    don_vi_tinh = serializers.CharField(source='thuoc__don_vi_tinh__ten_don_vi_tinh', allow_null=True)
    tong_so_luong_su_dung = serializers.IntegerField()
    so_lan_ke_don = serializers.IntegerField()