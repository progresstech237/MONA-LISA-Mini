// ═══════════════════════════════════════════════════════════════════════════
//   🧠 AI PROVIDER — backed by the OmegaTech chat API
//
//   The ai-studio plugin talks to this module. OmegaTech needs no API key, so
//   the provider is always configured — isConfigured() just keeps the
//   plugin's contract intact and lets it show a useful hint if we ever add
//   keyed providers again.
//
//   Environment:
//     OMEGA_CHAT_MODEL — optional default model id (e.g. deepseek-v3.2)
// ═══════════════════════════════════════════════════════════════════════════

const omega = require('../lib/omegatech');

module.exports = {
    name: 'OmegaTech AI',

    isConfigured() {
        return true;
    },

    configHint() {
        return 'The OmegaTech AI service is unreachable right now. Please try again shortly.';
    },

    async chat(prompt) {
        return omega.chat(prompt, process.env.OMEGA_CHAT_MODEL || undefined);
    },
};
