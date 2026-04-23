import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// JSON body parser
app.use(express.json({ limit: '5mb' }));

// ====== PROGRESS API ======
const PROGRESS_DIR = path.join(__dirname, 'data', 'progress');
if (!fs.existsSync(PROGRESS_DIR)) {
  fs.mkdirSync(PROGRESS_DIR, { recursive: true });
}

// Save progress
app.post('/api/progress/:userId', (req, res) => {
  try {
    const safeId = req.params.userId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeId) return res.status(400).json({ error: 'Invalid userId' });
    const data = { ...req.body, updatedAt: Date.now() };
    fs.writeFileSync(path.join(PROGRESS_DIR, `${safeId}.json`), JSON.stringify(data), 'utf-8');
    res.json({ success: true, updatedAt: data.updatedAt });
  } catch (err) {
    console.error('Save progress error:', err);
    res.status(500).json({ error: 'Failed to save' });
  }
});

// Load progress
app.get('/api/progress/:userId', (req, res) => {
  try {
    const safeId = req.params.userId.replace(/[^a-zA-Z0-9_-]/g, '');
    if (!safeId) return res.status(400).json({ error: 'Invalid userId' });
    const filePath = path.join(PROGRESS_DIR, `${safeId}.json`);
    if (!fs.existsSync(filePath)) return res.json({ exists: false });
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json({ exists: true, data });
  } catch (err) {
    console.error('Load progress error:', err);
    res.status(500).json({ error: 'Failed to load' });
  }
});

// Serve static files from dist (built Vite output)
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1d',
  etag: true,
}));

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚦 PDD Server running on port ${PORT}`);
  startTelegramBot();
});

// ====== TELEGRAM BOT ======
function startTelegramBot() {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8728870101:AAF3TZ28eKVq54KviKlzM4NXN6h4P-ElU30';
  const WEB_APP_URL = process.env.WEB_APP_URL || 'https://pdd-uzbekistan-production.up.railway.app';
  const API = `https://api.telegram.org/bot${BOT_TOKEN}`;
  let offset = 0;

  async function sendMsg(chatId, text, extra = {}) {
    try {
      await fetch(`${API}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra })
      });
    } catch (e) { console.error('TG send error:', e.message); }
  }

  async function processUpdate(update) {
    const msg = update.message;
    if (!msg || !msg.text) return;
    const chatId = msg.chat.id;
    const text = msg.text.trim();
    const name = msg.from.first_name || 'Foydalanuvchi';

    if (text === '/start') {
      await sendMsg(chatId,
        `🚦 <b>Assalomu alaykum, ${name}!</b>\n\n` +
        `Xush kelibsiz <b>PDD O'zbekiston</b> botiga!\n\n` +
        `📋 Bu yerda siz:\n` +
        `• 800+ test savollarini yechishingiz\n` +
        `• Imtihon rejimida o'zingizni sinashingiz\n` +
        `• Bilet bo'yicha tayyorlanishingiz mumkin\n\n` +
        `Pastdagi <b>"🚦 PDD Test"</b> tugmasini bosing yoki quyidagi tugmani tanlang 👇`,
        {
          reply_markup: {
            inline_keyboard: [[
              { text: '🚀 PDD Testni boshlash', web_app: { url: WEB_APP_URL } }
            ], [
              { text: '📊 Natijalarim', web_app: { url: WEB_APP_URL } }
            ]]
          }
        }
      );
    } else if (text === '/test') {
      await sendMsg(chatId, `🚦 <b>PDD Test</b>\n\nQuyidagi tugmani bosib testni boshlang:`, {
        reply_markup: { inline_keyboard: [[ { text: '📝 Test yechish', web_app: { url: WEB_APP_URL } } ]] }
      });
    } else if (text === '/help') {
      await sendMsg(chatId,
        `❓ <b>Yordam</b>\n\n` +
        `🔹 /start — Botni boshlash\n` +
        `🔹 /test — PDD testni ochish\n` +
        `🔹 /help — Yordam\n\n` +
        `📱 Pastdagi <b>"🚦 PDD Test"</b> menu tugmasini bosib ham testni ochishingiz mumkin.\n\n` +
        `💡 <i>Ilova 3 tilda ishlaydi: O'zbek (lotin), Ўзбек (кирилл), Русский</i>`
      );
    } else {
      await sendMsg(chatId, `🚦 PDD Testni boshlash uchun /start buyrug'ini yuboring yoki pastdagi menu tugmasini bosing!`);
    }
  }

  async function poll() {
    while (true) {
      try {
        const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=30`);
        const data = await res.json();
        if (data.ok && data.result.length > 0) {
          for (const update of data.result) {
            offset = update.update_id + 1;
            await processUpdate(update);
          }
        }
      } catch (e) {
        console.error('TG poll error:', e.message);
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }

  console.log('🤖 Telegram bot ishga tushdi!');
  poll();
}
