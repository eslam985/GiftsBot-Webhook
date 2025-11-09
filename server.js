const express = require('express');
const bodyParser = require('body-parser');
const botLogic = require('./logic'); // استيراد دوالك من logic.js

const app = express();
app.use(bodyParser.json());
app.use(express.static('public')); // إذا احتجت لملفات ثابتة مستقبلاً

// الدالة الرئيسية لاستقبال طلبات Dialogflow
app.post('/', (req, res) => {
 // 1. استخراج النية (Intent) واسم المعاملات (Parameters) من طلب Dialogflow
 const intent = req.body.queryResult.intent.displayName;
 const parameters = req.body.queryResult.parameters;

 let responseText = '';

 // 2. مقارنة النية المستلمة بالنوايا التي أنشأتها
 if (intent === 'PriceQuery') {
  // استخراج اسم المنتج الذي سميناه 'product_name' في Dialogflow
  let productName = parameters.product_name; // ⬅️ قمنا بتغيير const إلى let للسماح بالتعديل

  // 🛑 التعديل الإلزامي: التحقق مما إذا كانت القيمة مصفوفة وأخذ العنصر الأول منها
  if (Array.isArray(productName)) {
   productName = productName[0];
  }

  // استدعاء دالتك التي كتبتها في logic.js
  responseText = botLogic.getPrice(productName);

 } else if (intent === 'CategoryQuery') {
  // استخراج اسم الفئة الذي سميناه 'category_name' في Dialogflow
  const categoryName = parameters.category_name;

  // استدعاء دالتك التي كتبتها في logic.js
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

// تشغيل الخادم على المنفذ 3000 (الذي يتصل به Ngrok)
const PORT = 3000;
app.listen(PORT, () => {
 console.log(`Webhook server listening on port ${PORT}`);
});