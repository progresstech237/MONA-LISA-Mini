// ═══════════════════════════════════════════════════════════════════════════
//   🌐 OMEGATECH AI SUITE — MONA LISA
//   Powered by Progress Tech · API by OmegaTech (@Omegatech-01)
//
//   • .aiimage  <prompt>          — text  -> image  (raw image on WhatsApp)
//   • .aimusic  <prompt>          — text  -> music  (MP3 on WhatsApp)
//   • .editimage <prompt> (reply)  — image + prompt -> edited PNG on WhatsApp
//   • .omega    <prompt>          — chat with the OmegaTech models
//   • .imagetoprompt (reply)       — describe a replied image
//   • .aimodels                    — list models / ratios
// ═══════════════════════════════════════════════════════════════════════════

const { cmd } = require('../redx');
const config = require('../config');
const omega = require('../lib/omegatech');

let downloadContentFromMessage;
try {
    ({ downloadContentFromMessage } = require('@whiskeysockets/baileys'));
} catch { /* baileys always present in this project */ }

let sharp = null;
try { sharp = require('sharp'); } catch { /* optional */ }

const NEWSLETTER_JID = config.CHANNEL_JID || '120363431455356251@newsletter';
const CHANNEL_LINK = config.CHANNEL_LINK || 'https://whatsapp.com/channel/0029Vb8rLzOCRs1j79bllH05';
const BRAND = '🔹 Powered by *Progress Tech* · OmegaTech AI';
const FOOTER = '> 🥰 *MONA LISA* 🤭 · Progress Tech';

// Newsletter attribution — attached only to the result/menu messages, never to
// the transient "loading" or reaction messages.
function channelCtx() {
    return {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: NEWSLETTER_JID,
            serverMessageId: 1,
            newsletterName: '🥰 MONA LISA V2 🤭',
        },
    };
}

// Pull an image buffer out of either a replied-to image or the triggering
// image message (image with a caption command).
async function getImageBuffer(mek, m) {
    if (m.quoted && m.quoted.mtype === 'imageMessage') {
        return m.quoted.download();
    }
    if (mek.message?.imageMessage && downloadContentFromMessage) {
        const stream = await downloadContentFromMessage(mek.message.imageMessage, 'image');
        let buffer = Buffer.alloc(0);
        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        return buffer;
    }
    return null;
}

// Parse "--model x" / "--ratio 16:9" flags out of a prompt, plus bare ratios.
function parseImageArgs(raw) {
    let prompt = String(raw || '').trim();
    let modelId;
    let ratio;

    const modelMatch = prompt.match(/--model(?:=| )([\w.-]+)/i);
    if (modelMatch) {
        const key = modelMatch[1].toLowerCase();
        modelId = omega.IMAGE_MODELS[key] || modelMatch[1];
        prompt = prompt.replace(modelMatch[0], ' ');
    }

    const ratioMatch = prompt.match(/--ratio(?:=| )(\d+:\d+)/i) || prompt.match(/\b(\d{1,2}:\d{1,2})\b/);
    if (ratioMatch && omega.IMAGE_RATIOS.includes(ratioMatch[1])) {
        ratio = ratioMatch[1];
        prompt = prompt.replace(ratioMatch[0], ' ');
    }

    return { prompt: prompt.replace(/\s+/g, ' ').trim(), modelId, ratio };
}

const AI_IMAGE_MENU = `┏━━〔 🌐 OmegaTech AI Suite 〕━━┓
┃ Powered by Progress Tech
┃
┃ *🖼️ Image generation*
┃ .aiimage a cyberpunk cat, neon lights
┃ .aiimage 16:9 futuristic city --model cinematic
┃
┃ *🎵 Music generation*
┃ .aimusic an upbeat summer pop song
┃
┃ *✏️ Image editing* (reply to a photo)
┃ .editimage add sunglasses and a red hat
┃
┃ *🧠 AI chat*
┃ .omega explain quantum physics simply
┃ .omega --model claude write a poem
┃
┃ *👁️ Image to prompt* (reply to a photo)
┃ .imagetoprompt
┃
┃ .aimodels — list models & ratios
┗━━━━━━━━━━━━━━┛\n\n${BRAND}`;

// ─────────────────────────────────────────────────────────────────────────
//  Image generation
// ─────────────────────────────────────────────────────────────────────────
cmd({
    pattern: 'aiimage',
    alias: ['artgen', 'imagegen', 'fluxai', 'omgimg'],
    desc: 'Generate an image from a text prompt (OmegaTech AI)',
    category: 'ai',
    react: '🎨',
    use: '.aiimage a cyberpunk cat | .aiimage 16:9 city --model cinematic',
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    if (!q) {
        return conn.sendMessage(from, { text: AI_IMAGE_MENU, contextInfo: channelCtx() }, { quoted: mek });
    }

    const { prompt, modelId, ratio } = parseImageArgs(q);
    if (!prompt) return reply(`⚠️ Give me a description.\nExample: ${prefix}aiimage a dragon over the ocean`);

    try {
        await conn.sendMessage(from, { react: { text: '🎨', key: mek.key } });
        const { buffer, provider, model, ratio: usedRatio } = await omega.generateImageBuffer(prompt, { modelId, ratio });

        const caption =
            `*🖼️ Image ready*\n` +
            `*Prompt:* ${prompt}\n` +
            `*Engine:* ${provider}${model ? ` (${model})` : ''} · *Ratio:* ${usedRatio || '1:1'}\n\n` +
            `${BRAND}\n${CHANNEL_LINK}`;

        await conn.sendMessage(from, {
            image: buffer,
            mimetype: 'image/jpeg',
            caption,
            contextInfo: channelCtx(),
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } }).catch(() => {});
        reply(`❌ *Image generation failed*\n${e.message}\n\nTry again or use a simpler prompt.`);
    }
});

// ─────────────────────────────────────────────────────────────────────────
//  Music generation
// ─────────────────────────────────────────────────────────────────────────
cmd({
    pattern: 'aimusic',
    alias: ['genmusic', 'tunegen', 'melodystudio'],
    desc: 'Generate music from a text prompt (OmegaTech AI)',
    category: 'ai',
    react: '🎵',
    use: '.aimusic an upbeat summer pop song',
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    if (!q) {
        return conn.sendMessage(from, {
            text: `🎵 *AI Music Generator*\n\n*Usage:* ${prefix}aimusic <description>\n\nExample:\n${prefix}aimusic an upbeat summer pop song about friendship\n\n_${BRAND}_`,
            contextInfo: channelCtx(),
        }, { quoted: mek });
    }

    try {
        await reply(`🎵 *Generating your song...*\n*Prompt:* ${q}\n\n_This can take up to 2 minutes — hang tight._\n\n_${BRAND}_`);
        await conn.sendMessage(from, { react: { text: '🎧', key: mek.key } });

        const result = await omega.generateMusic(q);

        if (result.url) {
            const { buffer } = await omega.download(result.url);
            await conn.sendMessage(from, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                ptt: false,
                fileName: `mona-lisa-${Date.now()}.mp3`,
                caption: `*🎵 Your song is ready*\n*Prompt:* ${q}\n\n${BRAND}\n${CHANNEL_LINK}`,
                contextInfo: channelCtx(),
            }, { quoted: mek });
        } else if (result.lyrics) {
            await conn.sendMessage(from, {
                text: `*🎼 Lyrics generated*\n*Prompt:* ${q}\n\n${result.lyrics}\n\n_The audio backend is busy right now, so here are the lyrics instead._\n\n${FOOTER}`,
                contextInfo: channelCtx(),
            }, { quoted: mek });
        } else {
            throw new Error('No audio was returned.');
        }

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } }).catch(() => {});
        reply(`❌ *Music generation failed*\n${e.message}\n\nPlease try again in a moment.`);
    }
});

// ─────────────────────────────────────────────────────────────────────────
//  Image editing  (reply to an image, or caption an image)
// ─────────────────────────────────────────────────────────────────────────
cmd({
    pattern: 'editimage',
    alias: ['aiimageedit', 'picedit', 'fluxedit'],
    desc: 'Edit a replied-to image with AI and get a PNG back (OmegaTech AI)',
    category: 'ai',
    react: '✏️',
    use: 'Reply to an image with .editimage add sunglasses',
    filename: __filename,
}, async (conn, mek, m, { from, q, reply, prefix }) => {
    const instruction = String(q || '').trim();
    const hasImage = (m.quoted && m.quoted.mtype === 'imageMessage') || !!mek.message?.imageMessage;

    if (!hasImage) {
        return reply(`✏️ *Usage:* Reply to an image (or send one with the caption) and tell me what to change.\n\nExample:\n${prefix}editimage add sunglasses and a red hat\n${prefix}editimage turn it into a watercolor painting`);
    }
    if (!instruction) {
        return reply('✏️ Tell me what to change, e.g. `.editimage add a red hat`.');
    }

    try {
        await reply(`✏️ *Editing your image...*\n*Instruction:* ${instruction}\n\n_${BRAND}_`);
        await conn.sendMessage(from, { react: { text: '✏️', key: mek.key } });

        const input = await getImageBuffer(mek, m);
        if (!input || !input.length) throw new Error('Could not read the image you sent.');

        const publicUrl = await omega.uploadBuffer(input, 'mona-lisa-input.jpg', 'image/jpeg');
        const { url, provider } = await omega.editImage(publicUrl, instruction);
        const { buffer } = await omega.download(url);

        // Deliver a real PNG as requested.
        let outBuffer = buffer;
        if (sharp) {
            try { outBuffer = await sharp(buffer).png().toBuffer(); } catch { /* keep original */ }
        }

        await conn.sendMessage(from, {
            image: outBuffer,
            mimetype: 'image/png',
            fileName: `mona-lisa-edit-${Date.now()}.png`,
            caption: `*✏️ Edit complete*\n*Instruction:* ${instruction}\n*Engine:* ${provider}\n\n${BRAND}\n${CHANNEL_LINK}`,
            contextInfo: channelCtx(),
        }, { quoted: mek });

        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } }).catch(() => {});
        reply(`❌ *Image editing failed*\n${e.message}\n\nTry a clearer photo or a simpler instruction.`);
    }
});

// ─────────────────────────────────────────────────────────────────────────
//  Chat
// ─────────────────────────────────────────────────────────────────────────
cmd({
    pattern: 'omega',
    alias: ['omegai', 'omni'],
    desc: 'Chat with the OmegaTech AI models',
    category: 'ai',
    react: '🧠',
    use: '.omega explain black holes | .omega --model claude write a poem',
    filename: __filename,
}, async (conn, mek, m, { from, q, reply }) => {
    if (!q) {
        const models = Object.entries(omega.CHAT_MODELS)
            .map(([k, v]) => `┃ ${k} — ${v.label}`)
            .join('\n');
        return conn.sendMessage(from, {
            text: `🧠 *OmegaTech AI Chat*\n\n*Usage:* .omega <your question>\n*Pick a model:* .omega --model <name> <question>\n\n*Available models:*\n${models}\n\n_${BRAND}_`,
            contextInfo: channelCtx(),
        }, { quoted: mek });
    }

    // Parse --model / -m flag (model key or raw model name).
    let text = q;
    let provider = 'deepai';
    let model;

    const flag = text.match(/--model(?:=| )(\S+)/i) || text.match(/-m(?:=| )(\S+)/i);
    if (flag) {
        const key = flag[1].toLowerCase();
        if (omega.CHAT_MODELS[key]) {
            provider = omega.CHAT_MODELS[key].provider;
            model = omega.CHAT_MODELS[key].model;
        } else {
            model = flag[1];
        }
        text = text.replace(flag[0], ' ').trim();
    }

    if (!text) return reply('🧠 Ask me something, e.g. `.omega what is photosynthesis?`');

    try {
        await conn.sendMessage(from, { react: { text: '💭', key: mek.key } });
        const { text: answer } = await omega.chatWith(provider, text, model);
        await conn.sendMessage(from, {
            text: `🧠 *OmegaTech AI*\n\n${answer}\n\n${FOOTER}`,
            contextInfo: channelCtx(),
        }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } }).catch(() => {});
        reply(`❌ *AI chat failed*\n${e.message}`);
    }
});

// ─────────────────────────────────────────────────────────────────────────
//  Image -> prompt
// ─────────────────────────────────────────────────────────────────────────
cmd({
    pattern: 'imagetoprompt',
    alias: ['img2prompt', 'describeimage'],
    desc: 'Describe a replied-to image (OmegaTech vision)',
    category: 'ai',
    react: '👁️',
    use: 'Reply to an image with .imagetoprompt',
    filename: __filename,
}, async (conn, mek, m, { from, reply }) => {
    const hasImage = (m.quoted && m.quoted.mtype === 'imageMessage') || !!mek.message?.imageMessage;
    if (!hasImage) return reply('👁️ Reply to an image with `.imagetoprompt` and I will describe it.');

    try {
        await conn.sendMessage(from, { react: { text: '👁️', key: mek.key } });
        const input = await getImageBuffer(mek, m);
        if (!input || !input.length) throw new Error('Could not read the image.');
        const publicUrl = await omega.uploadBuffer(input, 'mona-lisa-vision.jpg', 'image/jpeg');
        const description = await omega.imageToPrompt(publicUrl);
        await conn.sendMessage(from, {
            text: `👁️ *Image description / prompt*\n\n${description}\n\n${FOOTER}`,
            contextInfo: channelCtx(),
        }, { quoted: mek });
        await conn.sendMessage(from, { react: { text: '✅', key: mek.key } });
    } catch (e) {
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } }).catch(() => {});
        reply(`❌ *Image analysis failed*\n${e.message}`);
    }
});

// ─────────────────────────────────────────────────────────────────────────
//  Model list / menu
// ─────────────────────────────────────────────────────────────────────────
cmd({
    pattern: 'aimodels',
    alias: ['aihelp', 'aimenu'],
    desc: 'List OmegaTech AI models, ratios and commands',
    category: 'ai',
    react: '📋',
    filename: __filename,
}, async (conn, mek, m, { from }) => {
    const chats = Object.entries(omega.CHAT_MODELS).map(([k, v]) => `┃ ${k} — ${v.label}`).join('\n');
    const imgs = Object.entries(omega.IMAGE_MODELS).map(([k, v]) => `┃ ${k} — ${v}`).join('\n');

    const text = `${AI_IMAGE_MENU}\n\n*💬 Chat models:*\n${chats}\n\n*🎨 Image models (--model <key>):*\n${imgs}\n\n*📐 Ratios:* ${omega.IMAGE_RATIOS.join(', ')}\n\n${FOOTER}`;
    await conn.sendMessage(from, { text, contextInfo: channelCtx() }, { quoted: mek });
});
