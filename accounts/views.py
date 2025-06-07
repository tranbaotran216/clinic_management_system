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

def main(request): # this is the main func
    return HttpResponse("<h1>Hello, world.</h1>")