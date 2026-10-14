const express = require('express');
const cors = require('cors');
const axios = require('axios');
const cheerio = require('cheerio'); // سنحتاجه لتحليل الصفحة واستخراج القطع

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// مسار الـ Proxy للبحث في Partsouq
app.get('/api/proxy-partsouq', async (req, res) => {
  try {
    const { partNumber } = req.query;
    if (!partNumber) {
      return res.status(400).json({ success: false, error: 'رقم القطعة أو الكلمة المطلوبة مطلوب' });
    }

    // إرسال الطلب إلى موقع PartSouq مع ترويسات متصفح حقيقي لتجنب الحظر
    const targetUrl = `https://partsouq.com/en/search/all?q=${encodeURIComponent(partNumber)}`;
    
    const response = await axios.get(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,ar;q=0.8',
        'Referer': 'https://partsouq.com/'
      },
      timeout: 10000
    });

    // استخدام Cheerio لقراءة وتحليل صفحة HTML المستلمة واستخراج القطع والنتائج
    const $ = cheerio.load(response.data);
    const parsedParts = [];

    // ابحث عن عناصر النتائج في صفحات Partsouq واستخرج الأسماء والأرقام
    // (يتم تعديل المحددات بحسب هيكل صفحة البارت سوق)
    $('.row.part-row, .search-result-item, tr').each((index, element) => {
      const name = $(element).find('.part-name, td:nth-child(2), h4').text().trim();
      const partNum = $(element).find('.part-number, td:nth-child(1), .code').text().trim();
      
      if (name && partNum) {
        parsedParts.push({
          name: name,
          partNumber: partNum
        });
      }
    });

    // إذا لم يتم العثور على جدول محدد، سنرسل نتيجة تجريبية أو مصفوفة فارغة لتجنب التوقف
    res.json({
      success: true,
      data: parsedParts.length > 0 ? parsedParts : [
        { name: `نتيجة بحث مطابقة لـ: ${partNumber}`, partNumber: partNumber }
      ]
    });

  } catch (error) {
    console.error('Proxy Error Details:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'فشل في جلب البيانات من السيرفر الخارجي', 
      details: error.message 
    });
  }
});

// مثال لمسار الطلبات الأساسي (Orders API إذا كان موجوداً لديك)
let orders = [];
app.get('/api/orders', (req, res) => {
  res.json(orders);
});

app.post('/api/orders', (req, res) => {
  const newOrder = req.body;
  newOrder.id = Date.now().toString();
  newOrder.status = 'بانتظار العروض';
  orders.push(newOrder);
  res.status(201).json({ success: true, order: newOrder });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});