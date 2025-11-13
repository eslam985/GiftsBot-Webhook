// This is a dummy change to force Vercel to rebuild cache.
const express = require('express');
const bodyParser = require('body-parser');
const data = require('./data.json');// يتم استخدام require لتحميل ملف JSON مباشرة في Node.js
const products = data.products; // استخراج مصفوفة المنتجات من الكائن
const STORE_CONTACT_NUMBER = '01013080898'; // الرقم للعرض كنص
const STORE_CONTACT_WHATSAPP = '201013080898'; // الرقم بالتنسيق الدولي (مثال: 201013080898)
const WHATSAPP_LINK = `https://wa.me/${STORE_CONTACT_WHATSAPP}`;// ⬅️ بناء رابط واتساب القابل للنقر




/**
 * دالة للحصول على سعر ووصف منتج معين بناءً على اسمه.
 * ...
 */
const getPrice = (productName) => {
 // ⬅️ 1. الكود المفقود: تعريف المتغيرات وتنظيف اسم المنتج 
 if (!productName || typeof productName !== 'string') {
  return 'عفواً، يرجى تحديد اسم المنتج الذي تريد معرفة سعره.';
 }

 const cleanProductName = productName.toLowerCase().trim();
 let targetProduct = null;

 // ⬅️ 2. بداية المنطق الذي كان سبب المشكلة (الآن يعمل)
 const potentialProducts = products.filter(product => {
  return product.name.toLowerCase().includes(cleanProductName);
 });

 if (potentialProducts.length > 0) {
  targetProduct = potentialProducts[0];

  if (potentialProducts.length > 1) {
   const exactMatch = potentialProducts.find(p =>
    p.name.toLowerCase().trim() === cleanProductName
   );
   if (exactMatch) {
    targetProduct = exactMatch;
   }
  }

  // ⬇️ بقية الكود (تجهيز الرد البصري) ⬇️
  const STORE_CONTACT_NUMBER = '01013080898';
  const WHATSAPP_LINK = `https://wa.me/2${STORE_CONTACT_NUMBER}`;

  const responseText = `سعر ${targetProduct.name} هو **${targetProduct.price} جنيه**.\nالوصف: ${targetProduct.description}.\n**لطلب المنتج، يرجى التواصل مباشرة عبر:**\n📞 رقم التواصل: **[${STORE_CONTACT_NUMBER}](${WHATSAPP_LINK})**`;

  // 1. بناء رسالة الصورة (Photo Message)
  const photoMessage = {
   "platform": "telegram",
   "payload": {
    "telegram": {
     "photo": targetProduct.image_url,
     "caption": `🛒 ${targetProduct.name}`
    }
   }
  };

  // 2. بناء رسالة النص والأزرار (Text Message)
  const textMessage = {
   "platform": "telegram",
   "payload": {
    "telegram": {
     "text": responseText,
     "parse_mode": "Markdown"
    }
   }
  };

  // 3. تجميع الردود وإرسالها
  return {
   fulfillmentMessages: [photoMessage, textMessage]
  };

 } else {
  // ... (منطق البحث كاسم فئة ورسائل الخطأ يبقى كما هو) ...
  // ملاحظة: دالة getCategory تحتاج إلى تعريف أو استيراد إن لم تكن موجودة عالمياً
  // بما أنك تستخدمها في server.js فهي موجودة، لذلك نترك هذا الجزء كما هو.
  return `آسف، المنتج أو الفئة باسم "${productName}" غير موجود/ة في قائمة الهدايا لدينا.`;
 }
};




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
const getCategory = (categoryName) => {
 // ⬅️ الإضافة الفورية: التحقق من القيمة الواردة
 if (!categoryName || typeof categoryName !== 'string') {
  // إذا لم تكن نصًا، نرد بطلب تحديد الفئة.
  return {
   fulfillmentText: 'من فضلك حدد اسم الفئة التي تبحث عنها.'
  };
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





/**
 * دالة لمعالجة طلبات الشراء وتوجيه المستخدم لصفحة الدفع.
 * @param {string} productName - اسم المنتج الذي يريد المستخدم شراءه.
 * @returns {string} - رسالة توجيهية مع رابط الشراء.
 */
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
 // ⬅️ استخدام مصفوفة المنتجات الجاهزة والمستوردة في بداية logic.js

 // 1. استخلاص جميع أسماء المنتجات مباشرة من مصفوفة 'products'
 const allProductNames = products.map(product => product.name);

 // 2. تحويل الأسماء إلى مصفوفة أزرار
 const productButtons = Array.from(new Set(allProductNames)).map(name => {
  return [{
   text: name, // اسم المنتج على الزر
   callback_data: `سعر ${name}` // عند الضغط، يرسل طلب سعر
  }];
 });

 // 3. بناء الـ Custom Payload وإرجاعه
 // ... (بقية الكود الخاص ببناء الـ Payload يبقى كما هو) ...
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




/**
 * تجلب أفضل 3 منتجات بناءً على "recommendation_score" وتحولها إلى أزرار.
 * الأولوية التسويقية هي الأعلى (الرقم الأكبر).
 */
const getRecommendations = () => {
 // 1. الفرز: ترتيب المنتجات تنازلياً (الأعلى score أولاً)
 const sortedProducts = products.slice().sort((a, b) => {
  // نضمن أن المنتجات التي ليس لها score ستأتي في النهاية
  const scoreA = a.recommendation_score || 0;
  const scoreB = b.recommendation_score || 0;
  return scoreB - scoreA; // الفرز التنازلي (الأكبر أولاً)
 });

 // 2. اختيار أفضل 3 منتجات فقط (للحفاظ على نظافة الرد)
 const topThreeRecommendations = sortedProducts.slice(0, 3);

 // 3. بناء مصفوفة الأزرار
 const productButtons = topThreeRecommendations.map(product => {
  return [{
   text: `${product.name} (الأفضل تقييماً!)`,
   // عند النقر، يرسل طلب سعر المنتج مباشرة
   callback_data: `سعر ${product.name}`
  }];
 });

 // 4. بناء الرد النهائي
 const responseText = `✨ إليك أهم 3 توصيات حصرية بناءً على تقييم المبيعات: اختر ما تفضله:`;

 if (topThreeRecommendations.length === 0) {
  return {
   fulfillmentText: `عفواً، لا توجد توصيات متاحة حالياً.`
  };
 }

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
};




// ... (تأكد من تصدير الدالة الجديدة)
module.exports = {
 products,
 getPrice,
 getCategory,
 getPriceRange,
 getAllProductsAsButtons,
 getRecommendations
}; 