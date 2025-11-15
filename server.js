// #####################start########################
// _______________________1__________________________
// name_file: server.js
// version_hash_id_gitHub: e760c0e17854b8c3c2370d9f798a68635a7c93c1
// name_commit: Secure environment setup: Implement dotenv and update .gitignore.
// Version description: هذا الملف اخر نسخة مستقرة وتدعم تليجرام فقط وهي مستقره جدا وليس بها مشاكل

// **************************************************
// ##################################################
// **************************************************

// _______________________2__________________________
// name_file: server.js
// version_hash_id_gitHub: a7ceaaad6460f6046a62ce3a3d1ea3f3db836a41
// name_commit: الإصلاح النهائي: تمكين اتصال API الخاص بـ Dialogflow عبر GCP_CREDENTIALS
// Version description: تدعم المنصتين تليجرام ومسنجر لاكن بها مشاكل من حيث تدريب البوت والرد ع اسئلة محددة فقط 
// #####################end##########################


// server.js - يجب أن تكون هذه الأسطر في بداية الملف
require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const botLogic = require('./logic'); // استيراد دوالك من logic.js

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// الدالة الرئيسية لاستقبال طلبات Dialogflow
app.post('/webhook', (req, res) => {
 const body = req.body;
 const callbackQuery = body.callback_query;

 // **********************************************
 // 1. معالجة ضغطات الأزرار (Callback Query - خاص بتيليجرام)
 // **********************************************
 if (callbackQuery) {
  const data = callbackQuery.data;
  let newResponse = {};

  if (data === '/catalog') {
   newResponse = botLogic.getAllProductsAsButtons();
  } else if (data === '/recommend') {
   newResponse = botLogic.getRecommendations();
  } else {
   return res.json({});
  }

  // تجهيز الرد لـ Telegram (sendMessage)
  const telegramResponse = {
   method: "sendMessage",
   chat_id: callbackQuery.message.chat.id,
   // نستخدم هنا fulfillmentText من الدالة لأن الرد يتم مباشرة لـ Telegram API
   text: newResponse.fulfillmentText,
   reply_markup: newResponse.fulfillmentMessages[0]?.payload?.telegram?.reply_markup
  };

  return res.json(telegramResponse);
 }

 // **********************************************
 // 2. معالجة نوايا Dialogflow (Intents)
 // **********************************************

 if (!body.queryResult || !body.queryResult.intent) {
  console.error("Invalid Dialogflow request body.");
  return res.status(400).send("Bad Request: Missing queryResult.");
 }

 const intent = body.queryResult.intent.displayName;
 const parameters = body.queryResult.parameters;
 let response = {};

 // ⬇️ تحديد المنصة (Source) ⬇️
 // platformSource سيكون 'telegram' لـ Telegram، و 'facebook' لـ Messenger، وهكذا.
 const platformSource = body.originalDetectIntentRequest?.source;

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
  const originalQuery = body.queryResult.queryText;
  response = botLogic.getPriceRange(price_min, price_max, originalQuery);

 } else if (intent === 'Catalog.Overview') {
  response = botLogic.getAllProductsAsButtons();

 } else if (intent === 'Product.Recommendation') {
  response = botLogic.getRecommendations();

 } else if (intent === 'Gift.Inquiry - Category') {
  const categoryName = parameters.category_name;
  response = botLogic.getCategory(categoryName);

 } else if (intent === 'Help.Inquiry') {
  response = {
   fulfillmentText: 'مرحباً! أنا جاهز للإجابة عن أسعار المنتجات أو عرض فئات الهدايا. يمكنك أيضاً استخدام القائمة الجانبية لتسهيل البحث.'
  };

 } else if (intent === 'Category.Display') {
  response = botLogic.getCategoryButtons();

 } else if (intent === 'CategoryQuery') {
  const categoryName = parameters.category_name;
  response = botLogic.getCategory(categoryName);

 } else {
  // نية غير معروفة (Default Fallback)
  response = botLogic.getHelpPayload();
 }

 // *************************************************************
 // 🛑 منطق التصفية الحاسم: إزالة الرسائل العامة لـ Telegram
 // *************************************************************
 if (platformSource === 'telegram' && response.fulfillmentMessages) {

  // 1. الاحتفاظ فقط بالرسائل المحددة بـ "platform": "telegram"
  const telegramMessages = response.fulfillmentMessages.filter(
   message => message.platform === 'telegram'
  );

  // 2. تحديث الرد:
  if (telegramMessages.length > 0) {
   response.fulfillmentMessages = telegramMessages;
   // 🛑 تفريغ النص العام لضمان عدم تكراره (سيستخدم Telegram الرسائل المصفاة فقط)
   response.fulfillmentText = '';
  }
 }

 // إرسال الرد النهائي إلى Dialogflow
 res.json(response);
});

// تصدير التطبيق كـ Serverless Function
module.exports = app;