// This is a dummy change to force Vercel to rebuild cache.
const express = require('express');
const bodyParser = require('body-parser');
// استيراد بيانات المنتجات من ملف data.json
// يتم استخدام require لتحميل ملف JSON مباشرة في Node.js
const data = require('./data.json');
const products = data.products; // استخراج مصفوفة المنتجات من الكائن
// ⬅️ نغير طريقة تعريف الرقم هنا
const STORE_CONTACT_NUMBER = '01013080898'; // الرقم للعرض كنص
const STORE_CONTACT_WHATSAPP = '201013080898'; // الرقم بالتنسيق الدولي (مثال: 201013080898)
// ⬅️ بناء رابط واتساب القابل للنقر
const WHATSAPP_LINK = `https://wa.me/${STORE_CONTACT_WHATSAPP}`;




/**
 * دالة للحصول على سعر ووصف منتج معين بناءً على اسمه.
 * ...
 */
const getPrice = (productName) => {
 // ⬅️ 1. تعريف المتغير في النطاق الخارجي (Scope)
 let targetProduct = null; // نضع قيمة مبدئية

 // التحقق الأولي:
 if (!productName || typeof productName !== 'string') {
  return `آسف، يرجى تحديد اسم المنتج بوضوح في سؤالك.`;
 }

 // 2. تنظيف الاسم من أحرف الجر والمسافات
 let cleanProductName = productName.trim().toLowerCase();

 // مثال: يحول "بسلسلة فضة نسائية" إلى "سلسلة فضة نسائية"
 if (cleanProductName.startsWith('ب') && cleanProductName.length > 1) {
  cleanProductName = cleanProductName.substring(1).trim().toLowerCase();
 }

 // ⬇️ التغيير الحاسم: استخدام .filter والـ .includes ⬇️
 const potentialProducts = products.filter(product => {
  return product.name.toLowerCase().includes(cleanProductName);
 });
 // ⬆️ نهاية التغيير الحاسم ⬆️


 // 3. التحقق من نتيجة البحث واختيار أفضل تطابق
 if (potentialProducts.length > 0) {
  // ⬅️ لا نستخدم 'let' هنا، نستخدم المتغير المعرف في البداية
  targetProduct = potentialProducts[0];

  // إذا كان هناك أكثر من منتج، يمكننا استخدام منطق لاختيار الأقرب
  if (potentialProducts.length > 1) {
   const exactMatch = potentialProducts.find(p =>
    p.name.toLowerCase().trim() === cleanProductName
   );
   if (exactMatch) {
    targetProduct = exactMatch;
   }
  }

  // ⬇️ 4. إذا وجدنا المنتج، نرجع الرد هنا مباشرة ⬇️
  return `سعر ${targetProduct.name} هو ${targetProduct.price} جنيه.\nالوصف: ${targetProduct.description}.\n**لطلب المنتج، يرجى التواصل مباشرة مع صاحب المتجر عبر الاتصال أو واتساب:**\n📞 رقم التواصل: **[${STORE_CONTACT_NUMBER}](${WHATSAPP_LINK})**`;
 } else {
  // ⬇️ 5. إذا لم نجده كاسم منتج، نحاول البحث كاسم فئة (كما كان سابقاً) ⬇️

  const categoryResult = getCategory(productName);

  if (!categoryResult.includes('آسف') && !categoryResult.includes('من فضلك')) {
   return categoryResult;
  }

  // 6. إذا لم نجد لا منتجاً ولا فئة، نرجع رسالة خطأ
  return `آسف، المنتج أو الفئة باسم "${productName}" غير موجود/ة في قائمة الهدايا لدينا.`;
 }
}; // ⬅️ انتهت الدالة هنا




// خريطة لترجمة الأسماء العربية الشائعة للفئات إلى الاسم الإنجليزي المستخدم في data.json
// ... (في logic.js) ...
const categoryMap = {
 'مجوهرات': 'Jewelry',
 // ...
 "هدايا رجالية": "Men's Gifts",
 'home goods': 'Home Goods',
 'مستلزمات منزلية': 'Home Goods', // ⬅️ تأكد من إضافة هذا السطر
};



/**
 * دالة للحصول على قائمة بالمنتجات في فئة معينة.
 * @param {string} categoryName - اسم الفئة المراد البحث عنها (قد يكون عربي أو إنجليزي).
 * @returns {string} - رسالة تحتوي على المنتجات أو رسالة خطأ.
 */
/**
 * دالة للحصول على قائمة بالمنتجات في فئة معينة، تم تعديلها لإرجاع Custom Payload
 * يحتوي على أزرار مضمنة (Inline Buttons) في تليجرام.
 */
/**
 * دالة للحصول على قائمة بالمنتجات في فئة معينة، تم تعديلها لإرجاع Custom Payload
 * يحتوي على أزرار مضمنة (Inline Buttons) في تليجرام.
 */
const getCategory = (categoryName) => {
 if (!categoryName) {
  return { fulfillmentText: "من فضلك حدد اسم الفئة التي تبحث عنها." };
 }

 // 1. تنظيف القيمة من المسافات وتحويلها لحروف صغيرة
 let cleanCategoryName = categoryName.toLowerCase().trim();

 // 2. إزالة "الـ" من بداية الكلمة 
 if (cleanCategoryName.startsWith('ال') && cleanCategoryName.length > 2) {
  cleanCategoryName = cleanCategoryName.substring(2).trim();
 }

 // 3. محاولة ترجمة الاسم العربي إلى نظيره الإنجليزي في الخريطة
 let searchCategory = categoryMap[cleanCategoryName] || categoryName;

 // 4. توحيد الاسم الذي سنبحث به (سواء كان 'Jewelry' أو 'Electronics')
 searchCategory = searchCategory.toLowerCase().trim();

 // 5. تصفية المنتجات حسب الفئة
 const filteredProducts = products.filter(product =>
  product.category.toLowerCase().trim() === searchCategory
 );

 // 3. التحقق من وجود منتجات في الفئة
 if (filteredProducts.length > 0) {

  // ⬅️ 1. بناء مصفوفة الأزرار: كل منتج في صف منفصل
  const productButtons = filteredProducts.map(product => {
   return [{
    text: product.name, // اسم المنتج الظاهر على الزر
    // عند النقر، نرسل طلب نصي بسيط لـ Dialogflow ليبحث عن السعر مباشرة
    // (سنتأكد لاحقًا أن دالة getPrice تستطيع التعامل مع هذا النص)
    callback_data: `سعر ${product.name}`
   }];
  });

  // ⬅️ 2. إرجاع Custom Payload متوافق مع Dialogflow وتليجرام
  return {
   fulfillmentText: `🛒 المنتجات المتاحة في فئة "${categoryName}"، اختر المنتج الذي تريده:`, // النص العادي (احتياطي)
   fulfillmentMessages: [{
    "platform": "telegram",
    "payload": {
     "telegram": {
      "text": `🛒 المنتجات المتاحة في فئة "${categoryName}". اختر المنتج الذي تريده:`,
      "reply_markup": {
       "inline_keyboard": productButtons // مصفوفة الأزرار التي بنيناها
      }
     }
    }
   }]
  };

 } else {
  // في حالة عدم وجود منتجات، نعود بالرسالة النصية العادية
  return {
   fulfillmentText: `آسف، لا توجد حاليًا هدايا في فئة "${categoryName}" لدينا.`
  };
 }
};



// ... (في نهاية ملف logic.js، قبل module.exports) ...
/**
 * دالة لمعالجة طلبات الشراء وتوجيه المستخدم لصفحة الدفع.
 * @param {string} productName - اسم المنتج الذي يريد المستخدم شراءه.
 * @returns {string} - رسالة توجيهية مع رابط الشراء.
 */
// ... (بعد دالة getCategory)
// ⬇️ استقبال المتغير الجديد: originalQuery ⬇️
// ⬇️ استقبال المتغير الجديد: originalQuery ⬇️
const getPriceRange = (min, max, originalQuery) => {
 // 1. استخلاص القيمة الافتراضية
 let minPrice = 0;
 let maxPrice = Infinity;

 // ⬇️ منطق استخلاص الرقم من النص الأصلي (Regex) ⬇️
 const matches = originalQuery.match(/(\d+)/g); // نستخدم g لاستخلاص كل الأرقام

 // إذا وجدنا أي أرقام
 if (matches && matches.length > 0) {

  // 1. حالة النطاق المزدوج ("بين X و Y")
  if (originalQuery.includes('بين') && matches.length >= 2) {
   // ... (منطق النطاق المزدوج كما هو) ...

  } else {
   // 2. تجميع كل الكلمات التي تعني "الحد الأدنى"
   const isMinLimit = originalQuery.includes('أكثر من') ||
    originalQuery.includes('أكبر من') ||
    originalQuery.includes('تزيد عن') ||
    originalQuery.includes('فوق');

   // 3. تجميع كل الكلمات التي تعني "الحد الأقصى" (نستبعد كلمة 'جنية' من الشروط الصارمة)
   const isMaxLimit = originalQuery.includes('أقل من') ||
    originalQuery.includes('ينقص عن') ||
    originalQuery.includes('تحت') ||
    originalQuery.includes('أقصى سعر'); // ⬅️ إضافة أقصى سعر

   // 4. تطبيق المنطق: نُعطي أولوية مطلقة للنية (أكثر من/أقل من)
   if (isMinLimit) { // ⬅️ نعطي الأولوية للحد الأدنى (الأكثر تخصصاً)
    minPrice = parseInt(matches[0]);
    maxPrice = Infinity;

   } else if (isMaxLimit) { // ⬅️ ثم الحد الأقصى (الأكثر تخصصاً)
    maxPrice = parseInt(matches[0]);
    minPrice = 0;

   } else {
    // 5. حالة الرقم المفرد (افتراضياً: حد أقصى. هنا نعتبر 'جنية' دليل على الحد الأقصى)
    maxPrice = parseInt(matches[0]);
    minPrice = 0;
   }
  }
 }


 // 2. تصفية المنتجات بناءً على النطاق السعري
 const matchingProducts = products.filter(product => {
  return product.price >= minPrice && product.price <= maxPrice;
 });

 // 3. بناء الرد على العميل
 // ⬇️ هنا نجهز المتغيرات النصية للعرض ⬇️
 const displayMin = minPrice;
 const displayMax = (maxPrice === Infinity) ? 'بلا حد أقصى' : maxPrice;

 if (matchingProducts.length === 0) {
  // نستخدم displayMin و displayMax في الرد النصي العادي
  return {
   fulfillmentText: `عفواً، لا توجد هدايا متاحة في هذا النطاق السعري (${displayMin} - ${displayMax} جنيه). هل يمكنني مساعدتك في نطاق آخر؟`
  };
 }

 // ⬅️ 1. بناء مصفوفة الأزرار: كل منتج في صف منفصل
 const productButtons = matchingProducts.map(product => {
  return [{
   text: `${product.name} (السعر: ${product.price} جنيه)`, // اسم المنتج والسعر على الزر
   // عند النقر، نرسل طلب نصي لـ Dialogflow ليبحث عن السعر
   callback_data: `سعر ${product.name}`
  }];
 });

 // ⬅️ 2. بناء الـ Custom Payload وإرجاعه
 const responseText = `لقد وجدت ${matchingProducts.length} منتجات في نطاق الميزانية المطلوبة (${displayMin} - ${displayMax} جنيه). اختر المنتج الذي تريده:`;

 return {
  fulfillmentText: responseText, // النص العادي (احتياطي)
  fulfillmentMessages: [{
   "platform": "telegram",
   "payload": {
    "telegram": {
     "text": responseText,
     "reply_markup": {
      "inline_keyboard": productButtons // مصفوفة الأزرار التي بنيناها
     }
    }
   }
  }]
 };

}; // ⬅️ انتهت الدالة هنا




/**
 * تجلب جميع أسماء المنتجات المتاحة وتحولها إلى أزرار مضمنة (Inline Buttons).
 * تستخدم للرد على نية 'Catalog.Overview'.
 */
function getAllProductsAsButtons() {
 const productsData = require('./data.json'); // جلب البيانات

 // 1. استخلاص جميع أسماء المنتجات
 // نستخدم Set لضمان عدم تكرار الأسماء إذا كانت مكررة في الملف
 const allProductNames = new Set();

 // المرور على كل فئة وكل منتج لإضافة اسمه
 Object.values(productsData.categories).forEach(category => {
  category.products.forEach(product => {
   allProductNames.add(product.name);
  });
 });

 // 2. تحويل الأسماء إلى مصفوفة أزرار
 const productButtons = Array.from(allProductNames).map(name => {
  return [{
   text: name, // اسم المنتج على الزر
   callback_data: `سعر ${name}` // عند الضغط، يرسل طلب سعر
  }];
 });

 // 3. بناء الـ Custom Payload وإرجاعه
 const responseText = `لدينا مجموعة مختارة من الهدايا المميزة. يرجى اختيار المنتج مباشرة من القائمة:`;

 return {
  fulfillmentText: responseText,
  fulfillmentMessages: [{
   "platform": "telegram",
   "payload": {
    "telegram": {
     "text": responseText,
     "reply_markup": {
      "inline_keyboard": productButtons
     }
    }
   }
  }]
 };
}



// ... (تأكد من تصدير الدالة الجديدة)
module.exports = {
 products,
 getPrice,
 getCategory,
 getPriceRange, // ⬅️ إضافة الدالة للتصدير
 getAllProductsAsButtons // ⬅️ إضافة الدالة للتصدير
}; 