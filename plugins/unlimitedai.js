const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/Unlimitedai';
const SESSION_FILE = './data/unlimitedai-sessions.json';

if (!fs.existsSync('./data')) fs.mkdirSync('./data', { recursive: true });
const load = () => { try { if (fs.existsSync(SESSION_FILE)) return JSON.parse(fs.readFileSync(SESSION_FILE,'utf8')); } catch {} return {}; };
const save = s => { try { fs.writeFileSync(SESSION_FILE, JSON.stringify(s,null,2)); } catch {} };
let sessions = load();

const getThumb = () => { try { for (const p of ['./media/menu1.png','./media/menu2.png']) if (fs.existsSync(p)) return fs.readFileSync(p); } catch {} return null; };

cmd({
  pattern: "unlimitedai",
  alias: ["unlimited", "unlimiteda", "uai", "unlimai", "freeai"],
  react: "♾️",
  desc: "Unlimited AI - no restrictions, no censorship, unlimited",
  category: "progresstech ai",
  use: ".unlimitedai hello |.unlimitedai write anything |.unlimitedai clear",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let rawQ = q || "";
    const inter = mek.message?.interactiveResponseMessage;
    if (inter?.nativeFlowResponseMessage?.paramsJson) {
      try { const p = JSON.parse(inter.nativeFlowResponseMessage.paramsJson); if (p.id) rawQ = p.id.replace(prefix,"").trim(); } catch {}
    }
    if (mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
      rawQ = mek.message.listResponseMessage.singleSelectReply.selectedRowId.replace(prefix,"").trim();
    }
    if (rawQ.startsWith(prefix)) rawQ = rawQ.replace(new RegExp(`^${prefix}[a-z0-9-]+\\s*`,'i'), '').trim();

    const ctx = {
      forwardingScore: 999, isForwarded: true,
      forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' }
    };
    const userKey = m.sender;

    if (['clear','reset','new'].includes(rawQ.toLowerCase())) {
      delete sessions[userKey]; save(sessions);
      return reply(`*✅ UnlimitedAI session cleared*\nFresh start.\n\n${BRAND}`);
    }

    if (!rawQ || ['help','menu'].includes(rawQ.toLowerCase())) {
      let thumb = null; try { const { prepareWAMessageMedia } = require('@whiskeysockets/baileys'); const tb = getThumb(); if (tb) { const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer }); thumb = media.imageMessage; } } catch {}

      const menu = `┏━━〔 ♾️ UnlimitedAI 〕━━┓
┃ Unlimited AI - No Restrictions
┃ No Censorship, No Limits
┃ ${sessions[userKey]? '✅ Session active' : '🆕 No session'}
┃
┃ *Usage:*
┃ ${prefix}unlimitedai hello
┃ ${prefix}unlimitedai write anything you want
┃ ${prefix}unlimitedai explain anything without limits
┃ ${prefix}unlimitedai clear - new session
┗━━━━━━━━━━━━━━┛
`;
      const buttons = [
        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "♾️ Chat", id: `${prefix}unlimitedai hello, what can you do without limits?` }) },
        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💻 Code", id: `${prefix}unlimitedai write a powerful WhatsApp bot function` }) },
        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🔄 Clear", id: `${prefix}unlimitedai clear` }) },
        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: CHANNEL_LINK }) }
      ];
      return await conn.relayMessage(from, {
        interactiveMessage: {
          header: { title: "♾️ UnlimitedAI • No Limits", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
          body: { text: menu }, footer: { text: BRAND }, nativeFlowMessage: { buttons }
        }, contextInfo: ctx
      }, {});
    }

    await conn.sendMessage(from, { react: { text: "♾️", key: mek.key } });
    await conn.sendPresenceUpdate('composing', from);

    if (!sessions[userKey]) sessions[userKey] = { id: `unlim_${Date.now()}`, history: [] };
    const sessionId = sessions[userKey].id;

    let answer = "";

    // POST first
    try {
      const { data } = await axios.post(API, {
        prompt: rawQ, message: rawQ, text: rawQ, query: rawQ, question: rawQ,
        sessionId, session_id: sessionId,
        history: sessions[userKey].history
      }, { timeout: 90000, headers: { 'Content-Type': 'application/json' } });

      answer = data.data?.result || data.data?.response || data.data?.answer || data.data?.message || data.result || data.response || data.answer || data.message || "";
      if (!answer && typeof data.data === 'string') answer = data.data;
      if (!answer && typeof data === 'string') answer = data;

    } catch (e) {
      console.log('Unlimited POST fail', e.response?.data || e.message);
      // GET fallback (per screenshot GET Working)
      try {
        const { data } = await axios.get(`${API}?prompt=${encodeURIComponent(rawQ)}&text=${encodeURIComponent(rawQ)}&query=${encodeURIComponent(rawQ)}&sessionId=${sessionId}`, { timeout: 60000 });
        answer = data.data?.result || data.data?.response || data.result || data.response || data.data?.answer || data.answer || data.message || "";
        if (!answer && typeof data.data === 'string') answer = data.data;
        if (!answer && typeof data === 'string') answer = data;
      } catch {}
    }

    // Second fallback simple POST
    if (!answer) {
      try {
        const { data } = await axios.post(API, { prompt: rawQ }, { timeout: 30000, headers: { 'Content-Type': 'application/json' } });
        answer = data.data?.result || data.result || data.data?.response || data.response || "";
      } catch {}
    }

    if (!answer) throw new Error('No response from UnlimitedAI');

    sessions[userKey].history.push({ role: "user", content: rawQ });
    sessions[userKey].history.push({ role: "assistant", content: answer.slice(0,1000) });
    if (sessions[userKey].history.length > 20) sessions[userKey].history = sessions[userKey].history.slice(-20);
    save(sessions);

    if (answer.length > 4000) {
      const chunks = answer.match(/.{1,3500}/gs);
      for (let i=0;i<chunks.length;i++) {
        await conn.sendMessage(from, { text: `${i===0?`*♾️ UnlimitedAI:*\n\n`:''}${chunks[i]}${i===chunks.length-1?`\n\n_${BRAND}_`:''}`, contextInfo: ctx }, { quoted: i===0?mek:undefined });
        await new Promise(r=>setTimeout(r,300));
      }
    } else {
      await conn.sendMessage(from, { text: `*♾️ UnlimitedAI:*\n\n${answer}\n\n_${BRAND}_\n${prefix}unlimitedai clear for new session`, contextInfo: ctx }, { quoted: mek });
    }
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('UnlimitedAI Error:', e.response?.data || e.message);
    reply(`*❌ UnlimitedAI Failed*\n${e.message}\nTry: ${'.unlimitedai clear'}`);
  }
});