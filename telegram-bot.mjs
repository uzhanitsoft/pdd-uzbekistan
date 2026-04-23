// Telegram PDD Bot Server
const BOT_TOKEN = '8728870101:AAF3TZ28eKVq54KviKlzM4NXN6h4P-ElU30';
const WEB_APP_URL = 'https://pdd-uzbekistan-production.up.railway.app';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

let offset = 0;

async function sendMessage(chatId, text, extra = {}) {
  await fetch(`${API}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', ...extra })
  });
}

async function processUpdate(update) {
  const msg = update.message;
  if (!msg || !msg.text) return;

  const chatId = msg.chat.id;
  const text = msg.text.trim();
  const name = msg.from.first_name || 'Foydalanuvchi';

  if (text === '/start') {
    await sendMessage(chatId,
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
            { text: '📊 Natijalarim', web_app: { url: WEB_APP_URL + '?tab=stats' } }
          ]]
        }
      }
    );
  }

  else if (text === '/test') {
    await sendMessage(chatId,
      `🚦 <b>PDD Test</b>\n\nQuyidagi tugmani bosib testni boshlang:`,
      {
        reply_markup: {
          inline_keyboard: [[
            { text: '📝 Test yechish', web_app: { url: WEB_APP_URL } }
          ]]
        }
      }
    );
  }

  else if (text === '/help') {
    await sendMessage(chatId,
      `❓ <b>Yordam</b>\n\n` +
      `🔹 /start — Botni boshlash\n` +
      `🔹 /test — PDD testni ochish\n` +
      `🔹 /help — Yordam\n\n` +
      `📱 Pastdagi <b>"🚦 PDD Test"</b> menu tugmasini bosib ham testni ochishingiz mumkin.\n\n` +
      `💡 <i>Ilova 3 tilda ishlaydi: O'zbek (lotin), Ўзбек (кирилл), Русский</i>`
    );
  }

  else {
    await sendMessage(chatId,
      `🚦 PDD Testni boshlash uchun /start buyrug'ini yuboring yoki pastdagi menu tugmasini bosing!`
    );
  }
}

async function poll() {
  console.log('🤖 PDD Bot ishga tushdi! (polling mode)');
  console.log('📱 Web App:', WEB_APP_URL);
  console.log('⏳ Xabarlar kutilmoqda...\n');

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
      console.error('Xato:', e.message);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

poll();
