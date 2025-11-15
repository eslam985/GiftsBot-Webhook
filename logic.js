// #####################start########################
// _______________________1__________________________
// name_file: logic.js
// version_hash_id_gitHub: 8be1370696edb7efb8f89496a12c1af8e12d1e06
// name_commit: تعديل رساالة من فضلك يرجى اختيار أحد الأوامر التالية أو كتابة اسم منتجك
// Version description: هذا الملف اخر نسخة مستقرة وتدعم تليجرام فقط وهي مستقره جدا وليس بها مشاكل

// **************************************************
// ##################################################
// **************************************************

// _______________________2__________________________
// name_file: logic.js
// version_hash_id_gitHub: 5c7078fcd61726ec866b609bd58f03049df8179f
// name_commit: نهائي تم تنظيف ملفي server.js وlogic.js للتكامل المباشر مع Dialogflow git push
// Version description: تدعم المنصتين تليجرام ومسنجر لاكن بها مشاكل من حيث تدريب البوت والرد ع اسئلة محددة فقط 
// #####################end##########################



// This is a dummy change to force Vercel to rebuild cache.
const express = require('express');
const bodyParser = require('body-parser');
const data = require('./data.json');// يتم استخدام require لتحميل ملف JSON مباشرة في Node.js
const products = data.products; // استخراج مصفوفة المنتجات من الكائن
const STORE_CONTACT_NUMBER = '01013080898'; // الرقم للعرض كنص
const STORE_CONTACT_WHATSAPP = '201013080898'; // الرقم بالتنسيق الدولي (مثال: 201013080898)
const WHATSAPP_LINK = `https://wa.me/${STORE_CONTACT_WHATSAPP}`;// ⬅️ بناء رابط واتساب القابل للنقر
// الدالة المساعدة لتوحيد الأحرف العربية الأكثر شيوعاً التي تسبب فشل المطابقة
const normalizeArabic = (text) => {
  if (!text) return '';
  // توحيد الألف (أ, إ, آ) إلى (ا)
  // توحيد الألف المقصورة (ى) إلى (ي)
  // توحيد التاء المربوطة (ة) إلى (ه)
  return text.replace(/أ|إ|آ/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
};



/**
 * دالة مساعدة لإنشاء استجابة Dialogflow صالحة من نص بسيط.
 */
const createDialogflowResponse = (text) => {
  return {
    fulfillmentText: text, // النص الاحتياطي لجميع المنصات
    fulfillmentMessages: [
      {
        text: {
          text: [text]
        }
      }
    ]
  };
};

/**
 * دالة للحصول على سعر ووصف منتج معين بناءً على اسمه.
 *
 * @param {string} productName اسم المنتج.
 * @returns {object} استجابة Dialogflow JSON.
 */
const getPrice = (productName) => {
  // ⬅️ 1. الكود المفقود: تعريف المتغيرات وتنظيف اسم المنتج 
  if (!productName || typeof productName !== 'string') {
    // 🛑 تم تغيير الرد إلى تنسيق JSON صحيح
    return createDialogflowResponse('عفواً، يرجى تحديد اسم المنتج الذي تريد معرفة سعره.');
  }

  const cleanProductName = productName.toLowerCase().trim();
  let targetProduct = null;

  // ⬅️ 2. بداية المنطق
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

    const STORE_CONTACT_NUMBER = '01013080898';
    const WHATSAPP_LINK = `https://wa.me/2${STORE_CONTACT_NUMBER}`;

    // 🛑 التعديل هنا: نستخدم الرابط العاري ورقم الهاتف بشكل منفصل لضمان عمله في واتساب على سطح المكتب
    const responseText = `سعر ${targetProduct.name} هو **${targetProduct.price} جنيه**.\nالوصف: ${targetProduct.description}.\n**لطلب المنتج، يرجى التواصل مباشرة عبر:**\n📞 رقم التواصل: ${STORE_CONTACT_NUMBER}\n🔗 رابط واتساب مباشر: ${WHATSAPP_LINK}`;

    // 1. رسالة النص العامة (للمحاكي و Messenger)
    const generalTextMessage = {
      text: {
        text: [responseText]
      }
    };

    // 2. رسالة الصورة (خاصة بتيليجرام)
    const telegramPhotoMessage = {
      "platform": "telegram",
      "payload": {
        "telegram": {
          "photo": targetProduct.image_url,
          "caption": `🛒 ${targetProduct.name}`
        }
      }
    };

    // 3. رسالة النص والأزرار (خاصة بتيليجرام)
    const telegramTextMessage = {
      "platform": "telegram",
      "payload": {
        "telegram": {
          "text": responseText,
          "parse_mode": "Markdown"
        }
      }
    };

    // 4. تجميع الردود وإرسالها:
    return {
      fulfillmentText: responseText, // 🛑 يجب أن يحتوي النص الكامل ليعمل Messenger والمحاكي
      fulfillmentMessages: [generalTextMessage, telegramPhotoMessage, telegramTextMessage]
    };

  } else {
    // 🛑 تم تغيير الرد إلى تنسيق JSON صحيح
    // نبحث كفئة أولاً
    const categoryResponse = getCategory(productName);
    if (categoryResponse.fulfillmentText !== `آسف، لا توجد منتجات للفئة "${productName}" حالياً.`) {
      return categoryResponse;
    }

    return createDialogflowResponse(`آسف، المنتج أو الفئة باسم "${productName}" غير موجود/ة في قائمة الهدايا لدينا.`);
  }
};
// ... يجب إضافة الدالة المساعدة (createDialogflowResponse) في logic.js (يفضل قبل getPrice)
// تأكد من أن الدالة getCategory معرفة أو مستوردة بشكل صحيح إذا لم تكن عالمية




// خريطة لترجمة الأسماء العربية الشائعة للفئات إلى الاسم الإنجليزي المستخدم في data.json
// ... (في logic.js) ...
const categoryMap = {
  // ... (بقية الفئات)
  'مجوهرات': 'Jewelry',
  'اكسسوارات': 'Jewelry',
  "هدايا رجالية": "Men's Gifts", // ⬅️ الصيغة الحالية (التي تعمل مع "أريد هدايا رجالية")
  "هدية رجالي": "Men's Gifts",   // ⬅️ الإضافة المطلوبة (التي ستعمل مع "عايز هدية رجالي")
  'home goods': 'Home Goods',
  'مستلزمات منزلية': 'Home Goods',
};



/**
 * دالة للحصول على قائمة بالمنتجات في فئة معينة.
 * @param {string} categoryName - اسم الفئة المراد البحث عنها (قد يكون عربي أو إنجليزي).
 * @returns {string} - رسالة تحتوي على المنتجات أو رسالة خطأ.
 */
/**
 * دالة للحصول على منتجات فئة معينة كأزرار لـ Telegram وكرد نصي لـ Messenger.
 */
const getCategory = (categoryName) => {
  if (!categoryName) {
    // 🛑 استخدام الدالة المساعدة للتوحيد
    return createDialogflowResponse("من فضلك حدد اسم الفئة التي تبحث عنها.");
  }

  // 1. تنظيف القيمة من المسافات وتحويلها لحروف صغيرة
  let cleanCategoryName = categoryName.toLowerCase().trim();

  // 2. إزالة "الـ" من بداية الكلمة (يفترض وجود categoryMap و products معرفين)
  if (cleanCategoryName.startsWith('ال') && cleanCategoryName.length > 2) {
    cleanCategoryName = cleanCategoryName.substring(2).trim();
  }

  // 3. محاولة ترجمة الاسم العربي إلى نظيره الإنجليزي في الخريطة
  let searchCategory = categoryMap[cleanCategoryName] || categoryName;

  // 4. توحيد الاسم الذي سنبحث به
  searchCategory = searchCategory.toLowerCase().trim();

  // 5. تصفية المنتجات حسب الفئة
  const filteredProducts = products.filter(product =>
    product.category.toLowerCase().trim() === searchCategory
  );

  // 6. التحقق من وجود منتجات في الفئة
  if (filteredProducts.length > 0) {

    // النص العام الذي سيستخدمه Messenger/Emulator
    const GENERAL_RESPONSE_TEXT = `🛒 المنتجات المتاحة في فئة **${categoryName}**. اختر المنتج الذي تريده:`;

    // ⬅️ 1. بناء مصفوفة الأزرار المسطحة الموحدة (للتنسيق بين المنصات)
    const unifiedProductButtons = filteredProducts.map(product => {
      return {
        text: product.name,
        // القيمة التي سترسل إلى Dialogflow (سواء callback_data أو نص Quick Reply)
        data: `سعر ${product.name}`
      };
    });


    // ⬅️ 2. بناء الأزرار لـ Telegram (مصفوفة ثنائية الأبعاد)
    const telegramKeyboard = unifiedProductButtons.map(btn => [{
      text: btn.text,
      callback_data: btn.data
    }]);


    // ⬅️ 3. بناء الرسالة النصية العامة (لـ Emulator)
    const generalTextMessage = {
      text: {
        text: [GENERAL_RESPONSE_TEXT]
      }
    };

    // ⬅️ 4. بناء رسالة Telegram الخاصة
    const telegramButtonsMessage = {
      "platform": "telegram",
      "payload": {
        "telegram": {
          "text": GENERAL_RESPONSE_TEXT,
          "parse_mode": "Markdown", // إضافة تنسيق Markdown
          "reply_markup": {
            "inline_keyboard": telegramKeyboard
          }
        }
      }
    };

    // ⬅️ 5. الرسالة الجديدة لـ Messenger (Facebook)
    const messengerQuickReplies = {
      "platform": "facebook",
      "quickReplies": {
        "title": GENERAL_RESPONSE_TEXT,
        // Messenger يستخدم مصفوفة النصوص فقط
        "quickReplies": unifiedProductButtons.map(btn => btn.text)
      }
    };


    // ⬅️ 6. الإرجاع الموحد (الـ server.js سيقوم بالتصفية)
    return {
      fulfillmentText: GENERAL_RESPONSE_TEXT, // النص الكامل لـ Messenger/Emulator
      fulfillmentMessages: [generalTextMessage, messengerQuickReplies, telegramButtonsMessage] // الردود المفصلة
    };

  } else {
    // في حالة عدم وجود منتجات
    // 🛑 استخدام الدالة المساعدة للتوحيد
    return createDialogflowResponse(`آسف، لا توجد حاليًا هدايا في فئة "${categoryName}" لدينا.`);
  }
};




/**
 * دالة لمعالجة طلبات البحث عن منتجات ضمن نطاق سعري معين.
 * @param {number} min - الحد الأدنى للسعر.
 * @param {number} max - الحد الأقصى للسعر.
 * @param {string} originalQuery - النص الأصلي لاستخلاص النطاق.
 * @returns {object} - استجابة Dialogflow JSON.
 */
const getPriceRange = (min, max, originalQuery) => {
  // 1. استخلاص القيمة الافتراضية
  let minPrice = 0;
  let maxPrice = Infinity;

  // ⬇️ منطق استخلاص الرقم من النص الأصلي (Regex) ⬇️
  const matches = originalQuery.match(/(\d+)/g);

  // إذا وجدنا أي أرقام
  if (matches && matches.length > 0) {
    // ... (منطق تحديد minPrice و maxPrice كما هو) ...

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

      // 4. تطبيق المنطق
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
  const displayMin = minPrice;
  const displayMax = (maxPrice === Infinity) ? 'بلا حد أقصى' : maxPrice;

  if (matchingProducts.length === 0) {
    // 🛑 في حالة عدم وجود منتجات، نستخدم الدالة المساعدة
    const failureText = `عفواً، لا توجد هدايا متاحة في هذا النطاق السعري (${displayMin} - ${displayMax} جنيه). هل يمكنني مساعدتك في نطاق آخر؟`;
    return createDialogflowResponse(failureText);
  }

  // ⬅️ 1. بناء مصفوفة الأزرار المسطحة الموحدة (للتنسيق بين المنصات)
  const unifiedProductButtons = matchingProducts.map(product => {
    const buttonText = `${product.name} (السعر: ${product.price} جنيه)`;
    return {
      text: buttonText,
      // القيمة التي سترسل إلى Dialogflow (سواء callback_data أو نص Quick Reply)
      data: `سعر ${product.name}`
    };
  });

  // ⬅️ 2. بناء الأزرار لـ Telegram (مصفوفة ثنائية الأبعاد)
  const telegramKeyboard = unifiedProductButtons.map(btn => [{
    text: btn.text,
    callback_data: btn.data
  }]);

  // ⬅️ 3. بناء الـ Custom Payload وإرجاعه
  const responseText = `لقد وجدت ${matchingProducts.length} منتجات في نطاق الميزانية المطلوبة (${displayMin} - ${displayMax} جنيه). اختر المنتج الذي تريده:`;

  // الرسالة النصية العامة (للمحاكي و Messenger)
  const generalTextMessage = {
    text: {
      text: [responseText]
    }
  };

  // رسالة الأزرار الخاصة بتيليجرام
  const telegramButtonsMessage = {
    "platform": "telegram",
    "payload": {
      "telegram": {
        "text": responseText,
        "parse_mode": "Markdown",
        "reply_markup": {
          "inline_keyboard": telegramKeyboard
        }
      }
    }
  };

  // ⬅️ 4. الرسالة الجديدة لـ Messenger (Facebook)
  const messengerQuickReplies = {
    "platform": "facebook",
    "quickReplies": {
      "title": responseText,
      // Messenger يستخدم مصفوفة النصوص فقط
      "quickReplies": unifiedProductButtons.map(btn => btn.text)
    }
  };

  // ⬅️ 5. الإرجاع الموحد (بما في ذلك Messenger/Facebook)
  return {
    fulfillmentText: responseText,
    fulfillmentMessages: [generalTextMessage, messengerQuickReplies, telegramButtonsMessage] // الردود المفصلة
  };
};


/**
 * تجلب جميع أسماء المنتجات المتاحة وتحولها إلى أزرار مضمنة (Inline Buttons).
 * تستخدم للرد على نية 'Catalog.Overview'.
 * متوافقة مع جميع المنصات (Telegram/Messenger).
 */
const getAllProductsAsButtons = () => {
  // 🛑 النص العام يجب أن يكون رسالة تمهيدية قصيرة
  const responseText = 'لدينا مجموعة مختارة من الهدايا المميزة. اختر ما يثير اهتمامك:';

  // 1. بناء الأزرار الموحدة للمنتجات
  const productButtons = products.map(p => ({
    text: p.name,
    data: `كم سعر ${p.name}`
  }));

  // 2. بناء لوحة مفاتيح Telegram (Inline Keyboard)
  const telegramKeyboard = {
    "platform": "telegram",
    "payload": {
      "telegram": {
        "text": `📦 ${responseText}`,
        "parse_mode": "Markdown",
        "reply_markup": {
          // توزيع الأزرار بشكل أكثر جمالية لـ Telegram (صفين في كل صف)
          "inline_keyboard": [
            // هذا المنطق يحول القائمة إلى صفوف
            ...productButtons.map(btn => [{ text: btn.text, callback_data: btn.data }])
          ]
        }
      }
    }
  };

  // 3. بناء الردود السريعة لـ Messenger (Quick Replies)
  const messengerQuickReplies = {
    "platform": "facebook",
    "quickReplies": {
      "title": responseText,
      "quickReplies": productButtons.map(btn => btn.text)
    }
  };

  // 4. بناء رسالة النص العامة (Fallback)
  const generalTextMessage = {
    text: { text: [responseText] }
  };

  return {
    fulfillmentText: responseText,
    fulfillmentMessages: [generalTextMessage, telegramKeyboard, messengerQuickReplies]
  };
};

// **ملاحظة:** يجب أن تتأكد أنك تستورد مصفوفة `products` في أعلى ملف `logic.js`
// وتصدر هذه الدالة في `module.exports`





/**
 * تجلب أفضل 3 منتجات بناءً على "recommendation_score" وتحولها إلى أزرار.
 * الأولوية التسويقية هي الأعلى (الرقم الأكبر).
 * متوافقة مع جميع المنصات (Telegram/Messenger).
 */
const getRecommendations = () => {
  // 1. الفرز: ترتيب المنتجات تنازلياً (الأعلى score أولاً)
  const sortedProducts = products.slice().sort((a, b) => {
    const scoreA = a.recommendation_score || 0;
    const scoreB = b.recommendation_score || 0;
    return scoreB - scoreA; // الفرز التنازلي
  });

  // 2. اختيار أفضل 3 منتجات فقط
  const topThreeRecommendations = sortedProducts.slice(0, 3);

  // 3. بناء الرد النهائي
  const responseText = `✨ إليك أهم 3 توصيات حصرية بناءً على تقييم المبيعات: اختر ما تفضله:`;

  if (topThreeRecommendations.length === 0) {
    return createDialogflowResponse(`عفواً، لا توجد توصيات متاحة حالياً.`);
  }

  // ⬅️ 1. بناء مصفوفة الأزرار المسطحة الموحدة (للتنسيق بين المنصات)
  const unifiedProductButtons = topThreeRecommendations.map(product => {
    const buttonText = `${product.name} (الأفضل تقييماً!)`;
    return {
      text: buttonText,
      // القيمة التي سترسل إلى Dialogflow (سواء callback_data أو نص Quick Reply)
      data: `سعر ${product.name}`
    };
  });

  // ⬅️ 2. بناء الأزرار لـ Telegram (مصفوفة ثنائية الأبعاد)
  const telegramKeyboard = unifiedProductButtons.map(btn => [{
    text: btn.text,
    callback_data: btn.data
  }]);

  // ⬅️ 3. بناء الرسالة النصية العامة (لـ Emulator)
  const generalTextMessage = {
    text: {
      text: [responseText]
    }
  };

  // ⬅️ 4. بناء رسالة Telegram الخاصة
  const telegramButtonsMessage = {
    "platform": "telegram",
    "payload": {
      "telegram": {
        "text": responseText,
        "reply_markup": {
          "inline_keyboard": telegramKeyboard
        }
      }
    }
  };

  // ⬅️ 5. الرسالة الجديدة لـ Messenger (Facebook)
  const messengerQuickReplies = {
    "platform": "facebook",
    "quickReplies": {
      "title": responseText,
      // Messenger يستخدم النص كقيمة، لذا نأخذ مصفوفة النصوص فقط
      "quickReplies": unifiedProductButtons.map(btn => btn.text)
    }
  };

  // ⬅️ 6. الإرجاع الموحد (بما في ذلك Messenger/Facebook)
  return {
    fulfillmentText: responseText,
    fulfillmentMessages: [generalTextMessage, messengerQuickReplies, telegramButtonsMessage]
  };
};





/**
 * دالة جديدة مخصصة للرد برسالة المساعدة والأزرار، متوافقة مع جميع المنصات.
 */
const getHelpPayload = () => {

  const responseText = "من فضلك يرجى اختيار أحد الأوامر التالية أو كتابة اسم منتجك:";

  // ⬅️ 1. تعريف مصفوفة الأزرار المشتركة (Buttons Array)
  const helpKeyboard = [
    // تيليجرام: يعرض النص | ماسنجر: يعرض النص والـ payload هو النص
    { text: "✨ أفضل التوصيات", data: "/recommend" },
    { text: "📁 عرض الأقسام", data: "/show_categories" },
    { text: "📦 عرض كل المنتجات", data: "/catalog" }
  ];

  // ⬅️ 2. بناء رسالة Telegram الخاصة (تظل كما هي)
  const telegramButtonsMessage = {
    "platform": "telegram",
    "payload": {
      "telegram": {
        "text": responseText,
        "reply_markup": {
          "inline_keyboard": helpKeyboard.map(btn => [{ text: btn.text, callback_data: btn.data }])
        }
      }
    }
  };

  // ⬅️ 3. الرسالة الجديدة لـ Messenger (Facebook)
  const messengerQuickReplies = {
    "platform": "facebook",
    "quickReplies": {
      "title": responseText,
      "quickReplies": helpKeyboard.map(btn => btn.text) // Messenger يستخدم النص نفسه كقيمة
    }
  };

  // ⬅️ 4. الرسالة النصية العامة (للمحاكي و احتياط Messenger)
  const generalTextMessage = {
    text: {
      text: [responseText]
    }
  };

  // ⬅️ 5. الإرجاع الموحد: نضمن ظهور الرسالة الخاصة بـ Messenger في الرد
  return {
    fulfillmentText: responseText,
    fulfillmentMessages: [generalTextMessage, messengerQuickReplies, telegramButtonsMessage] // الآن تشمل Facebook
  };
};




/**
 * دالة مخصصة لعرض الفئات (تحل محل Default Welcome Intent عند ضغط الزر).
 * متوافقة مع جميع المنصات.
 */
const getCategoryButtons = () => {
  const responseText = "مرحباً! أنا بوت متجر الهدايا. كيف يمكنني مساعدتك؟\nيمكنك البحث عن اسم منتج معين، أو اختر فئة من الأقسام التالية:";

  // ⬅️ 1. بناء مصفوفة الأزرار المسطحة (Category Map)
  const categoryMap = [
    { "text": "مجوهرات", "data": "وريني كل منتجات مجوهرات" },
    { "text": "إلكترونيات", "data": "وريني كل منتجات إلكترونيات" },
    { "text": "هدايا رجالية", "data": "وريني كل منتجات هدايا رجالية" },
    { "text": "Home Goods", "data": "وريني كل منتجات Home Goods" }
  ];

  // ⬅️ 2. بناء الأزرار لـ Telegram (مصفوفة ثنائية الأبعاد)
  // يتم تقسيمها إلى صفوف (صفين في كل صف)
  const telegramKeyboard = [];
  for (let i = 0; i < categoryMap.length; i += 2) {
    const row = [];
    row.push({ "text": categoryMap[i].text, "callback_data": categoryMap[i].data });
    if (categoryMap[i + 1]) {
      row.push({ "text": categoryMap[i + 1].text, "callback_data": categoryMap[i + 1].data });
    }
    telegramKeyboard.push(row);
  }


  // ⬅️ 3. بناء الرسالة النصية العامة (لـ Messenger/Emulator)
  const generalTextMessage = {
    text: {
      text: [responseText]
    }
  };

  // ⬅️ 4. بناء رسالة Telegram الخاصة (باستخدام المصفوفة الثنائية)
  const telegramButtonsMessage = {
    "platform": "telegram",
    "payload": {
      "telegram": {
        "text": responseText,
        "reply_markup": {
          "inline_keyboard": telegramKeyboard
        }
      }
    }
  };

  // ⬅️ 5. الرسالة الجديدة لـ Messenger (Facebook)
  const messengerQuickReplies = {
    "platform": "facebook",
    "quickReplies": {
      "title": "مرحباً! أنا بوت متجر الهدايا. كيف يمكنني مساعدتك؟\nيمكنك البحث عن اسم منتج معين، أو اختر فئة من الأقسام التالية:",
      // Messenger يستخدم مصفوفة بسيطة من النصوص
      "quickReplies": categoryMap.map(btn => btn.text)
    }
  };

  // ⬅️ 6. الإرجاع الموحد (بما في ذلك Messenger/Facebook)
  return {
    fulfillmentText: responseText,
    fulfillmentMessages: [generalTextMessage, messengerQuickReplies, telegramButtonsMessage] // الآن تشمل Facebook
  };
};





// ... (تأكد من تصدير الدالة الجديدة)
module.exports = {
  products,
  getPrice,
  getCategory,
  getPriceRange,
  getAllProductsAsButtons,
  getRecommendations,
  getHelpPayload,
  getCategoryButtons,
}; 