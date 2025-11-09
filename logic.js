const products = [
 {
  id: 1,
  name: "Classic Watch",
  category: "accessories",
  price: 500, // عدّلت السعر ليكون رقمًا أكبر وأكثر واقعية للمثال
  description: "ساعة كلاسيك جلد طبيعي مقاومة للماء مع ضمان سنة."
 },
 {
  id: 2,
  name: "مصباح القمر ثلاثي الأبعاد",
  category: "Home Decor", // هدايا ديكور منزلي
  price: 250,
  description: "مصباح يعمل باللمس بتصميم القمر ثلاثي الأبعاد، مثالي لغرف النوم."
 },
 {
  id: 3,
  name: "محفظة جلد رجالية",
  category: "Men's Gifts", // هدايا رجالية
  price: 180,
  description: "محفظة جلد طبيعي، تصميم نحيف، تحتوي على حامل بطاقات."
 },
 {
  id: 4,
  name: "قلادة النجمة الماسية",
  category: "Jewelry", // مجوهرات نسائية
  price: 750,
  description: "قلادة أنيقة من الفضة مع حجر ألماس صناعي لامع."
 }
];


const getPrice = (productName) => {
 // التحقق الجديد: تأكد أن productName موجود ومستقبل كـ String
 if (!productName || typeof productName !== 'string') {
  return `آسف، يرجى تحديد اسم المنتج بوضوح في سؤالك.`;
 }

 // 1. استخدم دالة find للبحث عن المنتج المطابق للاسم
 const targetProduct = products.find(product => {
  // يجب أن نضمن أن البحث لا يهتم بحالة الأحرف
  return product.name.toLowerCase() === productName.toLowerCase();
 });

 // 2. استخدم شرط If/Else للتحقق من نتيجة البحث
 if (targetProduct) {
  // 3. إذا وجدنا المنتج، نرجع رسالة السعر
  return `سعر ${targetProduct.name} هو ${targetProduct.price} جنيه. الوصف: ${targetProduct.description}`;
 } else {
  // 4. إذا لم نجده، نرجع رسالة خطأ
  return `آسف، المنتج ${productName} غير موجود في قائمة الهدايا لدينا.`;
 }
};

// ... لا تقم بتعديل دالة getCategory أو module.exports


const getCategory = (categoryName) => {
 // 1. التصفية (Filter): إيجاد جميع المنتجات المطابقة للفئة
 // نستخدم toLowerCase لضمان مطابقة الفئة بغض النظر عن حالة الأحرف
 const filteredProducts = products.filter(product => {
  return product.category.toLowerCase() === categoryName.toLowerCase();
 });

 // 2. التحقق من النتيجة: هل وجدنا أي شيء؟
 if (filteredProducts.length === 0) {
  // إذا كانت المصفوفة فارغة، نعتذر
  return `آسف، لا توجد حاليًا هدايا في فئة "${categoryName}" لدينا.`;
 }

 // 3. التعيين (Map): استخراج الأسماء فقط من المنتجات المصفاة
 // نحول مصفوفة الكائنات إلى مصفوفة سلاسل نصية (أسماء المنتجات فقط)
 const productNames = filteredProducts.map(product => {
  return product.name;
 });

 // 4. الدمج (Join): تحويل مصفوفة الأسماء إلى سلسلة نصية قابلة للقراءة
 // نستخدم "\n" (سطر جديد) للفصل لجعل القائمة مرتبة
 const listString = productNames.join('\n - ');

 // 5. إرجاع القائمة النهائية
 return `تتوفر لدينا المنتجات التالية في فئة "${categoryName}":\n - ${listString}`;
};


// الآن، لجعل هذه الدوال متاحة لأي برنامج آخر (مثل خادم Node.js)
// يجب أن "نُصدرها" (Export) ككائن واحد
module.exports = {
 products,
 getPrice,
 getCategory,
 // يمكننا إضافة أي دالة أخرى نحتاجها هنا
};