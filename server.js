const express = require('express');
const bodyParser = require('body-parser');
const botLogic = require('./logic'); // استيراد دوالك من logic.js

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));




// ... (في server.js) ...

// الدالة الرئيسية لاستقبال طلبات Dialogflow
app.post('/', (req, res) => {
 // 1. استخراج النية (Intent) واسم المعاملات (Parameters) من طلب Dialogflow
 const intent = req.body.queryResult.intent.displayName;
 const parameters = req.body.queryResult.parameters;

 // ⬅️ يجب أن يكون هذا الرد هو الكائن الذي يحتوي على fulfillmentText أو fulfillmentMessages
 let response = {};

 // 2. مقارنة النية المستلمة بالنوايا الأخرى
 if (intent === 'Product.PriceFinal') {
  // ... (منطق استخلاص productName) ...

  // ⬅️ إذا كانت getPrice ترجع نصاً، نضعه في fulfillmentText
  response.fulfillmentText = botLogic.getPrice(productName);

 } else if (intent === 'Product.PriceRange') {
  // ... (منطق استخلاص price_min/max/originalQuery) ...

  // ⬅️ إذا كانت getPriceRange ترجع نصاً، نضعه في fulfillmentText
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