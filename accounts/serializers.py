from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import TaiKhoan, VaiTro, BenhNhan, DSKham, PKB, ChiTietPKB, LoaiBenh, Thuoc, DonViTinh, HoaDon

    
class VaiTroSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaiTro
        fields = ('__all__')
        
# dùng public để xem, ko show password
# --- TaiKhoanPublicSerializer (Chỉnh sửa để thêm permissions và groups giả lập) ---
class TaiKhoanPublicSerializer(serializers.ModelSerializer):
    # vai_tro_display = serializers.CharField(source='get_vai_tro_display', read_only=True) # Lấy tên hiển thị của choice field
    vai_tro = VaiTroSerializer(read_only=True) # Trả về object VaiTro (id, ten_vai_tro)

    # Thêm hai trường này để giả lập hoặc lấy dữ liệu thật sau này
    permissions = serializers.SerializerMethodField()
    groups = serializers.SerializerMethodField() # Django gọi Vai trò là Group

    class Meta:
        model = TaiKhoan
        fields = [
            'id', 'ho_ten', 'email', 'ten_dang_nhap',
            'vai_tro', # Sẽ là object {'id': ..., 'ten_vai_tro': ...}
            'is_active', 'is_staff', # Thêm is_staff để frontend có thể dùng
            'permissions',
            'groups'
        ]

    def get_permissions(self, obj):
        # obj ở đây là instance của TaiKhoan
        mock_permissions = []
        # Lấy giá trị lưu trong DB của vai_tro (ví dụ: 'manager', 'med_staff')
        vai_tro_value = obj.vai_tro.ten_vai_tro if obj.vai_tro else None

        if vai_tro_value == 'manager': # So sánh với giá trị key của choices
            mock_permissions = [
                'accounts.manage_accounts',
                'patients.manage_patient_waiting_list',
                'medrecords.manage_medical_records',
                'billing.view_invoices',
                'reports.view_revenue_statistics',
                'medications.view_usage_reports',
                'medications.search_inventory',
                'medications.manage_inventory',
                'clinic.manage_regulations',
                'appointments.view_daily_appointment_count',
                'reports.view_daily_revenue_summary'
            ]
        elif vai_tro_value == 'med_staff': # So sánh với giá trị key của choices
            mock_permissions = [
                'patients.manage_patient_waiting_list',
                'medrecords.manage_medical_records',
                'billing.view_invoices',
                'medications.view_usage_reports',
                'medications.search_inventory',
                'appointments.register_appointments',
                'appointments.view_daily_appointment_count'
            ]
        return sorted(list(set(mock_permissions)))

    def get_groups(self, obj):
        user_groups_mock = []
        if obj.vai_tro:
            # Trả về cấu trúc giống như Django Group để frontend có thể xử lý thống nhất sau này
            user_groups_mock = [{'id': obj.vai_tro.id, 'name': obj.vai_tro.get_ten_vai_tro_display()}]
        return user_groups_mock

# --- TaiKhoanCreateSerializer (Chỉnh sửa để xử lý vai_tro là instance) ---
class TaiKhoanCreateSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})
    # Cho phép client gửi ID của VaiTro khi tạo
    vai_tro = serializers.PrimaryKeyRelatedField(queryset=VaiTro.objects.all())

    class Meta:
        model = TaiKhoan
        fields = ['ho_ten', 'email', 'password', 'password2', 'ten_dang_nhap', 'vai_tro']
        extra_kwargs = {
            'password': {'write_only': True, 'style': {'input_type': 'password'}}
        }

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "Mật khẩu không khớp."})
        if TaiKhoan.objects.filter(ten_dang_nhap=data['ten_dang_nhap']).exists():
            raise serializers.ValidationError({"ten_dang_nhap": "Tên đăng nhập này đã tồn tại."})
        if 'email' in data and data['email'] and TaiKhoan.objects.filter(email=data['email']).exists():
            raise serializers.ValidationError({"email": "Email này đã được sử dụng."})
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        # validated_data['vai_tro'] lúc này là một instance của VaiTro
        
        user = TaiKhoan(**validated_data)
        user.set_password(password)
        
        # Xác định is_staff dựa trên vai_tro
        if user.vai_tro and user.vai_tro.ten_vai_tro in ['manager', 'med_staff']:
            user.is_staff = True
        else:
            user.is_staff = False # Mặc định hoặc cho các vai trò khác

        user.save()
        return user

class BenhNhanSerializer(serializers.ModelSerializer):
    class Meta:
        model = BenhNhan
        fields = ('__all__')
        
class DSKhamSerializer(serializers.ModelSerializer):
    benh_nhan = BenhNhanSerializer()
    class Meta:
        model = DSKham
        fields = ['ngay_kham', 'benh_nhan']

        def create(self, validated_data):
            benh_nhan_data = validated_data.pop('benh_nhan')
            benh_nhan = BenhNhan.objects.create(**benh_nhan_data)
            validated_data['benh_nhan'] = benh_nhan
            return DSKham.objects.create(**validated_data)

class PKBSerializer(serializers.ModelSerializer):
    class Meta:
        model = PKB
        fields = ('__all__')

class ChiTietPKBSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChiTietPKB
        fields = ('__all__')

class LoaiBenhSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoaiBenh
        fields = ('__all__')

class ThuocSerializer(serializers.ModelSerializer):
    class Meta:
        model = Thuoc
        fields = ('__all__')

class DonViTinhSerializer(serializers.ModelSerializer):
    class Meta:
        model = DonViTinh
        fields = ('__all__')

class HoaDonSerializer(serializers.ModelSerializer):
    class Meta:
        model = HoaDon
        fields = ('__all__')

