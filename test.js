// 1. استيراد (Require) الدوال المصدرة من ملف logic.js
// يجب أن يكون المسار صحيحاً (./logic.js)
const botLogic = require('./logic');

// 2. الوصول إلى الدوال وتخزينها في متغيرات واضحة
const getPrice = botLogic.getPrice;
const getCategory = botLogic.getCategory;
const products = botLogic.products; // يمكننا حتى الوصول إلى مصفوفة المنتجات

// 3. الاختبار الأول: تأكد من أننا نستطيع قراءة عدد المنتجات
console.log(`تم استيراد ${products.length} منتجات بنجاح.`);

// 4. الاختبار الثاني: دالة السعر (نجاح)
console.log('\n--- اختبار السعر (محفظة جلد رجالية) ---');
console.log(getPrice("محفظة جلد رجالية"));

// 5. الاختبار الثالث: دالة الفئة (نجاح)
console.log('\n--- اختبار الفئة (هدايا رجالية) ---');
console.log(getCategory("Men's Gifts"));

// 6. الاختبار الرابع: دالة السعر (فشل)
console.log('\n--- اختبار الفشل (هاتف ذكي) ---');
console.log(getPrice("هاتف ذكي"));