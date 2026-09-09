// ═══════════════════════════════════════════════════════════════════════════
//   🌸 POLLINATIONS.AI PROVIDER — MONA LISA
//
//   Genuinely free, open-source (github.com/pollinations/pollinations),
//   no API key, no signup, no rate-limit-defeating tricks required for
//   basic image generation. Verified against their own current docs
//   before wiring this up — same standard as every other provider here.
//
//   No env vars needed — this works out of the box.
// ═══════════════════════════════════════════════════════════════════════════

const axios = require('axios');

async function generate(prompt, opts = {}) {
    const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`;
    const res = await axios.get(url, {
        params: {
            width: opts.width || 1024,
            height: opts.height || 1024,
            nologo: true,
        },
        responseType: 'arraybuffer',
        timeout: 60000,
    });
    return Buffer.from(res.data);
}

module.exports = { generate, isConfigured: () => true };
