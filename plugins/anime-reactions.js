// ═══════════════════════════════════════════════════════════════════════════
//   🎭 ANIME REACTIONS — MONA LISA
//   Powered by Progress Tech
//   Every image comes from api.waifu.pics — a real, free, documented,
//   SFW-only public API (verified categories only, nothing guessed).
// ═══════════════════════════════════════════════════════════════════════════

const { cmd } = require('../redx');
const axios = require('axios');
const { error } = require('../lib/responses');

// Confirmed SFW categories on api.waifu.pics as of writing. Mapped to the
// friendliest command name per category — some categories power a couple
// of aliases where that makes sense (e.g. "kick" doubles as a mild "attack").
const REACTIONS = {
    hug: { desc: 'Send someone a warm hug' },
    kiss: { desc: 'Send someone a kiss' },
    pat: { desc: 'Give someone a pat on the head' },
    cuddle: { desc: 'Cuddle up with someone' },
    cry: { desc: 'Show that you\'re crying' },
    dance: { desc: 'Bust out a dance' },
    poke: { desc: 'Poke someone' },
    bonk: { desc: 'Bonk someone' },
    bite: { desc: 'Playfully bite someone' },
    blush: { desc: 'Show that you\'re blushing' },
    smile: { desc: 'Flash a smile' },
    wave: { desc: 'Wave hello or goodbye' },
    highfive: { desc: 'Give someone a high five' },
    handhold: { desc: 'Hold someone\'s hand' },
    nom: { desc: 'Nom nom nom' },
    happy: { desc: 'Show that you\'re happy' },
    wink: { desc: 'Give a cheeky wink' },
    yeet: { desc: 'Yeet something (or someone)' },
    kill: { desc: 'Dramatically "kill" someone (anime-style, just for fun)' },
    smug: { desc: 'Show off a smug face' },
    neko: { desc: 'Get a cute neko image' },
    waifu: { desc: 'Get a waifu image' },
    megumin: { desc: 'Get a Megumin image' },
    shinobu: { desc: 'Get a Shinobu image' },
    awoo: { desc: 'Awoo!' },
    cringe: { desc: 'Show that something is cringe' },
    bully: { desc: 'Playfully bully someone' },
    lick: { desc: 'Give a playful lick' },
    slap: { desc: 'Slap someone (anime-style, just for fun)' },
    glomp: { desc: 'Glomp someone with a big tackle-hug' },
};

for (const [name, { desc }] of Object.entries(REACTIONS)) {
    cmd({
        pattern: name,
        desc: `${desc} (sends an anime reaction image)`,
        category: 'fun',
        react: '🎭',
        filename: __filename,
    }, async (conn, mek, m, { reply, q }) => {
        try {
            const { data } = await axios.get(`https://api.waifu.pics/sfw/${name}`, { timeout: 15000 });
            const target = q ? ` @${q.replace(/[^0-9]/g, '')}` : '';
            await conn.sendMessage(m.chat, {
                image: { url: data.url },
                caption: q ? `${desc}${target ? ' → ' + q : ''}` : desc,
            }, { quoted: mek });
        } catch (e) {
            reply(error('Could not fetch that reaction image right now — try again in a moment.'));
        }
    });
}
