from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from  rest_framework import generics, status
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import TaiKhoan
from .serializers import TaiKhoanCreateSerializer, TaiKhoanPublicSerializer

from rest_framework.views import APIView
from django.contrib.auth import authenticate, login, logout
from rest_framework.permissions import IsAuthenticated
from rest_framework.generics import ListAPIView
from .permissions import isManager, isMedStaff
from rest_framework.decorators import api_view
# Create your views here.

# tao tk moi
class RegisterView(generics.CreateAPIView):
    permission_classes = [IsAuthenticated, isManager]
    queryset = TaiKhoan.objects.all()
    serializer_class = TaiKhoanCreateSerializer

class LoginView(APIView):
    def post(self, request):
        ten_dang_nhap = request.data.get("ten_dang_nhap")
        password = request.data.get("password")
        user = authenticate(request, ten_dang_nhap=ten_dang_nhap, password=password)

        if user is not None:
            if not user.is_active:
                return Response({"error": "Tài khoản đã bị khóa"}, status=status.HTTP_403_FORBIDDEN)
            
            refresh = RefreshToken.for_user(user)
            user_data = TaiKhoanPublicSerializer(user).data
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user': user_data
            }, status=status.HTTP_200_OK)
        return Response({"error": "Tài khoản không tồn tại"}, status.HTTP_401_UNAUTHORIZED)

# --- CurrentUserDetailView (API MỚI) ---
class CurrentUserDetailView(APIView):
    permission_classes = [IsAuthenticated] # Yêu cầu user phải đăng nhập

    def get(self, request, *args, **kwargs):
        user = request.user # user là instance của TaiKhoan
        # TaiKhoanPublicSerializer sẽ lấy permissions và groups (giả lập hoặc thật)
        serializer = TaiKhoanPublicSerializer(user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)

# --- DashboardSummaryView (API MỚI) ---
class DashboardSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        user = request.user # TaiKhoan instance
        summary_data = {}
        
        # Lấy vai trò từ user để giả lập (giá trị key, ví dụ: 'manager', 'med_staff')
        user_role_value = user.vai_tro.ten_vai_tro if user.vai_tro else None

        if user_role_value == 'manager':
            summary_data['daily_appointments'] = 30 # Dữ liệu giả
            summary_data['daily_revenue'] = 25500000 # Dữ liệu giả
        elif user_role_value == 'med_staff':
            summary_data['daily_appointments'] = 30 # Dữ liệu giả
            # Nhân viên y tế không thấy doanh thu
        
        # Khi có quyền thật (Giai đoạn 3), bạn sẽ dùng:
        # if user.has_perm('appointments.view_daily_appointment_count'):
        #     summary_data['daily_appointments'] = ...
        # if user.has_perm('reports.view_daily_revenue_summary'):
        #     summary_data['daily_revenue'] = ...

        if not summary_data and user_role_value not in ['manager', 'med_staff']:
             return Response({"message": "Bạn không có quyền xem thông tin tóm tắt."}, status=200)
        elif not summary_data and user_role_value in ['manager', 'med_staff']:
             return Response({"message": "Không có thông tin tóm tắt nào cho vai trò của bạn."}, status=200)

        return Response(summary_data, status=status.HTTP_200_OK)
