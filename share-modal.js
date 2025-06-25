// share-modal.js - نسخة آمنة لا تعطي خطأ لو العنصر غير موجود

// عدل الـ ID هنا ليطابق الزر أو العنصر الذي تريده
const shareBtn = document.getElementById('share-btn');
if (shareBtn) {
  shareBtn.addEventListener('click', function () {
    // مثال: فتح نافذة مشاركة أو تنفيذ أي كود تريده
    if (navigator.share) {
      navigator.share({
        title: document.title,
        url: window.location.href
      }).catch(() => {});
    } else {
      alert("ميزة المشاركة غير مدعومة في هذا المتصفح.");
    }
  });
}

// إذا كان لديك عناصر أخرى في الملف، ضع كل واحدة في if (العنصر) بنفس الطريقة
