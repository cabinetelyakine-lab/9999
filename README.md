# تطبيق إدارة وتأطير مراكز ومكاتب الانتخابات

برنامج مخصص لإدارة وتأطير مراكز ومكاتب التصويت، فلترة وتعيين المؤطرين، والبحث السريع وتصدير التقارير وجداول التأطير الرسمية لبلدية عين الدفلى.

---

## 💻 البناء التلقائي لبرنامج ويندوز (Windows .exe) عبر GitHub Actions

تم تجهيز ملف العمل التلقائي: `.github/workflows/build-exe.yml`

### خطوات الحصول على ملف الـ `.exe`:
1. ارفع المشروع إلى مستودعك في **GitHub**.
2. توجّه إلى تبويب **Actions** في صفحة المشروع على GitHub.
3. اختر من القائمة الجانبية: **Build Windows EXE**.
4. اضغط على زر **Run workflow** ثم اختر الفرع (Main / Master) واضغط **Run workflow**.
5. بمجرد اكتمال البناء (علامة صح خضراء ✔️):
   - افتح تفاصيل البناء وستجد في الأسفل قسم **Artifacts**.
   - حمّل الملف المضغوط: `Election-Staffing-Windows-EXE`.
   - ستجد داخله:
     - **نسخة تثبيت (Setup.exe):** لتثبيت البرنامج على الكمبيوتر مع إنشاء اختصار على سطح المكتب.
     - **نسخة محمولة (Portable.exe):** تعمل مباشرة بنقرة واحدة بدون الحاجة لتثبيت (ممتازة لأجهزة المكاتب الإدارية).

---

## 🚀 كيفية تحويل المشروع إلى تطبيق هاتف (Android / iOS) باستخدام Capacitor

### 1. تثبيت الحزم (Dependencies)
```bash
npm install
```

### 2. تثبيت حزم Capacitor
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios
```

### 3. تهيئة وبناء المشروع (Build)
```bash
npm run build
```

### 4. إضافة منصة أندرويد (أو iOS)
```bash
npx cap add android
# أو npx cap add ios
```

### 5. مزامنة الملفات وفتح المشروع في Android Studio
```bash
npx cap sync
npx cap open android
```

### 6. إنشاء ملف الـ APK النهائي
من داخل **Android Studio**:
- اذهب إلى القائمة: `Build` > `Build Bundle(s) / APK(s)` > `Build APK(s)`.
