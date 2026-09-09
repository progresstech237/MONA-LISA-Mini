// ═══════════════════════════════════════════════════════════════════════════
//   🧠 AI PROVIDER ADAPTER — MONA LISA
//
//   Talks to any OpenAI-compatible chat completions endpoint (OpenAI,
//   Groq, OpenRouter, a self-hosted vLLM/Ollama gateway, etc). Nothing
//   here is enabled unless the admin sets real credentials in .env.
//
//   Required env vars:
//     AI_API_KEY       — API key for your chosen provider
//     AI_BASE_URL       — e.g. https://api.openai.com/v1  or
//                          https://api.groq.com/openai/v1  or
//                          http://localhost:11434/v1 (Ollama)
//     AI_MODEL           — e.g. gpt-4o-mini, llama-3.1-8b-instant, etc.
// ═══════════════════════════════════════════════════════════════════════════

const axios = require('axios');

function isConfigured() {
    return Boolean(process.env.AI_API_KEY && process.env.AI_BASE_URL && process.env.AI_MODEL);
}

function configHint() {
    return [
        'The AI chat provider isn\'t configured yet.',
        'Ask the bot administrator to set these in .env:',
        '  AI_API_KEY   — your provider\'s API key',
        '  AI_BASE_URL  — e.g. https://api.openai.com/v1',
        '  AI_MODEL     — e.g. gpt-4o-mini',
        'Any OpenAI-compatible endpoint works (OpenAI, Groq, OpenRouter, a local Ollama server, etc).',
    ].join('\n');
}

/**
 * Send a chat prompt and get a reply.
 * @param {string} prompt - the user's message
 * @param {Array<{role: string, content: string}>} history - prior turns (optional)
 * @returns {Promise<string>}
 */
async function chat(prompt, history = []) {
    if (!isConfigured()) {
        const err = new Error(configHint());
        err.notConfigured = true;
        throw err;
    }

    const messages = [
        { role: 'system', content: 'You are MONA LISA, an elegant, witty, and helpful WhatsApp assistant built by Progress Tech. Keep replies concise and friendly.' },
        ...history,
        { role: 'user', content: prompt },
    ];

    const res = await axios.post(
        `${process.env.AI_BASE_URL.replace(/\/$/, '')}/chat/completions`,
        { model: process.env.AI_MODEL, messages, temperature: 0.7 },
        {
            headers: {
                Authorization: `Bearer ${process.env.AI_API_KEY}`,
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        }
    );

    const reply = res.data?.choices?.[0]?.message?.content;
    if (!reply) throw new Error('The AI provider returned an empty response.');
    return reply.trim();
}

module.exports = { isConfigured, configHint, chat };
