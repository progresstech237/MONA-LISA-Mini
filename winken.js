const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/tools/wink-Video-enhancer';

function getThumb() { try { for (const p of ['./media/menu1.png','./media/menu2.png']) if (fs.existsSync(p)) return fs.readFileSync(p); } catch {} return null; }

cmd({
  pattern: "winken",
  alias: ["wink", "enhancevideo", "unblur", "videoenhance", "enhance", "winkvideo"],
  react: "✨",
  desc: "Enhance & unblur videos 2k/4k - polling + progress bar if job ID returned",
  category: "progresstech tools",
  use: ".winken reply to video",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let rawQ = (q || "").trim();
    const ctx = { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' } };

    const quoted = mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const hasVideoQuoted =!!(quoted?.videoMessage || quoted?.documentMessage);
    const isVideoMsg =!!(mek.message?.videoMessage || mek.message?.documentMessage);

    if (!rawQ &&!hasVideoQuoted &&!isVideoMsg) {
        let thumb = null; try { const { prepareWAMessageMedia } = require('@whiskeysockets/baileys'); const tb = getThumb(); if (tb) { const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer }); thumb = media.imageMessage; } } catch {}
        const menu = `┏━━〔 ✨ Wink Enhancer V2 〕━━┓
┃ Enhance & Unblur 2k/4k
┃ With job polling + progress
┃
┃ *How:*
┃ Reply to video: ${prefix}winken
┃ ${prefix}winken 2k
┃ ${prefix}winken 4k
┗━━━━━━━━━━━━━━┛
`;
        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✨ 2k Enhance", id: `${prefix}winken 2k` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "✨ 4k Enhance", id: `${prefix}winken 4k` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: CHANNEL_LINK }) }
        ];
        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "✨ Wink Enhancer • Polling", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu }, footer: { text: BRAND }, nativeFlowMessage: { buttons }
            }, contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "✨", key: mek.key } });

    let quality = "2k";
    if (rawQ.toLowerCase().includes('4k')) quality = "4k";

    let videoPath = "";
    try {
        const { downloadMediaMessage } = require('@whiskeysockets/baileys');
        let targetMsg = mek;
        if (hasVideoQuoted) {
            const type = quoted.videoMessage? 'videoMessage' : 'documentMessage';
            targetMsg = { message: { [type]: quoted[type] } };
        }
        const buffer = await downloadMediaMessage(targetMsg, 'buffer', {}, { logger: console, reuploadRequest: conn.updateMediaMessage });
        if (!buffer) throw new Error('Download failed');
        const tmpDir = './tmp';
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
        videoPath = path.join(tmpDir, `wink_in_${Date.now()}.mp4`);
        fs.writeFileSync(videoPath, buffer);
    } catch (dlErr) {
        return reply(`*❌ Download failed*\n${dlErr.message}\nReply to a video with ${prefix}winken`);
    }

    const sizeMB = (fs.statSync(videoPath).size / 1024 / 1024).toFixed(2);
    let statusMsg = await conn.sendMessage(from, { text: `*✨ Wink Enhancing to ${quality.toUpperCase()}...*\n📁 ${sizeMB} MB\n⏳ Uploading via multipart...\n\n[░░░░░░░░░░] 0%\n\n_${BRAND}_`, contextInfo: ctx }, { quoted: mek });

    await conn.sendPresenceUpdate('composing', from);

    let enhancedUrl = null;
    let jobId = null;
    let resultData = null;

    try {
        const form = new FormData();
        form.append('video', fs.createReadStream(videoPath), { filename: `video_${Date.now()}.mp4`, contentType: 'video/mp4' });
        form.append('file', fs.createReadStream(videoPath), { filename: `video_${Date.now()}.mp4`, contentType: 'video/mp4' });
        form.append('quality', quality);
        form.append('resolution', quality);

        const { data } = await axios.post(API, form, {
            timeout: 300000,
            headers: {...form.getHeaders() },
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        resultData = data.data || data;
        enhancedUrl = resultData.url || resultData.video_url || resultData.enhanced_url || resultData.result || resultData.link || resultData.download_url || data.url;
        jobId = resultData.job_id || resultData.jobId || resultData.task_id || resultData.taskId || resultData.id || null;

        if (!enhancedUrl && typeof resultData === 'string' && resultData.startsWith('http')) enhancedUrl = resultData;
        
        // Polling logic if job_id returned
        if (jobId &&!enhancedUrl) {
            let attempts = 0;
            const maxAttempts = 60; // 5 mins
            while (attempts < maxAttempts &&!enhancedUrl) {
                attempts++;
                const pct = Math.min(10 + attempts * 1.5, 95);
                const barFilled = Math.floor(pct / 10);
                const bar = '█'.repeat(barFilled) + '░'.repeat(10 - barFilled);
                
                try {
                    await conn.sendMessage(from, {
                        text: `*✨ Wink Enhancing to ${quality.toUpperCase()}...*\n📁 ${sizeMB} MB\n🆔 Job: ${jobId}\n⏳ Processing on Unwatermark.ai...\n\n[${bar}] ${pct.toFixed(0)}%\nAttempt ${attempts}/${maxAttempts}\n\n_${BRAND}_`,
                        edit: statusMsg.key
                    });
                } catch {}

                await new Promise(r=>setTimeout(r, 5000));

                try {
                    // Try status check endpoints
                    const checkUrls = [
                        `${API}?job_id=${jobId}&task_id=${jobId}`,
                        `${API}?id=${jobId}`,
                        `https://api.omegatech.app/api/tools/wink-Video-enhancer/status?job_id=${jobId}`,
                        `https://api.omegatech.app/api/tools/wink-status?job_id=${jobId}`
                    ];
                    for (const checkUrl of checkUrls) {
                        try {
                            const { data: statusData } = await axios.get(checkUrl, { timeout: 15000 });
                            const sd = statusData.data || statusData;
                            const maybeUrl = sd.url || sd.video_url || sd.enhanced_url || sd.result || sd.link || sd.download_url;
                            if (maybeUrl) { enhancedUrl = maybeUrl; resultData = sd; break; }
                            if (sd.status === 'completed' || sd.status === 'done') {
                                enhancedUrl = sd.url || sd.result || maybeUrl;
                                if (enhancedUrl) break;
                            }
                        } catch {}
                    }
                    // Also try POST status
                    if (!enhancedUrl) {
                        try {
                            const { data: pd } = await axios.post(API, { job_id: jobId, task_id: jobId, action: 'status' }, { timeout: 15000, headers: { 'Content-Type': 'application/json' } });
                            const ssd = pd.data || pd;
                            const maybeUrl = ssd.url || ssd.video_url || ssd.enhanced_url;
                            if (maybeUrl) enhancedUrl = maybeUrl;
                        } catch {}
                    }
                } catch {}
            }
        }

    } catch (e) {
        console.error('Wink API error', e.response?.data || e.message);
        throw new Error(`Enhance failed: ${e.response?.data?.message || e.message}`);
    } finally {
        try { if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath); } catch {}
    }

    if (!enhancedUrl) throw new Error(`No URL after polling. Last: ${JSON.stringify(resultData).slice(0,1000)}`);

    try {
        await conn.sendMessage(from, { text: `*✨ [██████████] 100% - Done!*\n*Quality:* ${quality.toUpperCase()}\n📥 Downloading enhanced video...\n\n_${BRAND}_`, edit: statusMsg.key });
    } catch {}

    await conn.sendMessage(from, {
        video: { url: enhancedUrl },
        caption: `*✅ Video Enhanced to ${quality.toUpperCase()}*\nVia: Unwatermark.ai + Wink\nJob: ${jobId || 'direct'}\n\n*${BRAND}*`,
        contextInfo: ctx
    }, { quoted: mek });

    try {
        await conn.sendMessage(from, {
            document: { url: enhancedUrl },
            mimetype: 'video/mp4',
            fileName: `Enhanced_${quality}_${Date.now()}.mp4`,
            caption: `*💾 ${quality.toUpperCase()} Document (best quality)*\n${BRAND}`,
            contextInfo: ctx
        }, { quoted: mek });
    } catch {}

    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Wink V2 Error:', e.response?.data || e.message);
    reply(`*❌ Wink Enhance Failed*\n${e.message}`);
  }
});