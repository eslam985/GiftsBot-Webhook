const express = require('express');
const bodyParser = require('body-parser');
const botLogic = require('./logic'); // استيراد دوالك من logic.js

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// الدالة الرئيسية لاستقبال طلبات Dialogflow
app.post('/', (req, res) => {
 const callbackQuery = req.body.callback_query;

 // **********************************************
 // 1. معالجة ضغطات الأزرار (Callback Query)
 // **********************************************
 if (callbackQuery) {
  const data = callbackQuery.data;
  let newResponse;

  // تحديد الرد المطلوب بناءً على قيمة الزر (فقط الأزرار التي ترد بنص/قائمة طويلة)
  if (data === '/catalog') {
   newResponse = botLogic.getAllProductsAsButtons();
  } else if (data === '/recommend') {
   newResponse = botLogic.getRecommendations();
  } else {
   // إذا لم يكن زر كتالوج أو توصيات، نتركه لـ Dialogflow لمعالجته كنّية
   // ونرسل رداً فورياً فارغاً لـ Telegram لمنع تكرار الرسالة
   return res.json({});
  }

  // تجهيز الرد لـ Telegram (sendMessage)
  const telegramResponse = {
   method: "sendMessage",
   chat_id: callbackQuery.message.chat.id,
   text: newResponse.fulfillmentText,
   // استخراج الـ reply_markup من الـ payload
   reply_markup: newResponse.fulfillmentMessages[0]?.payload?.telegram?.reply_markup
  };

  // إرسال الرد
  return res.json(telegramResponse);
 }

 // **********************************************
 // 2. معالجة نوايا Dialogflow (Intents)
 // **********************************************

 // استخراج النية (Intent) واسم المعاملات (Parameters) من طلب Dialogflow
 const intent = req.body.queryResult.intent.displayName;
 const parameters = req.body.queryResult.parameters;

 let response = {};

 // مقارنة النية المستلمة بالنوايا الأخرى
 if (intent === 'Product.PriceFinal') {
  let productName = parameters.ProductName;
  if (Array.isArray(productName)) {
   productName = productName[0];
  }
  response = botLogic.getPrice(productName);

 } else if (intent === 'Product.PriceRange') {
  const price_min = parameters.price_min;
  const price_max = parameters.price_max;
  const originalQuery = req.body.queryResult.queryText;
  response = botLogic.getPriceRange(price_min, price_max, originalQuery);

 } else if (intent === 'Catalog.Overview') {
  response = botLogic.getAllProductsAsButtons();

 } else if (intent === 'Product.Recommendation') {
  response = botLogic.getRecommendations();

 } else if (intent === 'Gift.Inquiry - Category') {
  const categoryName = parameters.category_name;
  response = botLogic.getCategory(categoryName);

 } else if (intent === 'Help.Inquiry') {
  // نية المساعدة اليدوية
  response = {
   fulfillmentText: 'مرحباً! أنا جاهز للإجابة عن أسعار المنتجات أو عرض فئات الهدايا. يمكنك أيضاً استخدام القائمة الجانبية لتسهيل البحث.'
  };

 } else if (intent === 'Category.Display') {
  // ⬅️ النية التي تعالج زر "عرض الأقسام" عبر الـ Webhook
  response = botLogic.getCategoryButtons();

 } else if (intent === 'CategoryQuery') {
  const categoryName = parameters.category_name;
  response = botLogic.getCategory(categoryName);

 } else {
  // ⬅️ نية غير معروفة (Default Fallback): نرسل رسالة المساعدة المعقدة
  response = botLogic.getHelpPayload();
 }

 // إرسال الرد مرة أخرى إلى Dialogflow
 res.json(response);
});

// تشغيل الخادم على المنفذ 3000
const PORT = 3000;
app.listen(PORT, () => {
 console.log(`Webhook server listening on port ${PORT}`);
});