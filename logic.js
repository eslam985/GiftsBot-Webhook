// logic.js - تم تصحيح جميع التصديرات (Exports) ونقل منطق المعالجة هنا
const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
// المتغيرات المطلوبة من بيئة Vercel
const PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID;

// تحليل مفتاح خدمة Google Cloud من متغير البيئة (الذي يحمل محتوى JSON)
const credentials = JSON.parse(process.env.GCP_CREDENTIALS);

// إعداد عميل Dialogflow باستخدام بيانات الاعتماد الجديدة
const sessionClient = new dialogflow.SessionsClient({ credentials });

// استخدام المتغير الجديد
const projectId = PROJECT_ID;

// الدوال المساعدة والمتغيرات (يجب أن يتم تعريفها وتصديرها بـ exports. إذا لزم الأمر)
const express = require('express');
const bodyParser = require('body-parser');
const data = require('./data.json');// يتم استخدام require لتحميل ملف JSON مباشرة في Node.js
const products = data.products; // استخراج مصفوفة المنتجات من الكائن
const STORE_CONTACT_NUMBER = '01013080898'; // الرقم للعرض كنص
const STORE_CONTACT_WHATSAPP = '201013080898'; // الرقم بالتنسيق الدولي (مثال: 201013080898)
const WHATSAPP_LINK = `https://wa.me/${STORE_CONTACT_WHATSAPP}`;// ⬅️ بناء رابط واتساب القابل للنقر

// الدالة المساعدة لتوحيد الأحرف العربية الأكثر شيوعاً
exports.normalizeArabic = (text) => {
  if (!text) return '';
  // توحيد الألف (أ, إ, آ) إلى (ا)
  // توحيد الألف المقصورة (ى) إلى (ي)
  // توحيد التاء المربوطة (ة) إلى (ه)
  return text.replace(/أ|إ|آ/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
};


// **********************************************************************************
// 1. دالة إرسال الرسالة إلى Dialogflow (مطلوبة لـ Messenger)
// **********************************************************************************

// sender_psid هنا هو معرف الجلسة لـ Dialogflow
exports.sendToDialogflow = async (sender_psid, message) => {
  const sessionId = sender_psid;
  const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);

  // بناء طلب Dialogflow
  const request = {
    session: sessionPath,
    queryInput: {
      text: {
        text: message,
        languageCode: 'ar',
      },
    },
  };

  try {
    const responses = await sessionClient.detectIntent(request);
    return responses[0].queryResult;
  } catch (error) {
    console.error('ERROR during detectIntent:', error);
    throw error;
  }
};


/**
 * دالة للحصول على سعر ووصف منتج معين بناءً على اسمه.
 * تم تصديرها: exports.getPrice
 */
exports.getPrice = (productName) => {
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
    return `آسف، المنتج أو الفئة باسم "${productName}" غير موجود/ة في قائمة الهدايا لدينا.`;
  }
};


// خريطة لترجمة الأسماء العربية الشائعة للفئات إلى الاسم الإنجليزي المستخدم في data.json
const categoryMap = {
  'مجوهرات': 'Jewelry',
  'اكسسوارات': 'Jewelry',
  "هدايا رجالية": "Men's Gifts",
  "هدية رجالي": "Men's Gifts",
  'home goods': 'Home Goods',
  'مستلزمات منزلية': 'Home Goods',
};


/**
 * دالة للحصول على قائمة بالمنتجات في فئة معينة.
 * تم تصديرها: exports.getCategory
 */
exports.getCategory = (categoryName) => {
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
        text: product.name,
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
 * تم تصديرها: exports.getPriceRange
 */
exports.getPriceRange = (min, max, originalQuery) => {
  // 1. استخلاص القيمة الافتراضية
  let minPrice = 0;
  let maxPrice = Infinity;

  // ⬇️ منطق استخلاص الرقم من النص الأصلي (Regex) ⬇️
  const matches = originalQuery.match(/(\d+)/g); // نستخدم g لاستخلاص كل الأرقام

  // إذا وجدنا أي أرقام
  if (matches && matches.length > 0) {

    // 1. حالة النطاق المزدوج ("بين X و Y")
    if (originalQuery.includes('بين') && matches.length >= 2) {
      minPrice = parseInt(matches[0]);
      maxPrice = parseInt(matches[1]);

    } else {
      // 2. تجميع كل الكلمات التي تعني "الحد الأدنى"
      const isMinLimit = originalQuery.includes('أكثر من') ||
        originalQuery.includes('أكبر من') ||
        originalQuery.includes('تزيد عن') ||
        originalQuery.includes('فوق');

      // 3. تجميع كل الكلمات التي تعني "الحد الأقصى"
      const isMaxLimit = originalQuery.includes('أقل من') ||
        originalQuery.includes('ينقص عن') ||
        originalQuery.includes('تحت') ||
        originalQuery.includes('أقصى سعر');

      // 4. تطبيق المنطق: نُعطي أولوية مطلقة للنية (أكثر من/أقل من)
      if (isMinLimit) {
        minPrice = parseInt(matches[0]);
        maxPrice = Infinity;

      } else if (isMaxLimit) {
        maxPrice = parseInt(matches[0]);
        minPrice = 0;

      } else {
        // 5. حالة الرقم المفرد (افتراضياً: حد أقصى)
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
};


/**
 * تجلب جميع أسماء المنتجات المتاحة وتحولها إلى أزرار مضمنة (Inline Buttons).
 * تم تصديرها: exports.getAllProductsAsButtons
 */
exports.getAllProductsAsButtons = () => {
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
 * تم تصديرها: exports.getRecommendations
 */
exports.getRecommendations = () => {
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


/**
 * دالة جديدة مخصصة للرد برسالة المساعدة والأزرار (العودة للصفحة الرئيسية).
 * تم تصديرها: exports.getHelpPayload
 */
exports.getHelpPayload = () => {
  // ⬅️ نستخدم هنا الـ callback_data الذي يعمل بشكل مستقر: /recommend و /catalog
  return {
    fulfillmentMessages: [{
      payload: {
        telegram: {
          text: "من فضلك يرجى اختيار أحد الأوامر التالية أو كتابة اسم منتجك:",
          reply_markup: {
            inline_keyboard: [
              // 1. ✨ الأفضل تقييماً 
              [
                {
                  "callback_data": "/recommend",
                  "text": "✨ أفضل التوصيات"
                }
              ],
              // 2. 📁 الأقسام/الفئات 
              [
                {
                  "text": "📁 عرض الأقسام",
                  "callback_data": "/show_categories"
                }
              ],
              // 3. 📦 كل المنتجات 
              [
                {
                  "text": "📦 عرض كل المنتجات",
                  "callback_data": "/catalog"
                }
              ]
            ]
          }
        }
      }
    }],
    fulfillmentText: "رسالة احتياطية"
  };
};


/**
 * دالة مخصصة لعرض الفئات (تحل محل Default Welcome Intent عند ضغط زر).
 * تم تصديرها: exports.getCategoryButtons
 */
exports.getCategoryButtons = () => {
  // هذا هو الـ JSON الذي أرسلته والذي يعمل بشكل مؤكد في نية الترحيب
  return {
    fulfillmentMessages: [{
      payload: {
        telegram: {
          text: "مرحباً! أنا بوت متجر الهدايا. كيف يمكنني مساعدتك؟\nيمكنك البحث عن اسم منتج معين، أو اختر فئة من الأقسام التالية:",
          reply_markup: {
            inline_keyboard: [
              [
                { "text": "مجوهرات", "callback_data": "وريني كل منتجات مجوهرات" },
                { "callback_data": "وريني كل منتجات إلكترونيات", "text": "إلكترونيات" }
              ],
              [
                { "text": "هدايا رجالية", "callback_data": "وريني كل منتجات هدايا رجالية" },
                { "callback_data": "وريني كل منتجات Home Goods", "text": "Home Goods" }
              ]
            ]
          }
        }
      }
    }],
    fulfillmentText: "قائمة الفئات"
  };
};


// **********************************************************************************
// 2. دالة معالجة الـ Webhook الواردة من Dialogflow (مطلوبة لـ Telegram)
// **********************************************************************************

/**
 * الدالة الرئيسية لمعالجة طلبات Dialogflow (الـ Webhook)
 * تم تصديرها: exports.processDialogflowWebhook
 */
exports.processDialogflowWebhook = (req, res) => {

  // هنا انتقل منطق معالجة النوايا والأزرار من server.js

  const callbackQuery = req.body.callback_query;

  // **********************************************
  // 1. معالجة ضغطات الأزرار (Callback Query) - خاص بـ Telegram
  // **********************************************
  if (callbackQuery) {
    const data = callbackQuery.data;
    let newResponse;

    // تحديد الرد المطلوب بناءً على قيمة الزر 
    if (data === '/catalog') {
      newResponse = exports.getAllProductsAsButtons();
    } else if (data === '/recommend') {
      newResponse = exports.getRecommendations();
    } else {
      return res.json({});
    }

    // تجهيز الرد لـ Telegram (sendMessage)
    const telegramResponse = {
      method: "sendMessage",
      chat_id: callbackQuery.message.chat.id,
      text: newResponse.fulfillmentText,
      reply_markup: newResponse.fulfillmentMessages[0]?.payload?.telegram?.reply_markup
    };
    return res.json(telegramResponse);
  }

  // **********************************************
  // 2. معالجة نوايا Dialogflow (Intents)
  // **********************************************

  const intent = req.body.queryResult.intent.displayName;
  const parameters = req.body.queryResult.parameters;

  let response = {};

  // مقارنة النية المستلمة بالنوايا الأخرى
  if (intent === 'Product.PriceFinal') {
    let productName = parameters.ProductName;
    if (Array.isArray(productName)) {
      productName = productName[0];
    }
    response = exports.getPrice(productName);

  } else if (intent === 'Product.PriceRange') {
    const price_min = parameters.price_min;
    const price_max = parameters.price_max;
    const originalQuery = req.body.queryResult.queryText;
    response = exports.getPriceRange(price_min, price_max, originalQuery);

  } else if (intent === 'Catalog.Overview') {
    response = exports.getAllProductsAsButtons();

  } else if (intent === 'Product.Recommendation') {
    response = exports.getRecommendations();

  } else if (intent === 'Gift.Inquiry - Category') {
    const categoryName = parameters.category_name;
    response = exports.getCategory(categoryName);

  } else if (intent === 'Help.Inquiry') {
    response = {
      fulfillmentText: 'مرحباً! أنا جاهز للإجابة عن أسعار المنتجات أو عرض فئات الهدايا. يمكنك أيضاً استخدام القائمة الجانبية لتسهيل البحث.'
    };

  } else if (intent === 'Category.Display') {
    response = exports.getCategoryButtons();

  } else if (intent === 'CategoryQuery') {
    const categoryName = parameters.category_name;
    response = exports.getCategory(categoryName);

  } else {
    response = exports.getHelpPayload();
  }

  // إرسال الرد مرة أخرى إلى Dialogflow
  res.json(response);
};