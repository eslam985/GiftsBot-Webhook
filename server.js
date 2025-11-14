// هذا خادم Node.js يعمل كوسيط لاستقبال رسائل Meta ثم إرسالها إلى Dialogflow.
// هذا الكود يتطلب أن تكون قيمة مفتاح حساب الخدمة (Service Account Key JSON) 
// موجودة كمتغير بيئة سري باسم GCP_CREDENTIALS في إعدادات Vercel.

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios'); 
const dialogflow = require('@google-cloud/dialogflow');
const app = express();
const PORT = process.env.PORT || 3000;

// ***************************************************************
// 1. المتغيرات السرية (تم تعبئتها بناءً على إدخالك السابق)
// ***************************************************************
const VERIFY_TOKEN = 'verifyBot'; 
const PAGE_ACCESS_TOKEN = 'EAAWflOct5CABPzylk0rwBjK337RZBYreX5mvtb2tYm8dFZCYU1IbMlDGzqMLwuibxQ4JStSOiitzI1lZCWZAIL9a2sI8WLc99edpDok1lhq5JKGuZAn3vXvjUHncdzkuwNcBgkpe2IGKJmSJui0BQfQqsSz1cmFDykHxQHWTdzRe7ZCkGD1rNp65K0ZAI8PvnJUsbyPwgZDZD'; 
const DIALOGFLOW_PROJECT_ID = 'giftsbot-nhop'; 

// ***************************************************************
// 2. إعداد Dialogflow Client 
// ***************************************************************
// المصادقة تتم عبر متغير البيئة السري GCP_CREDENTIALS
const keyFileContent = process.env.GCP_CREDENTIALS;
if (!keyFileContent) {
    console.error("CRITICAL ERROR: GCP_CREDENTIALS environment variable is missing in Vercel. Bot will not respond correctly.");
}

let credentials = {};
try {
    if (keyFileContent) {
        credentials = JSON.parse(keyFileContent);
    }
} catch (e) {
    console.error("ERROR: Failed to parse GCP_CREDENTIALS environment variable as JSON.", e);
}

const sessionClient = new dialogflow.SessionsClient({ credentials });

// ***************************************************************
// 3. إعداد الخادم
// ***************************************************************

app.use(bodyParser.json());

// ***************************************************************
// 4. مسار التحقق من Meta (GET)
// ***************************************************************
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook Verified!');
        res.status(200).send(challenge);
    } else {
        console.error('Failed verification. Ensure the token is correct.');
        res.sendStatus(403);
    }
});

// ***************************************************************
// 5. مسار استقبال رسائل المستخدمين (POST)
// ***************************************************************
app.post('/webhook', (req, res) => {
    const data = req.body;

    if (data.object === 'page') {
        data.entry.forEach(entry => {
            entry.messaging.forEach(event => {
                // معالجة الرسائل النصية فقط
                if (event.message && event.message.text) {
                    handleMessage(event);
                } else {
                    console.log("Received unhandled event (e.g., read receipts, postbacks).");
                }
            });
        });

        // يجب الرد بـ 200 لـ Meta فورًا
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
});

// ***************************************************************
// 6. دالة معالجة الرسائل وإرسالها إلى Dialogflow
// ***************************************************************
async function handleMessage(event) {
    const senderId = event.sender.id;
    const userMessage = event.message.text;

    console.log(`User ${senderId} sent message: ${userMessage}`);

    // إنشاء مسار الجلسة (Session Path)
    const sessionPath = sessionClient.projectAgentSessionPath(
        DIALOGFLOW_PROJECT_ID, 
        senderId // نستخدم الـ senderId كـ Session ID
    );

    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: userMessage,
                languageCode: 'ar', // استخدام اللغة العربية
            },
        },
    };

    try {
        // إرسال الرسالة إلى Dialogflow
        const responses = await sessionClient.detectIntent(request);
        const result = responses[0].queryResult;
        
        const fulfillmentText = result.fulfillmentText;

        if (fulfillmentText) {
            // إرسال الرد من Dialogflow إلى Messenger
            sendMessengerResponse(senderId, fulfillmentText);
        } else {
            // رد احتياطي في حال عدم وجود رد من Dialogflow
             sendMessengerResponse(senderId, "عفواً، لم أتمكن من فهم طلبك. هل يمكنك إعادة الصياغة؟");
        }

    } catch (error) {
        console.error('ERROR in Dialogflow detection:', error);
        // في حالة فشل الاتصال بـ Dialogflow
        sendMessengerResponse(senderId, 'حدث خطأ فني أثناء معالجة طلبك (فشل اتصال Dialogflow).');
    }
}

// ***************************************************************
// 7. دالة إرسال الرد إلى Meta Messenger API
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
// 8. تشغيل الخادم
// ***************************************************************
app.listen(PORT, () => {
    console.log(`Custom Webhook is running on port ${PORT}`);
});

// ```eof

// ### 🚀 الإجراءات المطلوبة منك الآن

// 1.  **حدث ملف `server.js`:** انسخ الكود أعلاه بالكامل واستبدل به محتوى ملف `server.js` في **GitHub**.
// 2.  **الرفع:** قم بحفظ التغييرات (`Commit changes`). سيبدأ Vercel البناء التلقائي.
// 3.  **الاختبار النهائي:** بمجرد أن يصبح الخادم جاهزاً في Vercel، أرسل رسالة جديدة للصفحة. **الرد يجب أن يأتي الآن من وكيل Dialogflow الخاص بك بشكل صحيح.**

// هذه هي آخر خطوة برمجية، وبعد نجاح الردود، يمكنك إرسال التطبيق للمراجعة دون مشكلة التحقق من النشاط التجاري.