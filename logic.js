// استيراد بيانات المنتجات من ملف data.json
// يتم استخدام require لتحميل ملف JSON مباشرة في Node.js
const data = require('./data.json');
const products = data.products; // استخراج مصفوفة المنتجات من الكائن

/**
 * دالة للحصول على سعر ووصف منتج معين بناءً على اسمه.
 * @param {string} productName - اسم المنتج المراد البحث عنه.
 * @returns {string} - رسالة تحتوي على السعر أو رسالة خطأ.
 */


const getPrice = (productName) => {
 // التحقق: التأكد أن productName موجود ومستقبل كـ String
 if (!productName || typeof productName !== 'string') {
  return `آسف، يرجى تحديد اسم المنتج بوضوح في سؤالك.`;
 }

 // 1. استخدام دالة find للبحث عن المنتج المطابق للاسم
 const targetProduct = products.find(product => {
  // ⬇️ التعديل هنا: استخدام .trim() لإزالة المسافات من الأطراف ⬇️
  return product.name.toLowerCase().trim() === productName.toLowerCase().trim();
 });

 // 2. استخدم شرط If/Else للتحقق من نتيجة البحث
 if (targetProduct) {
  // 3. إذا وجدنا المنتج، نرجع رسالة السعر
  return `سعر ${targetProduct.name} هو ${targetProduct.price} جنيه. الوصف: ${targetProduct.description}`;
 } else {
  // ⬇️ 4. إذا لم نجده كاسم منتج، نحاول البحث كاسم فئة ⬇️

  const categoryResult = getCategory(productName);

  // إذا كان الرد من دالة getCategory لا يحتوي على رسالة خطأ، يعني أنه وجد منتجات
  if (!categoryResult.includes('آسف') && !categoryResult.includes('من فضلك')) {
   return categoryResult;
  }

  // 5. إذا لم نجد لا منتجاً ولا فئة، نرجع رسالة خطأ
  return `آسف، المنتج أو الفئة باسم "${productName}" غير موجود/ة في قائمة الهدايا لدينا.`;
 }
};



/**
 * دالة للحصول على قائمة بالمنتجات في فئة معينة.
 * @param {string} categoryName - اسم الفئة المراد البحث عنها.
 * @returns {string} - رسالة تحتوي على المنتجات أو رسالة خطأ.
 */
const getCategory = (categoryName) => {
 if (!categoryName) {
  return "من فضلك حدد اسم الفئة التي تبحث عنها.";
 }

 // 1. تصفية المنتجات حسب الفئة
 const filteredProducts = products.filter(product =>
  product.category.toLowerCase().includes(categoryName.toLowerCase())
 );

 // 2. التحقق من وجود منتجات في الفئة
 if (filteredProducts.length > 0) {
  const productNames = filteredProducts.map(p => `${p.name} (${p.price} جنيه)`).join('، ');
  return `إليك بعض المنتجات في فئة "${categoryName}": ${productNames}.`;
 } else {
  return `آسف، لا توجد حاليًا هدايا في فئة "${categoryName}" لدينا.`;
 }
};

// تصدير الدوال لاستخدامها في server.js
module.exports = {
 getPrice,
 getCategory,
};