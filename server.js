// server.js - الكود الموحد لـ Messenger و Telegram/Dialogflow

// تحميل المتغيرات البيئية (.env)
require('dotenv').config();

// المتغيرات
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

const express = require('express');
const request = require('request'); // يجب أن تكون قد قمت بتثبيت هذه المكتبة
const app = express();

// استيراد دوالك من logic.js
const botLogic = require('./logic');

// دالة إرسال الردود إلى Meta Messenger
function callSendAPI(sender_psid, response) {
 const request_body = {
  'recipient': {
   'id': sender_psid
  },
  'message': response
 };

 request({
  'uri': 'https://graph.facebook.com/v17.0/me/messages',
  'qs': { 'access_token': PAGE_ACCESS_TOKEN },
  'method': 'POST',
  'json': request_body
 }, (err, res, body) => {
  if (!err && res && res.statusCode === 200) {
   console.log('رسالة Messenger أُرسلت بنجاح!');
  } else {
   // 🚨 التعديل الحاسم: تسجيل رمز حالة Meta ونص الخطأ
   console.error('فشل إرسال رسالة Messenger: ' + (err ? err.message : 'HTTP Error'));
   console.error('Meta Status Code:', res ? res.statusCode : 'N/A');
   console.error('Meta Error Body (يحتوي على رمز الخطأ الحقيقي):', body);
  }
 });
}

// استخدام Express لقراءة الـ JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// *******************************************************************
// 1. معالجة Webhook الخاص بـ Meta Messenger (على مسار: /webhook)
// *******************************************************************

// [GET] منطق التحقق من الـ Webhook الأولي لـ Meta
app.get('/webhook', (req, res) => {
 const mode = req.query['hub.mode'];
 const token = req.query['hub.verify_token'];
 const challenge = req.query['hub.challenge'];

 if (mode && token) {
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
   console.log('Webhook Verified!');
   res.status(200).send(challenge);
  } else {
   console.log('Webhook verification failed!');
   res.sendStatus(403);
  }
 }
});


// [POST] منطق استقبال رسائل المستخدمين من Meta Messenger
app.post('/webhook', (req, res) => {
 const body = req.body;
 res.sendStatus(200); // إرسال 200 OK فوراً لتجنب timeouts

 if (body.object === 'page' && body.entry) {
  body.entry.forEach(function (entry) {
   const webhook_event = entry.messaging[0];
   const sender_psid = webhook_event.sender.id;

   if (webhook_event.message) {
    const user_message = webhook_event.message.text;

    // 📞 إرسال رسالة المستخدم إلى Dialogflow
    botLogic.sendToDialogflow(sender_psid, user_message)
     .then(responseFromDialogflow => {
      // 📩 استخدام الرد لإرساله إلى Messenger
      const defaultResponse = { 'text': responseFromDialogflow.fulfillmentText };
      callSendAPI(sender_psid, defaultResponse);

     })
     .catch(error => {
      console.error('خطأ في معالجة Dialogflow:', error);
      callSendAPI(sender_psid, { 'text': 'آسف، حدث خطأ في معالجة طلبك.' });
     });
   }
  });
 }
});

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