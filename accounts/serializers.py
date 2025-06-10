from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from .models import TaiKhoan, VaiTro, BenhNhan, DSKham, PKB, ChiTietPKB, LoaiBenh, Thuoc, DonViTinh, HoaDon

# dùng public để xem, ko show password
class TaiKhoanPublicSerializer(serializers.ModelSerializer):
    vai_tro = serializers.CharField(source='vai_tro.ten_vai_tro')
    class Meta:
        model = TaiKhoan
        fields = ['id', 'ho_ten', 'email', 'ten_dang_nhap', 'vai_tro']

class TaiKhoanCreateSerializer(serializers.ModelSerializer):
    password2 = serializers.CharField(write_only=True)
    class Meta:
        model = TaiKhoan
        fields = ['ho_ten', 'email', 'password', 'password2', 'ten_dang_nhap', 'vai_tro']
        extra_kwargs= {
            'password': {'write_only': True, 'style' : {'input_type' : 'password'}}
        }

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({"password": "mật khẩu không khớp"})
        return data
    
    def create(self, validated_data):
        validated_data.pop('password2') # này là 'xác nhận mk': ko cần lưu
        password = validated_data.pop('password') # lấy khỏi validated_data : vấn đề bảo mật
        user = TaiKhoan(**validated_data) # tạo object TaiKhoan
        user.set_password(password) # mã hóa password chuẩn bcrypt
        user.save()
        return user

class VaiTroSerializer(serializers.ModelSerializer):
    class Meta:
        model = VaiTro
        fields = ('__all__')

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

