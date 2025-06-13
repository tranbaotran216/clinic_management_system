from rest_framework import generics, status, views as drf_views, viewsets
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import TaiKhoan, LoaiBenh, CachDung, DonViTinh
from .serializers import (
    TaiKhoanCreateSerializer,
    TaiKhoanPublicSerializer,
    TaiKhoanUpdateSerializer,
    GroupSerializer,
    PermissionSerializer,
    GroupCreateUpdateSerializer,
    CachDungSerializer,
    LoaiBenhSerializer, DonViTinhSerializer
)
from django.contrib.auth import authenticate
from rest_framework.permissions import IsAuthenticated, AllowAny
from .permissions import isManager # Custom permission của bạn
from rest_framework.decorators import action
from django.contrib.auth.models import Group as DjangoGroup, Permission as DjangoPermission

# Import các decorator cần thiết để miễn trừ CSRF
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt

# --- Các View Xác thực và Thông tin cơ bản ---
class RegisterView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, isManager]
    queryset = TaiKhoan.objects.all()
    serializer_class = TaiKhoanCreateSerializer

# === THÊM DECORATOR VÀO LOGINVIEW ===
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
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': user_data
            }, status=status.HTTP_200_OK)
        elif user and not user.is_active:
            return Response({"error": "Tài khoản đã bị khóa"}, status=status.HTTP_403_FORBIDDEN)
        
        return Response({"error": "Thông tin đăng nhập không hợp lệ"}, status=status.HTTP_401_UNAUTHORIZED)


class CurrentUserDetailView(drf_views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        serializer = TaiKhoanPublicSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class DashboardSummaryView(drf_views.APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request, *args, **kwargs):
        user = request.user
        summary_data = {}
        # Bạn cần tạo các custom permission này trong models.py để logic này hoạt động
        if user.has_perm('accounts.view_daily_appointment_summary'):
            summary_data['daily_appointments'] = 30 # Logic lấy dữ liệu thật
        if user.has_perm('accounts.view_daily_revenue_summary'):
            summary_data['daily_revenue'] = 25500000 # Logic lấy dữ liệu thật
        return Response(summary_data, status=status.HTTP_200_OK)

# --- GroupViewSet ---
class GroupViewSet(viewsets.ModelViewSet):
    queryset = DjangoGroup.objects.prefetch_related('permissions').all().order_by('name')
    permission_classes = [IsAuthenticated, isManager]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return GroupCreateUpdateSerializer
        return GroupSerializer

    @action(detail=True, methods=['get'], url_path='permissions')
    def get_group_permissions(self, request, pk=None):
        group = self.get_object()
        permissions_codenames = [f"{p.content_type.app_label}.{p.codename}" for p in group.permissions.all()]
        return Response(permissions_codenames)

    @action(detail=True, methods=['post'], url_path='assign-permissions')
    def assign_permissions_to_group(self, request, pk=None):
        group = self.get_object()
        codenames_to_assign = request.data.get('permissions_codenames', [])
        valid_permissions = []
        for codename_str in codenames_to_assign:
            try:
                app_label, codename = codename_str.split('.')
                perm = DjangoPermission.objects.get(content_type__app_label=app_label, codename=codename)
                valid_permissions.append(perm)
            except (DjangoPermission.DoesNotExist, ValueError):
                continue
        group.permissions.set(valid_permissions)
        return Response({'status': 'Permissions assigned successfully'}, status=status.HTTP_200_OK)

# --- UserViewSet ---
class UserViewSet(viewsets.ModelViewSet):
    queryset = TaiKhoan.objects.prefetch_related('groups').all().order_by('-id')
    
    def get_serializer_class(self):
        if self.action in ['create']: return TaiKhoanCreateSerializer
        if self.action in ['update', 'partial_update']: return TaiKhoanUpdateSerializer
        return TaiKhoanPublicSerializer

    def get_permissions(self):
        self.permission_classes = [IsAuthenticated, isManager]
        return super().get_permissions()

    @action(detail=True, methods=['post'], url_path='assign-groups')
    def assign_groups(self, request, pk=None):
        user = self.get_object()
        group_ids = request.data.get('group_ids', [])
        
        try:
            groups = DjangoGroup.objects.filter(id__in=group_ids)
            user.groups.set(groups)
        except DjangoGroup.DoesNotExist:
            return Response({"error": "Một hoặc nhiều Group không tồn tại."}, status=status.HTTP_404_NOT_FOUND)
        
        # Cập nhật is_staff
        group_names = [g.name for g in user.groups.all()]
        if any(name in ['Quản lý', 'Nhân viên y tế'] for name in group_names):
            user.is_staff = True
        else:
            user.is_staff = False
        user.save(update_fields=['is_staff'])

        return Response(TaiKhoanPublicSerializer(user).data, status=status.HTTP_200_OK)

# --- PermissionViewSet ---
class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = DjangoPermission.objects.select_related('content_type').all().order_by('content_type__app_label', 'name')
    serializer_class = PermissionSerializer
    permission_classes = [IsAuthenticated, isManager]

# (Tr): này để thêm mấy cái cách dùng,... trong dashboard của quản lý
class LoaiBenhViewSet(viewsets.ModelViewSet):
    queryset = LoaiBenh.objects.all()
    serializer_class = LoaiBenhSerializer
    permission_classes = [IsAuthenticated, isManager]

class DonViTinhViewSet(viewsets.ModelViewSet):
    queryset = DonViTinh.objects.all()
    serializer_class = DonViTinhSerializer
    permission_classes = [IsAuthenticated, isManager]

class CachDungViewSet(viewsets.ModelViewSet):
    queryset = CachDung.objects.all()
    serializer_class = CachDungSerializer
    permission_classes = [IsAuthenticated, isManager]