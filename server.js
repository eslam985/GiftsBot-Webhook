// server.js - الكود الموحد لـ Messenger و Telegram/Dialogflow

const express = require('express');
const app = express();

// استيراد دوالك من logic.js
const botLogic = require('./logic');

// استخدام Express لقراءة الـ JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// *******************************************************************
// 2. معالجة Webhook الخاص بـ Dialogflow/Telegram (على مسار: /)
// *******************************************************************

// الدالة الرئيسية لاستقبال طلبات Dialogflow (للتكامل مع Telegram أو أي منصة أخرى)
app.post('/', (req, res) => {
 // تمرير طلب Dialogflow بأكمله إلى منطق البوت
 botLogic.processDialogflowWebhook(req, res);
});


// *******************************************************************
// 3. تشغيل الخادم
// *******************************************************************

const PORT = 3000;
app.listen(PORT, () => {
 console.log(`Webhook server listening on port ${PORT}`);
});