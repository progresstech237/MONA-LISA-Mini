const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/ai/Claude-pro';

let sessions = {};

function getThumbBuffer() {
    try {
        for (const p of ['./media/menu1.png','./media/menu2.png','./media/menu3.png']) {
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

async function getImageBase64(mek, conn) {
    try {
        const ctxInfo = mek.message?.extendedTextMessage?.contextInfo;
        const qMsg = ctxInfo?.quotedMessage;
        const imgMsg = qMsg?.imageMessage || mek.message?.imageMessage;
        const doc = qMsg?.documentMessage?.mimetype?.startsWith('image/')? qMsg.documentMessage : null;
        const target = imgMsg? { message: { imageMessage: imgMsg } } : doc? { message: { documentMessage: doc } } : null;
        if(!target) return null;
        const buffer = await conn.downloadMediaMessage(target, 'buffer', {}, { reuploadRequest: conn.updateMediaMessage });
        if(!buffer || buffer.length < 100) return null;
        return buffer.toString('base64');
    } catch (e) {
        console.log('getImageBase64 error:', e.message);
        return null;
    }
}

cmd({
  pattern: "claude",
  alias: ["claudepro", "deepai", "claude-pro", "vision"],
  react: "🧠",
  desc: "Claude Pro - 15+ models, vision, image gen, edit",
  category: "ai",
  use: ".claude hello |.claude gen image cat | reply image.claude what is this?",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  const sender = m?.sender || mek?.key?.participant || mek?.key?.remoteJid || from;
  try {
    let rawQ = q || "";
    try {
        const p1 = mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
        if(p1){ const j = JSON.parse(p1); if(j.id) rawQ = j.id; }
        const p2 = mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
        if(p2) rawQ = p2;
    } catch {}

    let cleaned = cleanQuery(rawQ, prefix, ["claude","claudepro","deepai","claude-pro","vision"]);
    if(!cleaned) cleaned = cleanQuery(q, prefix, ["claude","claudepro","deepai","claude-pro","vision"]);
    if(!cleaned) cleaned = (rawQ || "").trim();

    const ctx = {
        forwardingScore: 999, isForwarded: true,
        forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' }
    };

    if (['clear','new','reset','restart'].includes(cleaned.toLowerCase())) {
        delete sessions[sender];
        return await reply(`*✅ Claude session cleared*\n${BRAND}`);
    }

    if (!cleaned) {
        let thumb = null;
        try {
            const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
            const buf = getThumbBuffer();
            if(buf){
                const media = await prepareWAMessageMedia({ image: buf }, { upload: conn.waUploadToServer });
                thumb = media.imageMessage;
            }
        } catch {}

        const menu = `┏━━〔 🧠 Claude-Pro 〕━━┓
┃ Full DeepAI - 15+ Models
┃ chat, vision, image gen, edit
┃
┃ *Usage:*
┃ ${prefix}claude <question>
┃ ${prefix}claude gen image; a cyberpunk city
┃ Reply image + ${prefix}claude what is this?
┃ Reply image + ${prefix}claude edit; make it sunset
┃ ${prefix}claude clear - reset
┗━━━━━━━━━━━━━━┛`;

        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🧠 Claude Pro • 15+ Models", hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{}) },
                body: { text: menu },
                footer: { text: BRAND },
                nativeFlowMessage: {
                    buttons: [
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "💬 Chat", id: `${prefix}claude Hello, explain yourself` }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎨 Gen Image", id: `${prefix}claude gen image; Mona Lisa afro girl, album art` }) },
                        { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "👁️ Vision", id: `${prefix}claude what do you see?` }) },
                        { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: CHANNEL_LINK }) }
                    ]
                }
            },
            contextInfo: ctx
        }, {});
    }

    try{ await conn.sendMessage(from, { react: { text: "🧠", key: mek.key } }); }catch{}

    if (!sessions[sender]) sessions[sender] = { id: `claude_${Date.now()}_${sender.split('@')[0]}`, history: [], time: Date.now() };
    const sessionId = sessions[sender].id;

    let action = "chat";
    let prompt = cleaned;
    const lower = cleaned.toLowerCase();

    if (lower.startsWith('gen image') || lower.startsWith('generate image')) {
        action = "generate-image";
        prompt = cleaned.replace(/gen image|generate image/gi,'').replace(/^[\s;:\-–—]+/, '').trim();
    } else if (lower.startsWith('edit')) {
        action = "edit-image";
        prompt = cleaned.replace(/^edit\s*/i,'').replace(/^[\s;:\-–—]+/, '').trim();
    }

    const imageBase64 = await getImageBase64(mek, conn);
    if (imageBase64 && action === 'chat') action = "vision-chat";

    const payload = {
        action, prompt, message: prompt, text: prompt, query: prompt,
        sessionId, session_id: sessionId,
        model: "claude-3.5-sonnet", mode: action
    };
    if (imageBase64) {
        payload.image = `data:image/jpeg;base64,${imageBase64}`;
        payload.image_base64 = imageBase64;
        payload.base64 = imageBase64;
    }

    const { data } = await axios.post(API, payload, { timeout: 120000, headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' } });

    const resultUrl = data.data?.url || data.data?.image_url || data.image_url || data.url || data.data?.result_url;
    const resultBase64 = data.data?.base64 || data.data?.image_base64 || data.base64;
    let textAnswer = data.data?.result || data.data?.answer || data.data?.response || data.result || data.answer || data.response || data.message;

    if (action === 'generate-image' || action === 'edit-image') {
        if (resultBase64) {
            const buf = Buffer.from(resultBase64.replace(/^data:image\/\w+;base64,/,''), 'base64');
            await conn.sendMessage(from, { image: buf, caption: `*🎨 Claude Pro - ${action}*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        } else if (resultUrl) {
            await conn.sendMessage(from, { image: { url: resultUrl }, caption: `*🎨 Claude Pro - ${action}*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        } else if (typeof textAnswer === 'string' && textAnswer.trim().startsWith('http')) {
            await conn.sendMessage(from, { image: { url: textAnswer.trim() }, caption: `*🎨 ${action}*\n${prompt}\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        } else if (textAnswer) {
            await conn.sendMessage(from, { text: `*🧠 Claude Pro*\n\n${textAnswer}\n\n${BRAND}`, contextInfo: ctx }, { quoted: mek });
        } else {
            throw new Error('No image returned from API');
        }
    } else {
        if (typeof textAnswer!== 'string') textAnswer = textAnswer? JSON.stringify(textAnswer).slice(0,4000) : (resultUrl || "No response");
        if (!textAnswer) textAnswer = resultUrl || "Empty response";

        sessions[sender].history.push({ role: "user", content: prompt.slice(0,500) });
        sessions[sender].history.push({ role: "assistant", content: textAnswer.slice(0,500) });
        if (sessions[sender].history.length > 30) sessions[sender].history = sessions[sender].history.slice(-30);
        sessions[sender].time = Date.now();

        await conn.sendMessage(from, { text: `*🧠 Claude Pro*\n\n${textAnswer}\n\n_${BRAND}_\n_${CHANNEL_LINK}_`, contextInfo: ctx }, { quoted: mek });
    }

    try{ await conn.sendMessage(from, { react: { text: "✅", key: mek.key } }); }catch{}

  } catch (e) {
    console.error('Claude Pro Error:', e.response?.data || e.message);
    try{ await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); }catch{}
    const msg = e.response?.data? (typeof e.response.data === 'object'? JSON.stringify(e.response.data).slice(0,500) : Buffer.from(e.response.data).toString().slice(0,500)) : e.message;
    await reply(`*❌ Claude Pro Failed*\n${msg}\n\nTry: ${prefix}claude hello\n${BRAND}`);
  }
});

setInterval(()=>{
    const now = Date.now();
    for(const k in sessions){ if(now - sessions[k].time > 1800000) delete sessions[k]; } // 30min expiry
}, 600000);
