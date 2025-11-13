const express = require('express');
const bodyParser = require('body-parser');
const botLogic = require('./logic'); // استيراد دوالك من logic.js

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));




// ... (في server.js) ...

// الدالة الرئيسية لاستقبال طلبات Dialogflow
app.post('/', (req, res) => {
 const callbackQuery = req.body.callback_query;

 if (callbackQuery) {
  const data = callbackQuery.data;
  let newResponse;

  // ⬅️ معالجة الأزرار الثلاثة مباشرة
  if (data === '/catalog') {
   newResponse = botLogic.getAllProductsAsButtons();
  } else if (data === '/recommend') {
   newResponse = botLogic.getRecommendations();
  } else if (data === 'SHOW_CATEGORIES') {
   newResponse = botLogic.getCategoryButtons(); // ⬅️ الدالة الجديدة
  } else {
   // إذا كان أي زر آخر (مثل أزرار الفئات)، دع Dialogflow يعالجه
   // لكن أرسل رداً فورياً لإغلاق الـ Callback
   return res.json({});
  }

  // تجهيز الرد على Telegram
  const telegramResponse = {
   method: "sendMessage",
   chat_id: callbackQuery.message.chat.id,
   text: newResponse.fulfillmentText,
   // يجب أن نرسل payload كـ reply_markup
   reply_markup: newResponse.fulfillmentMessages[0]?.payload?.telegram?.reply_markup
  };

  // إرسال الرد
  return res.json(telegramResponse);
 }

 // 1. استخراج النية (Intent) واسم المعاملات (Parameters) من طلب Dialogflow
 const intent = req.body.queryResult.intent.displayName;
 const parameters = req.body.queryResult.parameters;

 let response = {};

 // 2. مقارنة النية المستلمة بالنوايا الأخرى
 if (intent === 'Product.PriceFinal') {

  // ⬅️ تصحيح الخطأ البرمجي: يجب تعريف المنتج واستخلاصه من المعاملات هنا
  let productName = parameters.ProductName;

  // ⬅️ منطق التعامل مع حالة أن تكون القيمة مصفوفة (لمنع تعطل البوت)
  if (Array.isArray(productName)) {
   productName = productName[0];
  }

  // ⬅️ استبدال كائن الرد بالكامل بالكائن العائد من دالة getPrice
  response = botLogic.getPrice(productName);

 } else if (intent === 'Product.PriceRange') {

  // ⬅️ التصحيح: يجب تعريف واستخلاص المعاملات من Dialogflow parameters 
  const price_min = parameters.price_min;
  const price_max = parameters.price_max;
  const originalQuery = req.body.queryResult.queryText; // هذا يأتي من النص الأصلي

  // ⬅️ التصحيح: يجب أن تستبدل الكائن response بالكائن العائد من الدالة
  response = botLogic.getPriceRange(price_min, price_max, originalQuery);

 } else if (intent === 'Catalog.Overview') {
  // ⬅️ هنا نستدعي دالة عرض الكتالوج بالكامل
  response = botLogic.getAllProductsAsButtons();

 } else if (intent === 'Product.Recommendation') {
  // ⬅️ هنا نستدعي دالة التوصيات الجديدة
  response = botLogic.getRecommendations();

 } else if (intent === 'Gift.Inquiry - Category') {
  // ⬅️ نستخدم نفس منطق CategoryQuery لعدم تكرار الكود
  const categoryName = parameters.category_name;
  response = botLogic.getCategory(categoryName);

 } else if (intent === 'Help.Inquiry') {
  // ⬅️ إذا تم تفعيل نية المساعدة، أرسل الرد النصي الصحيح مباشرة.
  response = {
   fulfillmentText: 'مرحباً! أنا جاهز للإجابة عن أسعار المنتجات أو عرض فئات الهدايا. يمكنك أيضاً استخدام القائمة الجانبية لتسهيل البحث.'
  };

 } else if (intent === 'CategoryQuery') {
  // ...
 } else if (intent === 'SHOW_CATEGORIES') {
  // ⬅️ الإضافة الجديدة: معالجة أمر الأقسام المخصص
  response = botLogic.getCategoryButtons();
 } else {
  // ⬅️ نية غير معروفة (Default Fallback):
  response = botLogic.getHelpPayload();
 }

 // 3. إرسال الرد مرة أخرى إلى Dialogflow
 // ⬅️ نرسل الكائن response بالكامل (بدلاً من الاقتصار على fulfillmentText)
 res.json(response);
});





// ... (بقية الكود) ...
// تشغيل الخادم على المنفذ 3000 (الذي يتصل به Ngrok)
const PORT = 3000;
app.listen(PORT, () => {
 console.log(`Webhook server listening on port ${PORT}`);
});