const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/Maker/avengers';

function getThumbBuffer() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png']) {
            if (fs.existsSync(p)) return fs.readFileSync(p);
        }
    } catch {}
    return null;
}

function cleanQuery(raw, prefix, patterns){
    let q = (raw||"").trim();
    if(!q) return "";
    if(q.startsWith(prefix)){
        q = q.slice(prefix.length).trim();
        q = q.replace(new RegExp(`^(${patterns.join('|')})\\b\\s*`, 'i'), '').trim();
    }
    return q;
}

cmd({
  pattern: "avengers",
  alias: ["avenger", "avengerslogo", "textproavengers", "marvel"],
  react: "🦸",
  desc: "Generate Avengers-style logo using TextPro",
  category: "maker",
  use: ".avengers Progress Tech",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let rawQ = q || "";
    try {
        const p1 = mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        if(p1){ const j = JSON.parse(p1); if(j.id) rawQ = j.id; }
        const p2 = mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
        if(p2) rawQ = p2;
    } catch {}

    let text = cleanQuery(rawQ, prefix, ["avengers","avenger","avengerslogo","textproavengers","marvel"]);
    if(!text) text = cleanQuery(q, prefix, ["avengers","avenger","avengerslogo","textproavengers","marvel"]);
    if(!text) text = (rawQ || "").trim();

    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' }
    };

    if (!text || ['help','menu','logo'].includes(text.toLowerCase())) {
        let thumb = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const buf = getThumbBuffer();
            if(buf){
                const media = await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer });
                thumb = media.imageMessage;
            }
        } catch {}

        const menu = `┏━━〔 🦸 Avengers Logo 〕━━┓
┃ Generate Avengers-style logo
┃ Using TextPro - Returns HD PNG
┃
┃ *Usage:*
┃ ${prefix}avengers Progress Tech
┃ ${prefix}avengers Mona Lisa
┃ ${prefix}avengers TECH TOY
┗━━━━━━━━━━━━━━┛`;

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🦸 Avengers Logo • TextPro", hasMediaAttachment:!!thumb, ...(thumb?{imageMessage:thumb}:{}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: {
                    buttons: [
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🦸 Progress Tech", id: `${prefix}avengers Progress Tech` }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🦸 TECH TOY", id: `${prefix}avengers TECH TOY` }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🦸 Mona Lisa", id: `${prefix}avengers Mona Lisa` }) },
                        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: CHANNEL_LINK }) }
                    ]
                }
            },
            contextInfo: ctx
        }, {});
    }

    try{ await conn.sendMessage(from, { react: { text: "🦸", key: mek.key } }); }catch{}
    await reply(`*🦸 Generating Avengers Logo...*\n*Text:* ${text}\n_${BRAND}_`);

    let imageBuffer = null;
    let imageUrl = null;

    // GET - raw PNG per docs
    try {
        const { data, headers } = await axios.get(`${API}?text=${encodeURIComponent(text)}&name=${encodeURIComponent(text)}&q=${encodeURIComponent(text)}`, {
            timeout: 60000,
            responseType: 'arraybuffer',
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        const buf = Buffer.from(data);
        const isJson = buf.toString('utf8',0,30).trim().startsWith('{');
        if(isJson){
            try{
                const json = JSON.parse(buf.toString('utf8'));
                imageUrl = json.data?.url || json.data?.image_url || json.url || json.result;
            }catch{}
        } else if(buf.length > 1500){
            imageBuffer = buf;
        }
    } catch(e){
        console.log('Avengers GET fail:', e.message);
    }

    // POST fallback
    if(!imageBuffer &&!imageUrl){
        try{
            const { data } = await axios.post(API, { text, name: text, q: text }, { timeout: 60000, responseType: 'arraybuffer' });
            const buf = Buffer.from(data);
            const isJson = buf.toString('utf8',0,30).trim().startsWith('{');
            if(isJson){
                try{
                    const json = JSON.parse(buf.toString('utf8'));
                    imageUrl = json.data?.url || json.data?.image_url || json.url || json.result;
                }catch{}
            } else if(buf.length > 1500){
                imageBuffer = buf;
            }
        }catch(e){ console.log('Avengers POST fail:', e.message); }
    }

    if(imageUrl){
        await conn.sendMessage(from, { image: { url: imageUrl }, caption: `*✅ Avengers - ${text}*\n\n${BRAND}\n${CHANNEL_LINK}`, contextInfo: ctx }, { quoted: mek });
        try{ await conn.sendMessage(from, { react: { text: "✅", key: mek.key } }); }catch{}
        return;
    }

    if(!imageBuffer) throw new Error('No PNG returned - API may be down');

    await conn.sendMessage(from, {
        image: imageBuffer,
        caption: `*✅ Avengers Logo - ${text}*\n\n${BRAND}\n${CHANNEL_LINK}`,
        contextInfo: ctx
    }, { quoted: mek });

    await conn.sendMessage(from, {
        document: imageBuffer,
        mimetype: 'image/png',
        fileName: `Avengers_${text.replace(/\s+/g,'_')}.png`,
        caption: `*HD PNG - ${text}*\n${BRAND}`,
        contextInfo: ctx
    }, { quoted: mek });

    try{ await conn.sendMessage(from, { react: { text: "✅", key: mek.key } }); }catch{}

  } catch (e) {
    console.error('Avengers Error:', e.response?.data ? Buffer.from(e.response.data).toString().slice(0,500) : e.stack);
    try{ await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); }catch{}
    await reply(`*❌ Avengers Failed*\n${e.message}\nTry: .avengers Progress Tech\n${BRAND}`);
  }
});
