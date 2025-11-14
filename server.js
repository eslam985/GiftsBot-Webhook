// هذا خادم Node.js بسيط يعمل كوسيط لاستقبال رسائل Meta ثم إرسالها إلى Dialogflow.
// هذا الحل يتجاوز الحاجة إلى استخدام تكامل Dialogflow المدمج الذي فرض عليك التحقق من النشاط التجاري.

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); // مطلوب لإرسال الرسائل إلى Dialogflow و Meta
const app = express();
const PORT = process.env.PORT || 3000;

// ***************************************************************
// 1. المتغيرات السرية (يجب تعبئتها من قبلك)
// ***************************************************************

// الرمز الذي أدخلته في إعدادات Webhook الخاص بـ Meta للتحقق
const VERIFY_TOKEN = 'verifyBot'; 

// رمز الصفحة (Page Access Token) الذي حصلت عليه من Graph API Explorer
const PAGE_ACCESS_TOKEN = 'EAAWflOct5CABPzylk0rwBjK337RZBYreX5mvtb2tYm8dFZCYU1IbMlDGzqMLwuibxQ4JStSOiitzI1lZCWZAIL9a2sI8WLc99edpDok1lhq5JKGuZAn3vXvjUHncdzkuwNcBgkpe2IGKJmSJui0BQfQqsSz1cmFDykHxQHWTdzRe7ZCkGD1rNp65K0ZAI8PvnJUsbyPwgZDZD'; 

// ID الخاص بوكيل Dialogflow (يمكنك الحصول عليه من إعدادات الوكيل)
const DIALOGFLOW_PROJECT_ID = 'giftsbot-nhop'; 

// ***************************************************************
// 2. إعداد الخادم
// ***************************************************************

app.use(bodyParser.json());

// ***************************************************************
// 3. مسار التحقق من Meta (GET)
// ***************************************************************
// تستخدمه Meta للتأكد من أنك تملك هذا الرابط (Webhook URL)
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    // تحقق من الوضع والرمز
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook Verified!');
        res.status(200).send(challenge);
    } else {
        // رسالة تنبيه واضحة بعدم استخدام alert()
        console.error('Failed verification. Ensure the token is correct.');
        res.sendStatus(403);
    }
});

// ***************************************************************
// 4. مسار استقبال رسائل المستخدمين (POST)
// ***************************************************************
app.post('/webhook', (req, res) => {
    const data = req.body;

    // التأكد من أن الحدث هو لصفحة Messenger
    if (data.object === 'page') {
        data.entry.forEach(entry => {
            entry.messaging.forEach(event => {
                if (event.message && event.message.text) {
                    handleMessage(event);
                } else {
                    // تجاهل الأحداث الأخرى مثل الإعجابات، إيصالات القراءة، إلخ.
                    console.log("Received unhandled event:", event);
                }
            });
        });

        // يجب الرد بـ 200 لـ Meta فورًا لتجنب إعادة إرسال الرسالة
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// ***************************************************************
// 5. دالة معالجة الرسائل وإرسالها إلى Dialogflow
// ***************************************************************
async function handleMessage(event) {
    const senderId = event.sender.id;
    const userMessage = event.message.text;

    console.log(`User ${senderId} sent message: ${userMessage}`);

    // ************************************************************************************
    // NOTE: هذا الجزء يحتاج إعداد مصادقة (Authentication) مع Google/Dialogflow API
    // (ستحتاج إلى ملف JSON لحساب الخدمة وربط الـ SDK)
    // هذا هو الكود المعقد الذي كان يقوم به تكامل Dialogflow لك تلقائياً.
    // ************************************************************************************
    
    // لغرض تجاوز المشكلة الإدارية: سنستخدم رداً بسيطاً مؤقتاً
    const replyText = `[الوضع النشط مُعطَّل إدارياً] لقد تلقيت رسالتك: "${userMessage}". يجب أن يتم دمج Dialogflow API هنا.`;

    // إرسال الرد إلى Messenger
    sendMessengerResponse(senderId, replyText);
}

// ***************************************************************
// 6. دالة إرسال الرد إلى Meta Messenger API
// ***************************************************************
async function sendMessengerResponse(recipientId, text) {
    const url = `https://graph.facebook.com/v18.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;

    const messageData = {
        recipient: { id: recipientId },
        message: { text: text }
    };

    try {
        await axios.post(url, messageData);
        console.log('Message sent successfully to Meta.');
    } catch (error) {
        console.error('Error sending message to Meta:', error.response ? error.response.data : error.message);
    }
}


// ***************************************************************
// 7. تشغيل الخادم
// ***************************************************************
app.listen(PORT, () => {
    console.log(`Custom Webhook is running on port ${PORT}`);
});