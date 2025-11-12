const express = require('express');
const bodyParser = require('body-parser');
const botLogic = require('./logic'); // استيراد دوالك من logic.js

const app = express();
app.use(bodyParser.json());
app.use(express.static('public'));





// الدالة الرئيسية لاستقبال طلبات Dialogflow
app.post('/', (req, res) => {
 // 1. استخراج النية (Intent) واسم المعاملات (Parameters) من طلب Dialogflow ⬅️ يجب أن تكون هذه الخطوات أولاً
 const intent = req.body.queryResult.intent.displayName;
 const parameters = req.body.queryResult.parameters;
 let responseText = '';

 // 2. مقارنة النية المستلمة بالنوايا الأخرى
 if (intent === 'Product.PriceFinal') { // ⬅️ بدأنا بـ 'if' بدلاً من 'else if' لأنها الآن أول كتلة تحقق

  let productName = parameters.ProductName;

  const resolvedValue = req.body.queryResult.parameters.ProductName;

  if (Array.isArray(resolvedValue)) {
   productName = resolvedValue[0];
  } else {
   productName = resolvedValue;
  }

  responseText = botLogic.getPrice(productName);

 } else if (intent === 'Product.PriceRange') { // ⬅️ إضافة المنطق الجديد هنا
  const price_min = parameters.price_min;
  const price_max = parameters.price_max;

  // استدعاء الدالة الجديدة
  responseText = botLogic.getPriceRange(price_min, price_max);

 } else if (intent === 'CategoryQuery') {

  const categoryName = parameters.category_name;
  responseText = botLogic.getCategory(categoryName);

 } else {
  // نية غير معروفة (Default Fallback)
  responseText = 'عفواً، لم أفهم سؤالك. يرجى سؤالي عن سعر منتج أو فئة معينة.';
 }
 // 3. إرسال الرد مرة أخرى إلى Dialogflow
 res.json({
  fulfillmentText: responseText
 });
});





// ... (بقية الكود) ...
// تشغيل الخادم على المنفذ 3000 (الذي يتصل به Ngrok)
const PORT = 3000;
app.listen(PORT, () => {
 console.log(`Webhook server listening on port ${PORT}`);
});