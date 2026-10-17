// ═══════════════════════════════════════════════════════════════════════════
//   🌸 POLLINATIONS PROVIDER — free text-to-image
//
//   Returns a raw image Buffer. Uses the OmegaTech Pollinations bridge first
//   and falls back to the public Pollinations endpoint if that bridge is down.
// ═══════════════════════════════════════════════════════════════════════════

const axios = require('axios');
const omega = require('../lib/omegatech');

async function generate(prompt) {
    try {
        return await omega.generateImageRaw(prompt);
    } catch (primaryError) {
        // Direct, keyless fallback.
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`;
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 150000 });
        const buf = Buffer.from(res.data || []);
        if (!buf.length) throw primaryError;
        return buf;
    }
}

module.exports = { generate };
