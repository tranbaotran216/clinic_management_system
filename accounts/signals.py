from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import ChiTietPKB, Thuoc

@receiver(post_save, sender=ChiTietPKB)
def cap_nhat_so_luong_ton_kho(sender, instance, created, **kwargs):
    if created:
        thuoc = instance.thuoc
        so_luong_ke = instance.so_luong_ke
        
        # Đảm bảo thuốc tồn tại và có đủ số lượng tồn
        if thuoc and thuoc.so_luong_ton >= so_luong_ke:
            thuoc.so_luong_ton -= so_luong_ke
            thuoc.save(update_fields=['so_luong_ton'])
        elif thuoc:
             print(f"CẢNH BÁO: Thuốc {thuoc.ten_thuoc} không đủ số lượng trong kho.")