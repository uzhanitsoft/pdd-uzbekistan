// Telegram Bot - PDD Mini App sozlash
const BOT_TOKEN = '8728870101:AAF3TZ28eKVq54KviKlzM4NXN6h4P-ElU30';
const WEB_APP_URL = 'https://pdd-uzbekistan-production.up.railway.app';
const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

async function setup() {
  console.log('🤖 Bot sozlanmoqda...\n');

  // 1. Bot ma'lumotlari
  const me = await fetch(`${API}/getMe`).then(r => r.json());
  console.log('✅ Bot:', me.result.first_name, `(@${me.result.username})`);

  // 2. Menu tugmasini Web App qilib sozlash
  const menuBtn = await fetch(`${API}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      menu_button: {
        type: 'web_app',
        text: '🚦 PDD Test',
        web_app: { url: WEB_APP_URL }
      }
    })
  }).then(r => r.json());
  console.log('✅ Menu tugmasi:', menuBtn.ok ? 'O\'rnatildi' : menuBtn.description);

  // 3. Bot buyruqlari
  const cmds = await fetch(`${API}/setMyCommands`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      commands: [
        { command: 'start', description: '🚀 Boshlash' },
        { command: 'test', description: '🚦 PDD Testni ochish' },
        { command: 'help', description: '❓ Yordam' }
      ]
    })
  }).then(r => r.json());
  console.log('✅ Buyruqlar:', cmds.ok ? 'O\'rnatildi' : cmds.description);

  // 4. Bot tavsifini o'rnatish
  const desc = await fetch(`${API}/setMyDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      description: "🚦 O'zbekiston PDD Test — Yo'l harakati qoidalari imtihoniga tayyorlaning! Biletlar, imtihon rejimi va statistika."
    })
  }).then(r => r.json());
  console.log('✅ Tavsif:', desc.ok ? 'O\'rnatildi' : desc.description);

  // 5. Qisqa tavsif
  const shortDesc = await fetch(`${API}/setMyShortDescription`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      short_description: "🚦 PDD Test — Haydovchilik guvohnomasi uchun tayyorlanish"
    })
  }).then(r => r.json());
  console.log('✅ Qisqa tavsif:', shortDesc.ok ? 'O\'rnatildi' : shortDesc.description);

  console.log('\n🎉 Bot tayyor! Telegram da @' + me.result.username + ' ni oching');
  console.log('📱 Menu tugmasini bosib PDD testni boshlang!\n');
}

setup().catch(e => console.error('❌ Xato:', e.message));
