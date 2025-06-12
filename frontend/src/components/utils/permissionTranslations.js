// Đây là nơi bạn định nghĩa tất cả các bản dịch cho quyền
// Key: là chuỗi "app_label.codename" mà backend trả về
// Value: là chuỗi Tiếng Việt bạn muốn hiển thị

export const permissionTranslations = {
  // === QUẢN LÝ NGƯỜI DÙNG & VAI TRÒ ===
  'accounts.add_taikhoan': 'Thêm mới Tài khoản',
  'accounts.change_taikhoan': 'Cập nhật thông tin Tài khoản',
  'accounts.delete_taikhoan': 'Xóa Tài khoản',
  'accounts.view_taikhoan': 'Xem danh sách Tài khoản',

  'auth.add_group': 'Thêm mới Vai trò',
  'auth.change_group': 'Cập nhật Vai trò',
  'auth.delete_group': 'Xóa Vai trò',
  'auth.view_group': 'Xem danh sách Vai trò',
  
  // === NGHIỆP VỤ KHÁM CHỮA BỆNH ===
  'accounts.add_benhnhan': 'Thêm mới Bệnh nhân',
  'accounts.change_benhnhan': 'Cập nhật thông tin Bệnh nhân',
  'accounts.delete_benhnhan': 'Xóa Bệnh nhân',
  'accounts.view_benhnhan': 'Xem Bệnh nhân',

  'accounts.add_dskham': 'Thêm mới danh sách khám',
  'accounts.change_dskham': 'Cập nhật Danh sách khám',
  'accounts.delete_dskham': 'Xóa danh sách khám',
  'accounts.view_dskham': 'Xem danh sách Khám',

  'accounts.add_pkb': 'Tạo mới Phiếu khám bệnh',
  'accounts.change_pkb': 'Cập nhật Phiếu khám bệnh',
  'accounts.delete_pkb': 'Xóa Phiếu khám bệnh',
  'accounts.view_pkb': 'Xem danh sách Phiếu khám bệnh',

  'accounts.add_chitietpkb': 'Thêm thuốc vào đơn',
  'accounts.change_chitietpkb': 'Cập nhật thuốc trong đơn',
  'accounts.delete_chitietpkb': 'Xóa thuốc khỏi đơn',
  'accounts.view_chitietpkb': 'Xem chi tiết đơn thuốc',

  // === QUẢN LÝ HÓA ĐƠN & THANH TOÁN ===
  'accounts.add_hoadon': 'Tạo mới Hóa đơn',
  'accounts.change_hoadon': 'Cập nhật Hóa đơn',
  'accounts.delete_hoadon': 'Xóa Hóa đơn',
  'accounts.view_hoadon': 'Xem Hóa đơn',
  
  // === QUẢN LÝ DƯỢC ===
  'accounts.add_thuoc': 'Thêm mới Thuốc',
  'accounts.change_thuoc': 'Cập nhật thông tin Thuốc',
  'accounts.delete_thuoc': 'Xóa Thuốc',
  'accounts.view_thuoc': 'Xem danh mục Thuốc',

  'accounts.add_cachdung': 'Thêm mới Cách dùng',
  'accounts.change_cachdung': 'Cập nhật Cách dùng',
  'accounts.delete_cachdung': 'Xóa Cách dùng',
  'accounts.view_cachdung': 'Xem danh mục Cách dùng',

  'accounts.add_donvitinh': 'Thêm mới Đơn vị tính',
  'accounts.change_donvitinh': 'Cập nhật Đơn vị tính',
  'accounts.delete_donvitinh': 'Xóa Đơn vị tính',
  'accounts.view_donvitinh': 'Xem danh mục Đơn vị tính',
  
  'accounts.add_loaibenh': 'Thêm mới Loại bệnh',
  'accounts.change_loaibenh': 'Cập nhật Loại bệnh',
  'accounts.delete_loaibenh': 'Xóa Loại bệnh',
  'accounts.view_loaibenh': 'Xem danh mục Loại bệnh',

  // === QUYỀN HỆ THỐNG (THƯỜNG NÊN ẨN VỚI NGƯỜI DÙNG THÔNG THƯỜNG) ===
  'admin.add_logentry': 'Thêm nhật ký hệ thống',
  'admin.change_logentry': 'Sửa nhật ký hệ thống',
  'admin.delete_logentry': 'Xóa nhật ký hệ thống',
  'admin.view_logentry': 'Xem nhật ký hệ thống',

  'auth.add_permission': 'Thêm mới Quyền hệ thống',
  'auth.change_permission': 'Sửa Quyền hệ thống',
  'auth.delete_permission': 'Xóa Quyền hệ thống',
  'auth.view_permission': 'Xem danh sách Quyền hệ thống',

  'contenttypes.add_contenttype': 'Thêm Loại nội dung',
  'contenttypes.change_contenttype': 'Sửa Loại nội dung',
  'contenttypes.delete_contenttype': 'Xóa Loại nội dung',
  'contenttypes.view_contenttype': 'Xem Loại nội dung',

  'sessions.add_session': 'Thêm Phiên làm việc',
  'sessions.change_session': 'Sửa Phiên làm việc',
  'sessions.delete_session': 'Xóa Phiên làm việc',
  'sessions.view_session': 'Xem Phiên làm việc',
};

/**
 * Dịch một codename của quyền sang Tiếng Việt.
 * Nếu không tìm thấy bản dịch, sẽ trả về chính codename đó.
 * @param {string} codename - Chuỗi codename đầy đủ, ví dụ: 'accounts.add_benhnhan'.
 * @returns {string} - Chuỗi Tiếng Việt hoặc codename gốc.
 */
export const getPermissionTranslation = (codename) => {
  return permissionTranslations[codename] || codename;
};

