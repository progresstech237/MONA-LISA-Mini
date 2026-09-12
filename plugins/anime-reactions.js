// ═══════════════════════════════════════════════════════════
// 🎭 ANIME REACTIONS — MONA LISA x Progress Tech
// API: api.waifu.pics - SFW only - verified
// ═══════════════════════════════════════════════════════════

const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';

const REACTIONS = {
    hug: { desc: 'Send someone a warm hug', emoji: '🤗' },
    kiss: { desc: 'Send someone a kiss', emoji: '😘' },
    pat: { desc: 'Give someone a pat on the head', emoji: '🥰' },
    cuddle: { desc: 'Cuddle up with someone', emoji: '🤗' },
    cry: { desc: 'Show that you\'re crying', emoji: '😢' },
    dance: { desc: 'Bust out a dance', emoji: '💃' },
    poke: { desc: 'Poke someone', emoji: '👉' },
    bonk: { desc: 'Bonk someone', emoji: '🔨' },
    bite: { desc: 'Playfully bite someone', emoji: '😼' },
    blush: { desc: 'Show that you\'re blushing', emoji: '☺️' },
    smile: { desc: 'Flash a smile', emoji: '😊' },
    wave: { desc: 'Wave hello or goodbye', emoji: '👋' },
    highfive: { desc: 'Give someone a high five', emoji: '🙏' },
    handhold: { desc: 'Hold someone\'s hand', emoji: '🤝' },
    nom: { desc: 'Nom nom nom', emoji: '😋' },
    happy: { desc: 'Show that you\'re happy', emoji: '😄' },
    wink: { desc: 'Give a cheeky wink', emoji: '😉' },
    yeet: { desc: 'Yeet something', emoji: '💨' },
    kill: { desc: 'Dramatically kill (anime-style)', emoji: '💀' },
    smug: { desc: 'Show off a smug face', emoji: '😏' },
    neko: { desc: 'Get a cute neko image', emoji: '🐱' },
    waifu: { desc: 'Get a waifu image', emoji: '👧' },
    megumin: { desc: 'Get a Megumin image', emoji: '🧙‍♀️' },
    shinobu: { desc: 'Get a Shinobu image', emoji: '🦋' },
    awoo: { desc: 'Awoo!', emoji: '🐺' },
    cringe: { desc: 'Show that something is cringe', emoji: '😬' },
    bully: { desc: 'Playfully bully someone', emoji: '😈' },
    lick: { desc: 'Give a playful lick', emoji: '👅' },
    slap: { desc: 'Slap someone (anime-style)', emoji: '👋' },
    glomp: { desc: 'Glomp someone with a big hug', emoji: '🤗' },
};

function cleanQuery(raw, prefix, name){
    let q = (raw||"").trim();
    if(!q) return "";
    if(q.startsWith(prefix)){
        q = q.slice(prefix.length).trim();
        q = q.replace(new RegExp(`^${name}\\b\\s*`, 'i'), '').trim();
    }
    return q;
}

for (const [name, meta] of Object.entries(REACTIONS)) {
    cmd({
        pattern: name,
        alias: [], // add aliases here if you want: e.g. ["hugs"] for hug
        desc: `${meta.desc}`,
        category: 'fun',
        react: '🎭',
        filename: __filename,
    }, async (conn, mek, m, { from, q, reply, prefix }) => {
        const senderId = m?.sender || mek?.key?.participant || from;
        try {
            let targetText = cleanQuery(q || "", prefix, name);

            // Detect mentioned user for caption
            let mentionedJid = null;
            let displayName = targetText;
            try{
                const ctxInfo = mek.message?.extendedTextMessage?.contextInfo;
                if(ctxInfo?.mentionedJid && ctxInfo.mentionedJid.length > 0){
                    mentionedJid = ctxInfo.mentionedJid[0];
                    displayName = `@${mentionedJid.split('@')[0]}`;
                } else if(targetText){
                    const num = targetText.replace(/[^0-9]/g,'');
                    if(num.length >= 8) {
                        mentionedJid = `${num}@s.whatsapp.net`;
                        displayName = `@${num}`;
                    }
                }
            }catch{}

            try{ await conn.sendMessage(from, { react: { text: meta.emoji, key: mek.key } }); }catch{}

            const { data } = await axios.get(`https://api.waifu.pics/sfw/${name}`, {
                timeout: 15000,
                headers: { 'User-Agent': 'ProgressTech-Bot/1.0' }
            });

            if(!data?.url) throw new Error('API returned no url');

            const ctx = {
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: NEWSLETTER_JID,
                    serverMessageId: 1,
                    newsletterName: '🥷TECH TOY🧑‍💻™ ✓'
                }
            };

            let caption = `${meta.emoji} *${name.toUpperCase()}* ${meta.emoji}\n${meta.desc}`;
            if(displayName) caption += `\n\n${targetText? `From @${senderId.split('@')[0]} to ${displayName}` : ''}`;
            caption += `\n\n_${BRAND}_`;

            await conn.sendMessage(from, {
                image: { url: data.url },
                caption: caption,
                mentions: mentionedJid? [mentionedJid, senderId] : [senderId],
                contextInfo: ctx
            }, { quoted: mek });

            try{ await conn.sendMessage(from, { react: { text: "✅", key: mek.key } }); }catch{}

        } catch (e) {
            console.error(`${name.toUpperCase()} ERROR:`, e.response?.data || e.message);
            // Use your responses lib safely
            try{
                const { error } = require('../lib/responses');
                await reply(error('Could not fetch that reaction image right now — try again in a moment.'));
            }catch{
                await reply(`*❌ ${name} Failed*\n${e.message}\n\n_${BRAND}_`);
            }
            try{ await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); }catch{}
        }
    });
    }
