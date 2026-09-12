// ═══════════════════════════════════════════════════════════════════════════
//   🎧 AUDIO EFFECTS — MONA LISA - FIXED
//   Powered by Progress Tech • 🥷TECH TOY🧑‍💻™
// ═══════════════════════════════════════════════════════════════════════════

const { cmd } = require('../redx');
const { applyEffect } = require('../lib/audio-effects');
const { success, error, loading } = require('../lib/responses');

const EFFECTS = [
    ['bass', 'bass', '🔊', []],
    ['nightcore', 'nightcore', '🌙', ['nc']],
    ['slow', 'slow', '🐢', []],
    ['fast', 'fast', '🐇', []],
    ['reverse', 'reverse', '⏪', []],
    ['deep', 'deep', '🕳️', []],
    ['smooth', 'smooth', '🎚️', []],
    ['squirrel', 'squirrel', '🐿️', ['chipmunk']],
    ['8d', 'eightd', '🎧', ['8d-audio']],
    ['blown', 'blown', '💥', []],
];

for (const [pattern, effectKey, emoji, alias] of EFFECTS) {
    cmd({
        pattern,
        alias,
        desc: `Apply ${pattern} effect to replied audio/vn`,
        category: 'audio',
        react: emoji,
        filename: __filename,
    }, async (conn, mek, m, { from, reply }) => {
        try {
            const quoted = m.quoted || mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const isAudio = quoted && (
                quoted.mtype === 'audioMessage' || 
                quoted.message?.audioMessage ||
                m.quoted?.message?.audioMessage
            );

            if (!m.quoted || !isAudio) {
                return await reply(`${emoji} *Reply to an audio / voice note with .${pattern}*\nExample: reply to a vn and type .bass`);
            }

            try { await conn.sendMessage(from, { react: { text: emoji, key: mek.key } }); } catch {}

            await reply(loading(`Applying ${pattern} effect...`));

            // FIXED: works with both redx versions
            let inputBuffer;
            if (typeof m.quoted.download === 'function') {
                inputBuffer = await m.quoted.download();
            } else {
                const { downloadMediaMessage } = require('@whiskeysockets/baileys');
                const msgToDl = {
                    message: m.quoted.message || quoted.message || quoted,
                    key: m.quoted.key || mek.message?.extendedTextMessage?.contextInfo?.stanzaId ? { id: mek.message.extendedTextMessage.contextInfo.stanzaId } : undefined
                };
                inputBuffer = await downloadMediaMessage(msgToDl, 'buffer', {}, { logger: console, reuploadRequest: conn.updateMediaMessage });
            }

            if (!inputBuffer) throw new Error("Failed to download audio");

            const output = await applyEffect(inputBuffer, effectKey);
            if (!output) throw new Error("Effect engine returned empty");

            await conn.sendMessage(from, {
                audio: output,
                mimetype: 'audio/mpeg',
                ptt: m.quoted.message?.audioMessage?.ptt || quoted?.message?.audioMessage?.ptt || false,
            }, { quoted: mek });

            try { await conn.sendMessage(from, { react: { text: "✅", key: mek.key } }); } catch {}

        } catch (e) {
            console.error(`${pattern} Effect Error:`, e);
            try { await conn.sendMessage(from, { react: { text: "❌", key: mek.key } }); } catch {}
            await reply(error(`Couldn't apply ${pattern}: ${e.message}`));
        }
    });
        }
