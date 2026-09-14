const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/tools/freenumber-countries-availble';

function getThumb() { try { for (const p of ['./media/menu1.png','./media/menu2.png']) if (fs.existsSync(p)) return fs.readFileSync(p); } catch {} return null; }

cmd({
  pattern: "freenumber",
  alias: ["veepn", "veepncountries", "freenum", "countries", "vpncountries"],
  react: "🌍",
  desc: "Get all available Veepn free number countries - no params required",
  category: "progresstech tools",
  use: ".freenumber",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    const ctx = { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' } };

    let rawQ = q || "";
    if (mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson) {
      try { const p = JSON.parse(mek.message.interactiveResponseMessage.nativeFlowResponseMessage.paramsJson); if (p.id) rawQ = p.id.replace(prefix,"").trim(); } catch {}
    }

    if (!rawQ || ['help','menu'].includes(rawQ.toLowerCase())) {
        // still show menu but also auto fetch
    }

    await conn.sendMessage(from, { react: { text: "🌍", key: mek.key } });

    let dataResult = null;
    try {
        const { data } = await axios.get(API, { timeout: 20000 });
        dataResult = data.data || data.result || data;
    } catch {
        const { data } = await axios.post(API, {}, { timeout: 20000, headers: { 'Content-Type': 'application/json' } });
        dataResult = data.data || data.result || data;
    }

    if (!dataResult) throw new Error('No countries returned');

    let countries = [];
    if (Array.isArray(dataResult)) countries = dataResult;
    else if (Array.isArray(dataResult.countries)) countries = dataResult.countries;
    else if (Array.isArray(dataResult.data)) countries = dataResult.data;
    else if (typeof dataResult === 'object') countries = Object.values(dataResult).flat().filter(x=> typeof x === 'string' || x.name) && (Array.isArray(dataResult.available)? dataResult.available : [dataResult]);

    // Normalize to string list
    let list = [];
    if (Array.isArray(countries)) {
        list = countries.map(c=> typeof c === 'string'? c : c.name || c.country || c.code || JSON.stringify(c));
    } else {
        list = [JSON.stringify(dataResult).slice(0,3000)];
    }

    if (list.length === 0) list = ['Data: '+JSON.stringify(dataResult).slice(0,3000)];

    let msg = `*🌍 Veepn Free Number - Available Countries*\n*Total:* ${list.length}\n\n`;
    msg += list.map((c,i)=> `${i+1}. ${c}`).join('\n');
    msg += `\n\n_${BRAND}_\n_Use:.freenumber <country> to filter_`;

    // Filter if query provided
    if (rawQ &&!['help','menu'].includes(rawQ.toLowerCase())) {
        const qlow = rawQ.toLowerCase();
        const filtered = list.filter(c=> c.toLowerCase().includes(qlow));
        if (filtered.length>0) {
            msg = `*🌍 Filtered for "${rawQ}"*\n*Found:* ${filtered.length}/${list.length}\n\n${filtered.map((c,i)=> `${i+1}. ${c}`).join('\n')}\n\n${BRAND}`;
        }
    }

    // If long, send as file too
    if (msg.length > 4000) {
        await conn.sendMessage(from, { text: msg.slice(0,3900)+'\n\n_...full list in file_', contextInfo: ctx }, { quoted: mek });
        await conn.sendMessage(from, {
            document: Buffer.from(`VEEPN COUNTRIES - Total ${list.length}\nTime: ${new Date().toLocaleString()}\n\n${list.join('\n')}\n\n${BRAND}`),
            mimetype: 'text/plain',
            fileName: `Veepn_Countries_${Date.now()}.txt`,
            caption: `*🌍 All ${list.length} Countries*\n${BRAND}`,
            contextInfo: ctx
        }, { quoted: mek });
    } else {
        await conn.sendMessage(from, { text: msg, contextInfo: ctx }, { quoted: mek });
    }

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Veepn Error:', e.response?.data || e.message);
    reply(`*❌ Veepn Countries Failed*\n${e.message}`);
  }
});