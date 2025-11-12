const express = require('express');
const bodyParser = require('body-parser');
const botLogic = require('./logic'); // استيراد دوالك من logic.js

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));




// ... (في server.js) ...

// الدالة الرئيسية لاستقبال طلبات Dialogflow
// الدالة الرئيسية لاستقبال طلبات Dialogflow
app.post('/', (req, res) => {
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

  // ⬅️ إرسال اسم المنتج النظيف لدالة getPrice
  response.fulfillmentText = botLogic.getPrice(productName);

 } else if (intent === 'Product.PriceRange') {

  // ⬅️ التصحيح: يجب تعريف واستخلاص المعاملات من Dialogflow parameters 
  const price_min = parameters.price_min;
  const price_max = parameters.price_max;
  const originalQuery = req.body.queryResult.queryText; // هذا يأتي من النص الأصلي

  // ⬅️ إرسال القيم المستخلصة إلى دالة getPriceRange
  response.fulfillmentText = botLogic.getPriceRange(price_min, price_max, originalQuery);

 } else if (intent === 'CategoryQuery') {

  const categoryName = parameters.category_name;
  // ⬅️ هنا، getCategory سترجع كائناً يحتوي على fulfillmentText/fulfillmentMessages
  response = botLogic.getCategory(categoryName);

 } else {
  // نية غير معروفة (Default Fallback)
  response.fulfillmentText = 'عفواً، لم أفهم سؤالك. يرجى سؤالي عن سعر منتج أو فئة معينة.';
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