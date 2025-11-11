// استيراد بيانات المنتجات من ملف data.json
// يتم استخدام require لتحميل ملف JSON مباشرة في Node.js
const data = require('./data.json');
const products = data.products; // استخراج مصفوفة المنتجات من الكائن
// ... (بقية الكود) ...

/**
 * دالة للحصول على سعر ووصف منتج معين بناءً على اسمه.
 * تم تحديثها لاستخدام البحث الجزئي (includes) بدلاً من التطابق التام (===).
 * @param {string} productName - اسم المنتج المراد البحث عنه.
 * @returns {string} - رسالة تحتوي على السعر أو رسالة خطأ.
 */
const getPrice = (productName) => {
 // التحقق الأولي:
 if (!productName || typeof productName !== 'string') {
  return `آسف، يرجى تحديد اسم المنتج بوضوح في سؤالك.`;
 }

 // 1. تنظيف الاسم من أحرف الجر والمسافات
 let cleanProductName = productName.trim();

 // مثال: يحول "بسلسلة فضة نسائية" إلى "سلسلة فضة نسائية"
 if (cleanProductName.startsWith('ب') && cleanProductName.length > 1) {
  cleanProductName = cleanProductName.substring(1).trim();
 }

 // ⬇️ التغيير الحاسم: استخدام .filter والـ .includes ⬇️
 // نبحث عن المنتجات التي يحتوي اسمها على جزء من اسم المنتج المُدخل
 const potentialProducts = products.filter(product => {
  // البحث الآن سيستخدم cleanProductName (الخالي من الباء)
  return product.name.toLowerCase().includes(cleanProductName.toLowerCase().trim());
 });
 // ⬆️ نهاية التغيير الحاسم ⬆️


 // 3. التحقق من نتيجة البحث واختيار أفضل تطابق
 if (potentialProducts.length > 0) {
  // نختار أفضل تطابق (الأطول هو الأفضل، أو نختار أول واحد)
  let targetProduct = potentialProducts[0];

  // إذا كان هناك أكثر من منتج، يمكننا استخدام منطق لاختيار الأقرب
  if (potentialProducts.length > 1) {
   // منطق لاختيار المنتج الذي يطابق الاسم المدخل بشكل كامل أولاً
   const exactMatch = potentialProducts.find(p => p.name.toLowerCase().trim() === cleanProductName.toLowerCase().trim());
   if (exactMatch) {
    targetProduct = exactMatch;
   }
  }

  // ⬇️ التعديل الحاسم: إضافة رابط الشراء مباشرة إلى الرد ⬇️
  return `سعر ${targetProduct.name} هو ${targetProduct.price} جنيه. الوصف: ${targetProduct.description}. يمكنك طلب هذا المنتج الآن مباشرة من هنا: https://yourstore.com/checkout`;
 } else {
  // ⬇️ 4. إذا لم نجده كاسم منتج، نحاول البحث كاسم فئة (كما كان سابقاً) ⬇️

  const categoryResult = getCategory(productName);

  if (!categoryResult.includes('آسف') && !categoryResult.includes('من فضلك')) {
   return categoryResult;
  }

  // 5. إذا لم نجد لا منتجاً ولا فئة، نرجع رسالة خطأ
  return `آسف، المنتج أو الفئة باسم "${productName}" غير موجود/ة في قائمة الهدايا لدينا.`;
 }
};

// ... (بقية الكود) ...



// خريطة لترجمة الأسماء العربية الشائعة للفئات إلى الاسم الإنجليزي المستخدم في data.json
const categoryMap = {
 'مجوهرات': 'Jewelry',
 'إلكترونيات': 'Electronics',
 'الكترونيات': 'Electronics',
 "هدايا رجالية": "Men's Gifts",
 // أضف المزيد من الفئات هنا إذا لزم الأمر
};

/**
 * دالة للحصول على قائمة بالمنتجات في فئة معينة.
 * @param {string} categoryName - اسم الفئة المراد البحث عنها (قد يكون عربي أو إنجليزي).
 * @returns {string} - رسالة تحتوي على المنتجات أو رسالة خطأ.
 */
const getCategory = (categoryName) => {
 if (!categoryName) {
  return "من فضلك حدد اسم الفئة التي تبحث عنها.";
 }

 // ⬇️ التعديل النهائي والحاسم لإزالة الـ (التعريف) ⬇️
 // 1. تنظيف القيمة من المسافات وتحويلها لحروف صغيرة
 let cleanCategoryName = categoryName.toLowerCase().trim();

 // 2. إزالة "الـ" من بداية الكلمة (لحل مشكلة المجوهرات)
 // يتحقق مما إذا كانت تبدأ بـ "ال" ولديه حرف آخر بعدها
 if (cleanCategoryName.startsWith('ال') && cleanCategoryName.length > 2) {
  cleanCategoryName = cleanCategoryName.substring(2).trim();
 }

 // 3. محاولة ترجمة الاسم العربي إلى نظيره الإنجليزي في الخريطة
 let searchCategory = categoryMap[cleanCategoryName] || categoryName;

 // توحيد الاسم الذي سنبحث به (سواء كان 'Jewelry' أو 'Electronics')
 searchCategory = searchCategory.toLowerCase().trim();

 // 4. تصفية المنتجات حسب الفئة
 const filteredProducts = products.filter(product =>
  product.category.toLowerCase().trim() === searchCategory
 );

 // 3. التحقق من وجود منتجات في الفئة
 if (filteredProducts.length > 0) {
  const productNames = filteredProducts.map(p => `${p.name} (${p.price} جنيه)`).join('، ');
  // نستخدم اسم الفئة الأصلي الذي أدخله المستخدم في الرد (الأكثر منطقية للعميل)
  return `إليك بعض المنتجات في فئة "${categoryName}": ${productNames}.`;
 } else {
  return `آسف، لا توجد حاليًا هدايا في فئة "${categoryName}" لدينا.`;
 }
};
// ... (في نهاية ملف logic.js، قبل module.exports) ...

/**
 * دالة لمعالجة طلبات الشراء وتوجيه المستخدم لصفحة الدفع.
 * @param {string} productName - اسم المنتج الذي يريد المستخدم شراءه.
 * @returns {string} - رسالة توجيهية مع رابط الشراء.
 */
const handleCheckout = (productName) => {
 // 1. يمكننا البحث عن المنتج للتأكد من وجوده (اختياري)
 const targetProduct = products.find(product =>
  product.name.toLowerCase().trim() === productName.toLowerCase().trim()
 );

 if (targetProduct) {
  // إذا وجدنا المنتج، نعرض اسمه بوضوح في رسالة الشراء
  return `لشراء منتج "${targetProduct.name}"، يرجى إتمام طلبك عبر الرابط التالي: https://yourstore.com/checkout`;
 } else {
  // إذا لم يحدد المنتج، نرسل رابط المتجر العام
  return `شكراً لاهتمامك. يرجى إتمام عملية الشراء لطلبك عبر الرابط التالي: https://yourstore.com/checkout`;
 }
};

// ... (تأكد من إضافة الدالة إلى module.exports) ...
module.exports = {
 getPrice,
 getCategory,
 handleCheckout, // ⬅️ أضف هذه السطر
};