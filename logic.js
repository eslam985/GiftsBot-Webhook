const dialogflow = require('@google-cloud/dialogflow');
const uuid = require('uuid');
const express = require('express');
const bodyParser = require('body-parser');

// المتغيرات المطلوبة من بيئة Vercel
const PROJECT_ID = process.env.DIALOGFLOW_PROJECT_ID;

// تحليل مفتاح خدمة Google Cloud من متغير البيئة (الذي يحمل محتوى JSON)
// **هذا الجزء تم تعديله للتحقق من وجود المتغير قبل محاولة التحليل.**
let credentials;
try {
    if (!process.env.GCP_CREDENTIALS) {
        // إطلاق خطأ واضح إذا كان المتغير غير موجود (قيمة 'undefined')
        throw new Error("GCP_CREDENTIALS environment variable is not defined on Vercel. Ensure it is set for the Production environment.");
    }
    // محاولة تحليل JSON
    credentials = JSON.parse(process.env.GCP_CREDENTIALS);
} catch (error) {
    // تسجيل الخطأ وحل مشكلة 'SyntaxError: "undefined" is not valid JSON'
    console.error("CRITICAL ERROR: Failed to load Dialogflow credentials.");
    console.error(error.message);
    
    // تعيين قيمة لتجنب تعطل التهيئة أدناه
    credentials = null; 
}

// إعداد عميل Dialogflow باستخدام بيانات الاعتماد الجديدة
// يجب أن يتم التحقق من وجود بيانات الاعتماد قبل التهيئة
const sessionClient = credentials ? new dialogflow.SessionsClient({ credentials }) : null;

// استخدام المتغير الجديد
const projectId = PROJECT_ID;

// تحميل بيانات المنتجات (افتراضية لغرض العرض)
// يجب عليك التأكد من أن ملف data.json موجود وصحيح في مشروعك
let products = [];
try {
    const data = require('./data.json');
    products = data.products; // استخراج مصفوفة المنتجات من الكائن
} catch (e) {
    console.error("CRITICAL ERROR: Could not load data.json file.", e.message);
}

const STORE_CONTACT_NUMBER = '01013080898'; 
const STORE_CONTACT_WHATSAPP = '201013080898'; 
const WHATSAPP_LINK = `https://wa.me/${STORE_CONTACT_WHATSAPP}`;

/**
 * 📞 يرسل رسالة نصية إلى Dialogflow ويسترجع الرد.
 * @param {string} sessionId - معرّف الجلسة (عادةً PSID من Messenger).
 * @param {string} text - النص الذي أرسله المستخدم.
 * @returns {Promise<object>} - كائن يحتوي على نتيجة الاستجابة من Dialogflow.
 */
async function sendToDialogflow(sessionId, text) {
    if (!sessionClient || !projectId) {
        // في حالة عدم تهيئة العميل، سنرد بخطأ واضح
        console.error('Dialogflow client is not initialized. Check Vercel environment variables.');
        return { fulfillmentText: 'تعذر الاتصال بخدمة الذكاء الاصطناعي. الرجاء التحقق من إعدادات المفتاح السري (GCP_CREDENTIALS) في Vercel.' };
    }

    const sessionPath = sessionClient.projectAgentSessionPath(projectId, sessionId);
    const request = {
        session: sessionPath,
        queryInput: {
            text: {
                text: text,
                languageCode: 'ar-EG', // يمكنك تغيير هذا حسب لغة البوت
            },
        },
    };

    try {
        const responses = await sessionClient.detectIntent(request);
        return responses[0].queryResult;
    } catch (error) {
        console.error('ERROR in Dialogflow API:', error);
        throw error;
    }
}

/**
 * 🎁 دالة مساعدة لإنشاء رد متكامل مع قائمة من المنتجات
 * @param {Array<object>} productList - قائمة المنتجات.
 * @returns {object} - كائن رسالة Messenger بصيغة Generic Template.
 */
function createProductGallery(productList) {
    const elements = productList.slice(0, 10).map(product => ({ // Meta تسمح بـ 10 عناصر كحد أقصى
        title: product.name,
        subtitle: `${product.price} جنيه مصري - ${product.description}`,
        image_url: product.image_url || 'https://placehold.co/600x400/000000/FFFFFF/png?text=Gift',
        buttons: [
            {
                type: 'postback',
                title: 'اطلب الآن',
                payload: `ORDER_PRODUCT_${product.id}`,
            },
            {
                type: 'web_url',
                url: WHATSAPP_LINK,
                title: 'تواصل واتساب',
            }
        ],
    }));

    return {
        attachment: {
            type: 'template',
            payload: {
                template_type: 'generic',
                elements: elements,
            },
        },
    };
}


/**
 * 📲 معالجة استدعاءات الـ Webhook الواردة من Dialogflow (لتكامل Telegram/ويب)
 * @param {object} req - طلب HTTP الوارد.
 * @param {object} res - استجابة HTTP.
 */
function processDialogflowWebhook(req, res) {
    // التحقق الأساسي للطلب الوارد
    if (!req.body || !req.body.queryResult) {
        return res.status(400).send({ fulfillmentText: 'Invalid Dialogflow webhook request.' });
    }

    const intentName = req.body.queryResult.intent.displayName;
    const parameters = req.body.queryResult.parameters;
    let fulfillmentText = req.body.queryResult.fulfillmentText;
    let fulfillmentMessages = [];


    // 🛠️ منطق معالجة الـ Intent الخاص بك
    switch (intentName) {
        case 'Show_Products': {
            // تنفيذ منطق عرض المنتجات هنا
            const galleryResponse = createProductGallery(products);

            // نرسل الرد إلى Dialogflow بصيغة مخصصة (Custom Payload) ليتم معالجته بواسطة Telegram
            fulfillmentMessages.push({
                payload: {
                    facebook: galleryResponse, // نستخدم "facebook" كـ Custom Payload
                    telegram: {
                        text: "إليك بعض المنتجات المقترحة:",
                        // يمكنك إضافة لوحة مفاتيح Telegram هنا
                    }
                }
            });

            // نستخدم هذا الرد لتلبية طلب Dialogflow Webhook
            return res.json({ fulfillmentText: fulfillmentText, fulfillmentMessages: fulfillmentMessages });
        }

        case 'Contact_Store': {
            fulfillmentText = `يمكنك التواصل معنا عبر الاتصال على ${STORE_CONTACT_NUMBER} أو عبر واتساب من خلال هذا الرابط: ${WHATSAPP_LINK}`;
            break;
        }

        case 'Order_Placement': {
            // مثال: استخراج نوع الهدية والميزانية
            const giftType = parameters['gift-type'];
            const budget = parameters['price'];

            fulfillmentText = `لقد استلمت طلبك لهدية من نوع: ${giftType || 'لم يحدد'} بميزانية: ${budget || 'لم تحدد'}. سأتواصل معك قريباً لتأكيد تفاصيل الطلب.`;
            break;
        }

        default:
            // استخدام الرد الافتراضي الذي تم إعداده في Dialogflow
            break;
    }

    // إرسال الرد النهائي إلى Dialogflow
    res.json({ fulfillmentText: fulfillmentText, fulfillmentMessages: fulfillmentMessages });
}

// تصدير الدوال للاستخدام في server.js
module.exports = {
    sendToDialogflow,
    processDialogflowWebhook,
    // يمكنك تصدير الدوال المساعدة الأخرى إذا احتجت إليها في server.js
};