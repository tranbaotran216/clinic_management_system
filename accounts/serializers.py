from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import Group as DjangoGroup, Permission as DjangoPermission
from .models import (
    TaiKhoan, BenhNhan, DSKham, PKB, ChiTietPKB,
    LoaiBenh, Thuoc, DonViTinh, HoaDon, CachDung
)

# Serializer này dùng để hiển thị thông tin chi tiết của một Permission
class PermissionSerializer(serializers.ModelSerializer):
    full_codename = serializers.SerializerMethodField()
    class Meta:
        model = DjangoPermission
        fields = ['id', 'name', 'full_codename'] # name: Tên dễ hiểu, full_codename: app_label.codename
    
    def get_full_codename(self, obj):
        return f"{obj.content_type.app_label}.{obj.codename}"

# --- SERIALIZER CHO DJANGO GROUP (VAI TRÒ) ---
class GroupSerializer(serializers.ModelSerializer):
    """
    Serializer cho model Group của Django.
    Dùng để List, Retrieve, Create (với tên), và Update (tên) của Group.
    Việc gán quyền được xử lý bởi một action riêng trong ViewSet.
    """
    # Khi GET, sẽ hiển thị danh sách permissions chi tiết của Group này
    permissions = PermissionSerializer(many=True, read_only=True)

    class Meta:
        model = DjangoGroup
        # Chỉ cần 'name' để tạo/sửa. 'id' và 'permissions' là chỉ đọc.
        fields = ['id', 'name', 'permissions']
        # Không cần 'permission_ids' ở đây vì việc gán quyền có API riêng.

class GroupCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer đơn giản chỉ dùng để tạo (POST) và cập nhật (PUT/PATCH) tên của Group.
    """
    class Meta:
        model = DjangoGroup
        fields = ['name'] # Chỉ làm việc với trường 'name'
        
# --- SERIALIZER CHO TAIKHOAN ---
class TaiKhoanPublicSerializer(serializers.ModelSerializer):
    """
    Serializer để hiển thị thông tin công khai của một tài khoản.
    Bao gồm thông tin về các vai trò (groups) mà họ thuộc về và
    tất cả các quyền (permissions) họ có được từ các vai trò đó.
    """
    groups = GroupSerializer(many=True, read_only=True)
    permissions = serializers.SerializerMethodField()

    class Meta:
        model = TaiKhoan
        fields = [
            'id', 'ho_ten', 'email', 'ten_dang_nhap',
            'is_active', 'is_staff',
            'groups',
            'permissions'
        ]

    def get_permissions(self, obj: TaiKhoan) -> list:
        # Gọi hàm get_all_permissions chuẩn của Django User model
        # nó sẽ tự động lấy quyền từ các group mà user thuộc về.
        return sorted(list(obj.get_all_permissions()))

class TaiKhoanCreateSerializer(serializers.ModelSerializer):
    """
    Serializer để tạo một tài khoản mới.
    Nhận thông tin cơ bản và một danh sách ID của các Group để gán cho tài khoản.
    """
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})
    groups = serializers.PrimaryKeyRelatedField(
        queryset=DjangoGroup.objects.all(),
        many=True,
        required=False, # Không bắt buộc phải có group khi tạo
        allow_empty=True
    )

    class Meta:
        model = TaiKhoan
        fields = ['ho_ten', 'email', 'password', 'password2', 'ten_dang_nhap', 'groups', 'is_active']
        extra_kwargs = {
            'password': {'write_only': True},
            'is_active': {'required': False, 'default': True},
        }

    def validate(self, data):
        if data.get('password') != data.get('password2'):
            raise serializers.ValidationError({"password": "Mật khẩu không khớp."})
        if TaiKhoan.objects.filter(ten_dang_nhap=data['ten_dang_nhap']).exists():
            raise serializers.ValidationError({"ten_dang_nhap": "Tên đăng nhập này đã tồn tại."})
        if 'email' in data and data['email'] and TaiKhoan.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email này đã được sử dụng."})
        return data

    def create(self, validated_data):
        groups_data = validated_data.pop('groups', [])
        validated_data.pop('password2')
        password = validated_data.pop('password')
        
        user = TaiKhoan.objects.create_user(password=password, **validated_data)
        
        if groups_data:
            user.groups.set(groups_data)
            # Tự động set is_staff nếu user được gán vào group 'Quản lý' hoặc 'Nhân viên y tế'
            group_names = [g.name for g in groups_data]
            if any(name in ['Quản lý', 'Nhân viên y tế'] for name in group_names):
                user.is_staff = True
                user.save(update_fields=['is_staff'])
                
        return user

class TaiKhoanUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer để cập nhật thông tin một tài khoản đã có.
    Không cho phép sửa tên đăng nhập. Mật khẩu là tùy chọn.
    """
    groups = serializers.PrimaryKeyRelatedField(queryset=DjangoGroup.objects.all(), many=True, required=False)
    password = serializers.CharField(write_only=True, required=False, allow_blank=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = TaiKhoan
        fields = ['id', 'ho_ten', 'email', 'groups', 'is_active', 'is_staff', 'password', 'password2', 'ten_dang_nhap']
        read_only_fields = ['ten_dang_nhap']

    def validate(self, attrs):
        password = attrs.get('password')
        password2 = attrs.get('password2')
        if password and password != password2:
            raise serializers.ValidationError({"password": "Mật khẩu không khớp."})
        return attrs
    
    def update(self, instance: TaiKhoan, validated_data):
        groups_data = validated_data.pop('groups', None)
        password = validated_data.pop('password', None)
        validated_data.pop('password2', None)
        
        # Cập nhật các trường thông thường
        instance = super().update(instance, validated_data)

        if groups_data is not None:
            instance.groups.set(groups_data)
            group_names = [g.name for g in instance.groups.all()]
            if any(name in ['Quản lý', 'Nhân viên y tế'] for name in group_names):
                instance.is_staff = True
            else:
                instance.is_staff = False
        
        if password:
            instance.set_password(password)
            
        instance.save()
        return instance

# --- CÁC SERIALIZERS KHÁC ---
# Dùng fields cụ thể thay vì '__all__' để kiểm soát output tốt hơn
class BenhNhanSerializer(serializers.ModelSerializer):
    class Meta:
        model = BenhNhan
        fields = ['id', 'ho_ten', 'dia_chi', 'nam_sinh', 'gioi_tinh']

class DSKhamSerializer(serializers.ModelSerializer):
    benh_nhan = BenhNhanSerializer(read_only=True)
    benh_nhan_id = serializers.PrimaryKeyRelatedField(queryset=BenhNhan.objects.all(), source='benh_nhan', write_only=True)
    class Meta:
        model = DSKham
        fields = ['id', 'ngay_kham', 'benh_nhan', 'benh_nhan_id']

class LoaiBenhSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoaiBenh
        fields = ['id', 'ten_loai_benh']

class DonViTinhSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonViTinh
        fields = ['id', 'ten_don_vi_tinh']

class CachDungSerializer(serializers.ModelSerializer):
    class Meta:
        model = CachDung
        fields = ['id', 'ten_cach_dung']

class ThuocSerializer(serializers.ModelSerializer):
    don_vi_tinh = DonViTinhSerializer(read_only=True)
    don_vi_tinh_id = serializers.PrimaryKeyRelatedField(queryset=DonViTinh.objects.all(), source='don_vi_tinh', write_only=True)
    class Meta:
        model = Thuoc
        fields = ['id', 'ten_thuoc', 'don_vi_tinh', 'don_vi_tinh_id', 'so_luong_ton', 'don_gia']

class ChiTietPKBSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChiTietPKB
        fields = ['id', 'phieu_kham_benh', 'thuoc', 'so_luong_ke', 'cach_dung_chi_dinh']

class PKBSerializer(serializers.ModelSerializer):
    chi_tiet_don_thuoc = ChiTietPKBSerializer(many=True, read_only=True)
    class Meta:
        model = PKB
        fields = ['id', 'ngay_kham', 'trieu_chung', 'benh_nhan', 'loai_benh_chuan_doan', 'chi_tiet_don_thuoc']

class HoaDonSerializer(serializers.ModelSerializer):
    class Meta:
        model = HoaDon
        fields = ['id', 'phieu_kham_benh', 'ngay_thanh_toan', 'tien_kham', 'tien_thuoc', 'tong_tien']