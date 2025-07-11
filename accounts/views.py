import random
import string
from datetime import date
from decimal import Decimal
from django.conf import settings 
from django.contrib.auth import authenticate
from django.contrib.auth.models import Group as DjangoGroup, Permission as DjangoPermission
from django.core.mail import send_mail 
from django.db.models import Sum, Count, F, DecimalField
from django.db.models.functions import TruncDay
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.utils import timezone

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import permissions, generics, status, views as drf_views, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, AllowAny, DjangoModelPermissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    TaiKhoan, BenhNhan, DSKham, PKB, ChiTietPKB,
    LoaiBenh, Thuoc, DonViTinh, HoaDon, CachDung,
    QuyDinhValue
)
from .serializers import (
    # Serializers cho Tài khoản
    TaiKhoanCreateSerializer, TaiKhoanPublicSerializer, TaiKhoanUpdateSerializer,
    # Serializers cho Hệ thống
    GroupSerializer, PermissionSerializer, GroupCreateUpdateSerializer,
    # Serializers cho Nghiệp vụ khám bệnh
    BenhNhanSerializer, DSKhamSerializer, DSKhamCreateSerializer, DSKhamUpdateSerializer,
    PKBSerializer, PKBCreateUpdateSerializer, HoaDonSerializer, PublicAppointmentSerializer,
    # Serializers cho Danh mục
    LoaiBenhSerializer, ThuocSerializer, DonViTinhSerializer, CachDungSerializer,
    QuyDinhValueSerializer, QuyDinhValueUpdateSerializer,
    # Serializers cho Báo cáo
    BaoCaoSuDungThuocSerializer, BaoCaoDoanhThuNgaySerializer,
    PasswordResetRequestSerializer, ChangePasswordSerializer
)

from rest_framework.permissions import IsAuthenticated, AllowAny, DjangoModelPermissions
from rest_framework.decorators import action
from rest_framework.views import APIView

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(drf_views.APIView):
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        ten_dang_nhap = request.data.get("ten_dang_nhap")
        password = request.data.get("password")
        user = authenticate(request, username=ten_dang_nhap, password=password)
        if user and user.is_active:
            refresh = RefreshToken.for_user(user)
            user_data = TaiKhoanPublicSerializer(user, context={'request': request}).data
            return Response({
                'refresh': str(refresh), 'access': str(refresh.access_token), 'user': user_data
            }, status=status.HTTP_200_OK)
        elif user and not user.is_active:
            return Response({"error": "Tài khoản đã bị khóa."}, status=status.HTTP_403_FORBIDDEN)
        return Response({"error": "Thông tin đăng nhập không hợp lệ."}, status=status.HTTP_401_UNAUTHORIZED)

class CurrentUserDetailView(drf_views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        serializer = TaiKhoanPublicSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

class DashboardSummaryView(drf_views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        today = date.today()
        daily_appointments = DSKham.objects.filter(ngay_kham=today).count()
        daily_revenue = HoaDon.objects.filter(ngay_thanh_toan__date=today).aggregate(
            total=Sum(F('tien_kham') + F('tien_thuoc'))
        )['total'] or 0
        return Response({
            'daily_appointments': daily_appointments,
            'daily_revenue': daily_revenue
        }, status=status.HTTP_200_OK)

class UserViewSet(viewsets.ModelViewSet):
    queryset = TaiKhoan.objects.prefetch_related('groups').all().order_by('-id')
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    
    def get_serializer_class(self):
        if self.action == 'create': return TaiKhoanCreateSerializer
        if self.action in ['update', 'partial_update']: return TaiKhoanUpdateSerializer
        return TaiKhoanPublicSerializer
    
class GroupViewSet(viewsets.ModelViewSet):
    queryset = DjangoGroup.objects.all().order_by('name')
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return GroupCreateUpdateSerializer
        return GroupSerializer

    @action(detail=True, methods=['post'], url_path='assign-permissions')
    def assign_permissions_to_group(self, request, pk=None):
        group = self.get_object()
        permission_ids = request.data.get('permission_ids', []) # Frontend gửi permission_ids
        permissions = DjangoPermission.objects.filter(id__in=permission_ids)
        group.permissions.set(permissions)
        return Response({'status': 'Permissions assigned successfully'}, status=status.HTTP_200_OK)
    
class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DjangoPermission.objects.select_related('content_type').all().order_by('content_type__app_label', 'name')
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]


class BenhNhanViewSet(viewsets.ModelViewSet):
    queryset = BenhNhan.objects.all().order_by('-id')
    serializer_class = BenhNhanSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class DSKhamViewSet(viewsets.ModelViewSet):
    queryset = DSKham.objects.select_related('benh_nhan').all().order_by('-ngay_kham', 'benh_nhan__ho_ten')
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

    def get_serializer_class(self):
        if self.action == 'create':
            return DSKhamCreateSerializer
        if self.action in ['update', 'partial_update']:
            return DSKhamUpdateSerializer
        return DSKhamSerializer # Dùng cho list, retrieve
    
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['ngay_kham'] # Cho phép lọc chính xác theo trường 'ngay_kham'

    def create(self, request, *args, **kwargs):
        # Ghi đè create để trả về dữ liệu đúng định dạng cho frontend
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        instance = serializer.save()
        read_serializer = DSKhamSerializer(instance) # Dùng serializer ĐỌC để trả về
        headers = self.get_success_headers(read_serializer.data)
        return Response(read_serializer.data, status=status.HTTP_201_CREATED, headers=headers)

class PKBViewSet(viewsets.ModelViewSet):
    queryset = PKB.objects.select_related(
        'benh_nhan', 'loai_benh_chuan_doan'
    ).prefetch_related(
        'chi_tiet_don_thuoc__thuoc__don_vi_tinh', 'chi_tiet_don_thuoc__cach_dung_chi_dinh', 'hoa_don_lien_ket'
    ).all().order_by('-ngay_kham', '-id')
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return PKBCreateUpdateSerializer
        return PKBSerializer
    
    def perform_create(self, serializer):
        ds_kham_id = self.request.data.get('ds_kham_id')
        ds_kham_instance = DSKham.objects.filter(id=ds_kham_id).first()
        
        pkb_instance = serializer.save(
            nguoi_lap_phieu=self.request.user, 
            ds_kham=ds_kham_instance
        )
        
        pkb_instance.tao_hoac_cap_nhat_hoa_don()

    def perform_update(self, serializer):
        pkb_instance = serializer.save()
        pkb_instance.tao_hoac_cap_nhat_hoa_don()

#đăng ký ở trang HomePage
class PublicAppointmentView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PublicAppointmentSerializer(data=request.data)
        if serializer.is_valid():
            appointment = serializer.save()
            return Response({
                "message": "Đăng ký thành công",
                "ma_lich_kham": appointment.id,
                "ngay_kham": appointment.ngay_kham,
                "ten_benh_nhan": appointment.benh_nhan.ho_ten
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class HoaDonViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = HoaDon.objects.select_related('phieu_kham_benh__benh_nhan').all().order_by('-ngay_thanh_toan')
    serializer_class = HoaDonSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class LoaiBenhViewSet(viewsets.ModelViewSet):
    queryset = LoaiBenh.objects.all().order_by('ten_loai_benh')
    serializer_class = LoaiBenhSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class DonViTinhViewSet(viewsets.ModelViewSet):
    queryset = DonViTinh.objects.all().order_by('ten_don_vi_tinh')
    serializer_class = DonViTinhSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class CachDungViewSet(viewsets.ModelViewSet):
    queryset = CachDung.objects.all().order_by('ten_cach_dung')
    serializer_class = CachDungSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class ThuocViewSet(viewsets.ModelViewSet):
    queryset = Thuoc.objects.select_related('don_vi_tinh').all().order_by('ten_thuoc')
    serializer_class = ThuocSerializer
    permission_classes = [IsAuthenticated, DjangoModelPermissions]

class QuyDinhValueViewSet(viewsets.ModelViewSet):
    queryset = QuyDinhValue.objects.all()
    permission_classes = [IsAuthenticated, DjangoModelPermissions]
    lookup_field = 'ma_quy_dinh'
    http_method_names = ['get', 'put', 'patch', 'head', 'options']

    def get_serializer_class(self):
        if self.action in ['update', 'partial_update']:
            return QuyDinhValueUpdateSerializer
        return QuyDinhValueSerializer

class MedicationUsageReportView(drf_views.APIView):
    permission_classes = [IsAuthenticated] 
    def get(self, request, *args, **kwargs):
        month_str = request.query_params.get('month'); year_str = request.query_params.get('year'); search_term = request.query_params.get('search')
        try:
            month = int(month_str) if month_str else None; year = int(year_str) if year_str else None
            if month and not (1 <= month <= 12): return Response({"error": "Tháng không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError): return Response({"error": "Tháng và năm phải là số."}, status=status.HTTP_400_BAD_REQUEST)
        
        queryset = ChiTietPKB.objects.select_related('thuoc__don_vi_tinh', 'phieu_kham_benh')
        if year: queryset = queryset.filter(phieu_kham_benh__ngay_kham__year=year)
        if month: queryset = queryset.filter(phieu_kham_benh__ngay_kham__month=month)
        if search_term: queryset = queryset.filter(thuoc__ten_thuoc__icontains=search_term)
        
        report_data = queryset.values('thuoc__id', 'thuoc__ten_thuoc', 'thuoc__don_vi_tinh__ten_don_vi_tinh') \
                              .annotate(tong_so_luong_su_dung=Sum('so_luong_ke'), so_lan_ke_don=Count('id')) \
                              .order_by('-tong_so_luong_su_dung', 'thuoc__ten_thuoc')
        
        serializer = BaoCaoSuDungThuocSerializer(list(report_data), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

class RevenueReportView(drf_views.APIView):
    permission_classes = [IsAuthenticated] # Hoặc custom permission 'accounts.view_revenue_report'
    def get(self, request, *args, **kwargs):
        try:
            month_str = request.query_params.get('month'); year_str = request.query_params.get('year')
            if not month_str or not year_str: return Response({"error": "Vui lòng cung cấp tháng và năm."}, status=status.HTTP_400_BAD_REQUEST)
            month = int(month_str); year = int(year_str)
            if not (1 <= month <= 12): return Response({"error": "Tháng không hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError): return Response({"error": "Tháng và năm phải là số nguyên hợp lệ."}, status=status.HTTP_400_BAD_REQUEST)

        queryset = HoaDon.objects.filter(ngay_thanh_toan__year=year, ngay_thanh_toan__month=month)
        total_monthly_revenue_data = queryset.aggregate(total_revenue_month=Sum(F('tien_kham') + F('tien_thuoc'), output_field=DecimalField()))
        total_monthly_revenue = total_monthly_revenue_data.get('total_revenue_month') or Decimal(0)

        daily_revenue_report_qs = queryset.annotate(ngay=TruncDay('ngay_thanh_toan')) \
                                        .values('ngay') \
                                        .annotate(
                                            so_benh_nhan=Count('phieu_kham_benh_id', distinct=True),
                                            doanh_thu=Sum(F('tien_kham') + F('tien_thuoc'), output_field=DecimalField())
                                        ).order_by('ngay')
        report_data = []
        for item in daily_revenue_report_qs:
            daily_revenue = item.get('doanh_thu') or Decimal(0); ty_le = Decimal(0)
            if total_monthly_revenue > 0 and daily_revenue > 0: 
                ty_le = round((Decimal(daily_revenue) / Decimal(total_monthly_revenue)) * Decimal(100), 2)
            report_data.append({
                'ngay': item['ngay'].strftime('%Y-%m-%d'), 
                'so_benh_nhan': item['so_benh_nhan'], 
                'doanh_thu': daily_revenue, 
                'ty_le': float(ty_le) 
            })
        serializer = BaoCaoDoanhThuNgaySerializer(report_data, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
class PasswordResetRequestView(generics.GenericAPIView):
    permission_classes = [AllowAny]
    serializer_class = PasswordResetRequestSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        
        user = TaiKhoan.objects.filter(email__iexact=email).first()

        if user:
            
            # 1. Tạo một mật khẩu ngẫu nhiên mới (8 ký tự)
            new_password = ''.join(random.choice(string.ascii_letters + string.digits) for _ in range(8))
            
            # 2. Cập nhật mật khẩu mới cho người dùng
            user.set_password(new_password)
            user.save()
            
            # 3. Gửi email chứa tên đăng nhập và mật khẩu mới
            subject = 'Mật khẩu mới cho tài khoản Phòng Mạch Medical Clinic'
            message_body = (
                f'Chào {user.ho_ten},\n\n'
                f'Bạn đã yêu cầu đặt lại mật khẩu. Dưới đây là thông tin đăng nhập mới của bạn:\n\n'
                f'   - Tên đăng nhập: {user.ten_dang_nhap}\n'
                f'   - Mật khẩu mới: {new_password}\n\n'
                f'Vui lòng đăng nhập bằng mật khẩu này và đổi lại mật khẩu trong trang thông tin cá nhân để đảm bảo an toàn.\n\n'
                f'Trân trọng,\n'
                f'Phòng Mạch Medical Clinic\n'
            )
            
            try:
                send_mail(subject, message_body, settings.DEFAULT_FROM_EMAIL, [user.email])
            except Exception as e:
                # Ghi lại lỗi nếu gửi email thất bại
                print(f"Lỗi khi gửi email reset mật khẩu: {e}")
                # Có thể trả về lỗi cho người dùng hoặc vẫn trả về thành công để bảo mật
                
        return Response(
            {"detail": "Vui lòng kiểm tra email, mật khẩu mới đã được gửi đi."},
            status=status.HTTP_200_OK
        )
        
class ChangePasswordView(generics.UpdateAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = ChangePasswordSerializer

    def get_object(self, queryset=None):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user_object = self.get_object()
        serializer = self.get_serializer(data=request.data, context={'request': request})
        
        # is_valid sẽ chạy các hàm validate trong serializer
        serializer.is_valid(raise_exception=True)

        # Nếu dữ liệu hợp lệ, thực hiện đổi mật khẩu
        user_object.set_password(serializer.validated_data.get("new_password"))
        user_object.save()
        
        # Gửi email thông báo (tùy chọn)
        subject = 'Thông báo thay đổi mật khẩu'
        message_body = f'Chào {user_object.ho_ten},\n\nMật khẩu của bạn tại Phòng Mạch Medical Clinic đã được thay đổi thành công vào lúc {timezone.now().strftime("%H:%M %d/%m/%Y")}.\n\nNếu bạn không thực hiện hành động này, vui lòng liên hệ với chúng tôi ngay lập tức.\n\nTrân trọng.'
        send_mail(subject, message_body, settings.DEFAULT_FROM_EMAIL, [user_object.email])

        return Response({"detail": "Đổi mật khẩu thành công."}, status=status.HTTP_200_OK)