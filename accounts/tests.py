# accounts/tests.py

# --- Các thư viện cần thiết cho việc test ---
from django.urls import reverse  # Dùng để lấy URL từ tên của nó, thay vì viết cứng '/register-appointment/'
from rest_framework import status # Chứa các mã HTTP status code như 200 OK, 201 CREATED, 404 NOT FOUND...
from rest_framework.test import APITestCase # Lớp TestCase đặc biệt của DRF để test API

# --- Import các Model mà chúng ta sẽ tương tác trong test ---
from .models import BenhNhan, DSKham, QuyDinhValue, LoaiQuyDinhValue
from datetime import date, timedelta

# =================================================================================
# BỘ TEST CHO API PUBLICAPPOINTMENTVIEW
# =================================================================================

class PublicAppointmentAPITests(APITestCase):
    """
    Tên class test nên rõ ràng, mô tả chức năng đang được test.
    Chúng ta dùng APITestCase vì nó cung cấp công cụ `self.client` để giả lập các request API.
    """

    def setUp(self):
        """
        Đây là một phương thức đặc biệt. Nó sẽ được CHẠY LẠI TRƯỚC KHI MỖI HÀM TEST (mỗi hàm bắt đầu bằng test_) bắt đầu.
        Mục đích: Tạo ra một môi trường sạch và dữ liệu nền cần thiết cho mỗi bài test.
        """
        print("\nSetting up for a new test...") # Thêm dòng này để bạn thấy nó chạy khi nào

        # 1. Thiết lập quy định: Chỉ cho phép TỐI ĐA 2 bệnh nhân mỗi ngày.
        #    Điều này giúp chúng ta có thể dự đoán được kết quả test.
        #    Chúng ta đang trực tiếp tạo một đối tượng trong model `QuyDinhValue` của bạn.
        QuyDinhValue.objects.create(
            ma_quy_dinh=LoaiQuyDinhValue.SO_BENH_NHAN_TOI_DA,
            gia_tri=2
        )

        # 2. Lấy URL của API endpoint một cách "động".
        #    Thay vì viết cứng url = '/register-appointment/', ta dùng reverse().
        #    `reverse('register-appointment')` sẽ tìm trong file urls.py của bạn dòng nào có name='register-appointment'
        #    và trả về đúng đường dẫn của nó. Điều này rất tốt vì nếu sau này bạn đổi URL, test sẽ không bị hỏng.
        self.url = reverse('register-appointment')


    def test_create_appointment_successfully_when_slot_is_available(self):
        """
        Tên hàm test phải rõ ràng, mô tả trường hợp đang test.
        Đây là kịch bản "happy path" - mọi thứ diễn ra đúng như ý muốn.
        """
        print("-> Running test: test_create_appointment_successfully...")

        # --- ARRANGE (Sắp xếp / Chuẩn bị dữ liệu) ---
        ngay_dang_ky = date.today()
        # Dữ liệu này giả lập những gì người dùng sẽ nhập vào form ở frontend
        appointment_data = {
            "ho_ten": "Nguyễn Thị B",
            "nam_sinh": 1995,
            "gioi_tinh": "F", # 'F' là Nữ theo model của bạn
            "dia_chi": "456 Đường XYZ, Quận 2, TP.HCM",
            "ngay_kham": ngay_dang_ky.isoformat() # Chuyển ngày thành chuỗi dạng 'YYYY-MM-DD'
        }

        # --- ACT (Hành động) ---
        # Dùng `self.client` để giả lập một trình duyệt gửi yêu cầu POST đến URL của chúng ta,
        # đính kèm theo dữ liệu `appointment_data`.
        response = self.client.post(self.url, appointment_data, format='json')

        # --- ASSERT (Khẳng định / Kiểm tra kết quả) ---
        # Đây là phần quan trọng nhất: kiểm tra xem kết quả có đúng như mong đợi không.

        # 1. Khẳng định rằng API trả về mã status 201 CREATED.
        #    Đây là mã tiêu chuẩn cho việc tạo mới tài nguyên thành công.
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        # 2. Khẳng định rằng có ĐÚNG 1 bệnh nhân mới được tạo trong database.
        self.assertEqual(BenhNhan.objects.count(), 1)

        # 3. Khẳng định rằng có ĐÚNG 1 lịch hẹn trong danh sách khám được tạo.
        self.assertEqual(DSKham.objects.count(), 1)

        # 4. Kiểm tra sâu hơn: thông tin của bệnh nhân vừa tạo có đúng không.
        benh_nhan_moi = BenhNhan.objects.first() # Lấy bệnh nhân duy nhất trong DB
        self.assertEqual(benh_nhan_moi.ho_ten, "Nguyễn Thị B")

        # 5. Kiểm tra xem nội dung JSON trả về có đúng không
        self.assertEqual(response.data['message'], "Đăng ký thành công")
        self.assertEqual(response.data['ten_benh_nhan'], "Nguyễn Thị B")


    def test_create_appointment_fails_when_day_is_full(self):
        """
        Kiểm tra kịch bản thất bại: Cố đăng ký khi ngày đã đầy.
        Đây là lúc quy định "2 bệnh nhân/ngày" mà ta đặt trong `setUp` phát huy tác dụng.
        """
        print("-> Running test: test_create_appointment_fails_when_day_is_full...")

        # --- ARRANGE (Sắp xếp / Chuẩn bị dữ liệu) ---
        # Giả lập rằng ngày hôm nay đã có 2 bệnh nhân đăng ký, tức là đã ĐẦY CHỖ.
        ngay_da_day = date.today()
        # Tạo bệnh nhân 1 và lịch khám của họ
        bn1 = BenhNhan.objects.create(ho_ten="Người Đến Sớm 1", nam_sinh=2000, gioi_tinh='M')
        DSKham.objects.create(benh_nhan=bn1, ngay_kham=ngay_da_day)
        # Tạo bệnh nhân 2 và lịch khám của họ
        bn2 = BenhNhan.objects.create(ho_ten="Người Đến Sớm 2", nam_sinh=2001, gioi_tinh='F')
        DSKham.objects.create(benh_nhan=bn2, ngay_kham=ngay_da_day)

        # Bây giờ, DB đã có 2 lịch khám cho ngày hôm nay. Ta chuẩn bị dữ liệu cho người thứ 3.
        appointment_data_for_latecomer = {
            "ho_ten": "Người Đến Muộn",
            "nam_sinh": 1980,
            "gioi_tinh": "M",
            "ngay_kham": ngay_da_day.isoformat()
        }

        # --- ACT (Hành động) ---
        # Người thứ 3 cố gắng đăng ký
        response = self.client.post(self.url, appointment_data_for_latecomer, format='json')

        # --- ASSERT (Khẳng định / Kiểm tra kết quả) ---

        # 1. Khẳng định rằng API trả về mã 400 BAD REQUEST.
        #    Logic này nằm trong `PublicAppointmentSerializer` của bạn, hàm `validate`.
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

        # 2. Khẳng định rằng KHÔNG có bệnh nhân mới nào được tạo thêm. Vẫn chỉ có 2.
        self.assertEqual(BenhNhan.objects.count(), 2)

        # 3. Khẳng định rằng KHÔNG có lịch khám nào được tạo thêm. Vẫn chỉ có 2.
        self.assertEqual(DSKham.objects.count(), 2)

# =================================================================================
# BỘ TEST CHO XÁC THỰC VÀ PHÂN QUYỀN
# =================================================================================

# --- Import thêm các model cần thiết cho bước 2 ---
from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType
from .models import TaiKhoan, HoaDon, PKB # Import các model liên quan



class AuthenticationAndPermissionTests(APITestCase):
    """
    Test các chức năng đăng nhập và kiểm tra quyền truy cập vào các API được bảo vệ.
    """
    def setUp(self):
        """
        Phương thức này chạy trước mỗi bài test trong class này.
        Chúng ta sẽ tạo ra các Group (vai trò) và User (tài khoản) mẫu.
        """
        print("\nSetting up for Authentication/Permission test...")

        # 1. Tạo các vai trò (Groups) cần thiết cho việc test phân quyền.
        #    Tên 'Quản lý' và 'Y tá' phải khớp với những gì bạn dùng trong thực tế.
        self.quanly_group = Group.objects.create(name='Quản lý')
        self.yta_group = Group.objects.create(name='Y tá')

        # 2. Tạo các tài khoản người dùng với các vai trò khác nhau.
        #    Chúng ta dùng `create_user` từ custom manager `TaiKhoanManager` của bạn.
        self.quanly_user = TaiKhoan.objects.create_user(
            ten_dang_nhap='quanly01',
            email='quanly@example.com',
            password='a_strong_password', # Luôn dùng mật khẩu giả trong test
            ho_ten='Sếp Tổng'
        )
        self.yta_user = TaiKhoan.objects.create_user(
            ten_dang_nhap='yta01',
            email='yta@example.com',
            password='a_strong_password',
            ho_ten='Y Tá A'
        )

        # 3. Gán người dùng vào các Group tương ứng.
        self.quanly_user.groups.add(self.quanly_group)
        self.yta_user.groups.add(self.yta_group)

        # 4. Gán quyền xem báo cáo cho Group "Quản lý".
        #    Đây là một bước quan trọng để permission `isManager` của bạn hoạt động đúng.
        #    Trong code `permissions.py` của bạn, `isManager` kiểm tra `request.user.groups.filter(name='Quản lý').exists()`.
        #    Vậy là chúng ta không cần gán permission cụ thể, chỉ cần user thuộc group 'Quản lý' là đủ.
        #    Tuy nhiên, để test `DjangoModelPermissions` cho các view khác, việc gán quyền là cần thiết.
        #    Ví dụ, để user có thể xem hóa đơn:
        content_type = ContentType.objects.get_for_model(HoaDon)
        view_hoadon_permission = Permission.objects.get(
            codename='view_hoadon',
            content_type=content_type,
        )
        self.quanly_group.permissions.add(view_hoadon_permission)
        
        # 5. Lấy các URL cần test.
        self.login_url = reverse('auth_login')
        self.report_url = reverse('report_revenue')

    # --- Test Kịch Bản Đăng Nhập ---
    def test_login_successfully_with_valid_credentials(self):
        """
        Kiểm tra: Đăng nhập thành công với username/password hợp lệ.
        """
        print("-> Running test: test_login_successfully...")
        # ARRANGE: Dữ liệu đăng nhập
        login_data = {
            "ten_dang_nhap": "quanly01",
            "password": "a_strong_password"
        }

        # ACT: Gửi request POST đến login_url
        response = self.client.post(self.login_url, login_data, format='json')

        # ASSERT:
        # 1. Phản hồi phải là 200 OK.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 2. Phản hồi JSON phải chứa 'access' token và 'refresh' token.
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        # 3. Phản hồi phải chứa thông tin user, và tên đăng nhập phải đúng.
        self.assertEqual(response.data['user']['ten_dang_nhap'], 'quanly01')

    def test_login_fails_with_invalid_credentials(self):
        """
        Kiểm tra: Đăng nhập thất bại với password sai.
        """
        print("-> Running test: test_login_fails...")
        # ARRANGE: Dữ liệu đăng nhập với password sai
        login_data = {
            "ten_dang_nhap": "quanly01",
            "password": "wrong_password"
        }

        # ACT: Gửi request POST
        response = self.client.post(self.login_url, login_data, format='json')

        # ASSERT:
        # 1. Phản hồi phải là 401 UNAUTHORIZED (Xác thực thất bại).
        #    View `LoginView` của bạn trả về mã này.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # 2. Token không được tạo ra.
        self.assertNotIn('access', response.data)


    # --- Test Kịch Bản Phân Quyền ---
    def test_access_report_fails_when_unauthenticated(self):
        """
        Kiểm tra: Người dùng CHƯA ĐĂNG NHẬP không thể xem báo cáo.
        """
        print("-> Running test: test_report_access_unauthenticated...")
        # ACT: Gửi request GET đến report_url mà không đăng nhập
        response = self.client.get(self.report_url, {'month': 10, 'year': 2023})
        
        # ASSERT: Phản hồi phải là 401 UNAUTHORIZED.
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_access_report_fails_with_insufficient_permission(self):
        """
        Kiểm tra: Y tá (đã đăng nhập nhưng không có quyền) không thể xem báo cáo.
        """
        print("-> Running test: test_report_access_insufficient_permission...")
        # ARRANGE: "Ép" client phải xác thực như là `yta_user`.
        # Đây là công cụ cực mạnh của APITestCase, không cần phải login thật.
        self.client.force_authenticate(user=self.yta_user)
        
        # ACT: Gửi request
        response = self.client.get(self.report_url, {'month': 10, 'year': 2023})
        
        # ASSERT: Phản hồi phải là 403 FORBIDDEN (Cấm truy cập).
        # View của bạn trả về lỗi này do permission `isManager`.
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        # Kiểm tra thông báo lỗi có đúng như trong `permissions.py` không
        self.assertEqual(response.data['detail'], "Chỉ Quản lý hoặc Superuser mới có quyền thực hiện hành động này.")

    def test_access_report_succeeds_for_manager(self):
        """
        Kiểm tra: Quản lý (đã đăng nhập và có quyền) xem báo cáo thành công.
        """
        print("-> Running test: test_report_access_succeeds_for_manager...")
        # ARRANGE: Ép client xác thực như là `quanly_user`.
        self.client.force_authenticate(user=self.quanly_user)
        
        # ACT: Gửi request
        response = self.client.get(self.report_url, {'month': 10, 'year': 2023})
        
        # ASSERT: Phản hồi phải là 200 OK.
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        

# accounts/tests.py
# (Giữ nguyên các import và các class test cũ)

# --- Import thêm các model cần thiết cho bước 3 ---
from .models import LoaiBenh, DonViTinh, CachDung, Thuoc, BenhNhan, ChiTietPKB
from decimal import Decimal

# =================================================================================
# BỘ TEST CHO LOGIC NGHIỆP VỤ (MODELS)
# =================================================================================

class BusinessLogicTests(APITestCase):
    """
    Test các phương thức tính toán và logic nghiệp vụ bên trong các model.
    Loại test này không cần gọi API, nó tương tác trực tiếp với các đối tượng Python.
    """

    def setUp(self):
        """
        Tạo dữ liệu nền cần thiết: Bệnh nhân, Thuốc, Quy định...
        """
        print("\nSetting up for Business Logic test...")

        # --- Tạo các dữ liệu danh mục ---
        self.don_vi_tinh = DonViTinh.objects.create(ten_don_vi_tinh='Viên')
        self.cach_dung = CachDung.objects.create(ten_cach_dung='Uống sau ăn')
        self.loai_benh = LoaiBenh.objects.create(ten_loai_benh='Cảm cúm')

        # --- Tạo các loại thuốc với giá khác nhau ---
        self.thuoc_a = Thuoc.objects.create(
            ten_thuoc='Paracetamol 500mg',
            don_vi_tinh=self.don_vi_tinh,
            don_gia=Decimal('1000'),
            so_luong_ton=100 # <<--- THÊM DÒNG NÀY (Giả sử trong kho có 100 viên)
        )
        self.thuoc_b = Thuoc.objects.create(
            ten_thuoc='Vitamin C',
            don_vi_tinh=self.don_vi_tinh,
            don_gia=Decimal('2500'),
            so_luong_ton=200 # <<--- THÊM DÒNG NÀY (Giả sử trong kho có 200 viên)
)
        
        # --- Tạo một bệnh nhân ---
        self.benh_nhan = BenhNhan.objects.create(ho_ten='Trần Văn Test', nam_sinh=1988)

        # --- Thiết lập quy định về tiền khám ---
        QuyDinhValue.objects.create(
            ma_quy_dinh=LoaiQuyDinhValue.TIEN_KHAM_CO_BAN,
            gia_tri=50000 # Giả định tiền khám là 50,000
        )

    def test_calculate_medication_cost_correctly(self):
        """
        Kiểm tra: Phương thức `tinh_tien_thuoc()` của model PKB tính toán chính xác.
        """
        print("-> Running test: test_calculate_medication_cost...")
        
        # --- ARRANGE (Sắp xếp) ---
        # 1. Tạo một Phiếu Khám Bệnh (PKB)
        pkb = PKB.objects.create(
            ngay_kham=date.today(),
            benh_nhan=self.benh_nhan,
            loai_benh_chuan_doan=self.loai_benh
        )

        # 2. Thêm các chi tiết đơn thuốc (ChiTietPKB) vào phiếu khám đó.
        #    Đây là các "hàng" trong đơn thuốc.
        ChiTietPKB.objects.create(
            phieu_kham_benh=pkb,
            thuoc=self.thuoc_a, # Paracetamol (1000đ)
            so_luong_ke=10      # Số lượng: 10
        )
        ChiTietPKB.objects.create(
            phieu_kham_benh=pkb,
            thuoc=self.thuoc_b, # Vitamin C (2500đ)
            so_luong_ke=4       # Số lượng: 4
        )

        # --- ACT (Hành động) ---
        # Gọi trực tiếp phương thức `tinh_tien_thuoc` trên đối tượng `pkb`.
        tong_tien_thuoc_tinh_toan = pkb.tinh_tien_thuoc()

        # --- ASSERT (Khẳng định) ---
        # Tính toán kết quả mong đợi: (1000 * 10) + (2500 * 4) = 10000 + 10000 = 20000
        ket_qua_mong_doi = Decimal('20000')
        self.assertEqual(tong_tien_thuoc_tinh_toan, ket_qua_mong_doi)


    def test_create_invoice_from_medical_record(self):
        """
        Kiểm tra: Phương thức `tao_hoac_cap_nhat_hoa_don()` tạo ra hóa đơn đúng.
        """
        print("-> Running test: test_create_invoice_from_record...")

        # --- ARRANGE (Sắp xếp) ---
        # 1. Tạo một Phiếu Khám Bệnh (PKB) và các chi tiết đơn thuốc
        pkb = PKB.objects.create(
            ngay_kham=date.today(),
            benh_nhan=self.benh_nhan
        )
        ChiTietPKB.objects.create(phieu_kham_benh=pkb, thuoc=self.thuoc_a, so_luong_ke=5) # 5 * 1000 = 5000
        ChiTietPKB.objects.create(phieu_kham_benh=pkb, thuoc=self.thuoc_b, so_luong_ke=2) # 2 * 2500 = 5000

        # --- ACT (Hành động) ---
        # Gọi phương thức để tạo hóa đơn
        hoa_don_moi = pkb.tao_hoac_cap_nhat_hoa_don()
        
        # --- ASSERT (Khẳng định) ---
        # 1. Kiểm tra xem có đúng 1 hóa đơn được tạo trong DB không.
        self.assertEqual(HoaDon.objects.count(), 1)
        
        # 2. Kiểm tra các giá trị trong hóa đơn vừa tạo.
        self.assertEqual(hoa_don_moi.phieu_kham_benh, pkb)
        
        # Tiền khám phải bằng giá trị trong quy định (50000)
        self.assertEqual(hoa_don_moi.tien_kham, Decimal('50000'))
        
        # Tiền thuốc phải bằng (5*1000) + (2*2500) = 10000
        self.assertEqual(hoa_don_moi.tien_thuoc, Decimal('10000'))
        
        # 3. Kiểm tra hàm `tong_tien` của HoaDon.
        #    Tổng tiền = tiền khám + tiền thuốc = 50000 + 10000 = 60000
        self.assertEqual(hoa_don_moi.tong_tien, Decimal('60000'))
        
# accounts/tests.py
# (Giữ nguyên các import và các class test cũ)

# =================================================================================
# BỘ TEST CHO DJANGO SIGNALS
# =================================================================================

class SignalTests(APITestCase):
    """
    Test các hàm receivers trong file signals.py.
    Cụ thể là kiểm tra việc tự động cập nhật tồn kho khi kê đơn.
    """
    def setUp(self):
        """
        Tạo dữ liệu nền cần thiết.
        """
        print("\nSetting up for Signal test...")
        self.don_vi_tinh = DonViTinh.objects.create(ten_don_vi_tinh='Vỉ')
        self.benh_nhan = BenhNhan.objects.create(ho_ten='Bệnh Nhân Signal')
        self.pkb = PKB.objects.create(ngay_kham=date.today(), benh_nhan=self.benh_nhan)
        
        # Tạo một loại thuốc với số lượng tồn kho cụ thể để test
        self.thuoc_test = Thuoc.objects.create(
            ten_thuoc='Aspirin',
            don_vi_tinh=self.don_vi_tinh,
            don_gia=Decimal('500'),
            so_luong_ton=50  # Ban đầu có 50 viên trong kho
        )

    def test_inventory_is_deducted_on_successful_prescription(self):
        """
        Kiểm tra: Tồn kho được trừ đúng khi kê đơn thành công.
        """
        print("-> Running test: test_inventory_deduction...")

        # --- ARRANGE (Sắp xếp) ---
        # Tồn kho ban đầu là 50. Chúng ta sẽ kê 10 viên.
        so_luong_ke_don = 10
        
        # --- ACT (Hành động) ---
        # Tạo một chi tiết đơn thuốc. Hành động này sẽ kích hoạt signal `post_save`.
        ChiTietPKB.objects.create(
            phieu_kham_benh=self.pkb,
            thuoc=self.thuoc_test,
            so_luong_ke=so_luong_ke_don
        )

        # --- ASSERT (Khẳng định) ---
        # 1. Lấy lại thông tin của thuốc đó từ database để đảm bảo dữ liệu là mới nhất.
        self.thuoc_test.refresh_from_db()
        
        # 2. Khẳng định rằng số lượng tồn kho mới phải là 50 - 10 = 40.
        self.assertEqual(self.thuoc_test.so_luong_ton, 40)

    def test_inventory_is_not_changed_when_insufficient(self):
        """
        Kiểm tra: Tồn kho KHÔNG thay đổi khi kê đơn quá số lượng hiện có.
        """
        print("-> Running test: test_inventory_insufficient...")

        # --- ARRANGE (Sắp xếp) ---
        # Tồn kho ban đầu là 50. Chúng ta sẽ cố gắng kê 100 viên (nhiều hơn tồn kho).
        so_luong_ke_don_qua_muc = 100

        # --- ACT (Hành động) ---
        # Tạo chi tiết đơn thuốc, hành động này sẽ kích hoạt signal.
        # Signal sẽ kiểm tra và đi vào nhánh `elif` (in ra cảnh báo) chứ không trừ kho.
        ChiTietPKB.objects.create(
            phieu_kham_benh=self.pkb,
            thuoc=self.thuoc_test,
            so_luong_ke=so_luong_ke_don_qua_muc
        )

        # --- ASSERT (Khẳng định) ---
        # 1. Lấy lại thông tin của thuốc từ database.
        self.thuoc_test.refresh_from_db()

        # 2. Khẳng định rằng số lượng tồn kho VẪN LÀ 50, không thay đổi.
        self.assertEqual(self.thuoc_test.so_luong_ton, 50)