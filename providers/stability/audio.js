// ═══════════════════════════════════════════════════════════════════════════
//   STABILITY AI — AUDIO (Stable Audio text-to-audio / audio-to-audio)
//
//   Confirmed, documented pattern for Stable Audio 2.x:
//     POST /v2beta/audio/{model}/text-to-audio   → { id }
//     POST /v2beta/audio/{model}/audio-to-audio  → { id }
//     GET  /v2beta/audio/results/{id}            → 202 while processing, 200 + audio bytes when done
//
//   {model} is configurable via STABILITY_AUDIO_MODEL (default
//   'stable-audio-2'). Stability released Stable Audio 3.0 very recently;
//   if Stability's current docs confirm the model slug for it (likely
//   'stable-audio-3', following their existing naming pattern — but
//   verify at platform.stability.ai/docs/api-reference before trusting
//   that), set STABILITY_AUDIO_MODEL=stable-audio-3 in .env. This code
//   doesn't hardcode that guess since it wasn't independently confirmed.
// ═══════════════════════════════════════════════════════════════════════════

const { requireConfigured, postAndPoll } = require('./client');

function model() {
    return process.env.STABILITY_AUDIO_MODEL || 'stable-audio-2';
}

async function textToAudio(prompt, opts = {}) {
    requireConfigured('Stable Audio (text-to-audio)');
    const m = model();
    return postAndPoll(
        `/v2beta/audio/${m}/text-to-audio`,
        '/v2beta/audio/results',
        {
            prompt,
            output_format: opts.outputFormat || 'mp3',
            duration: opts.duration || 60,
        },
        'audio/*'
    );
}

async function audioToAudio(audioBuffer, prompt, opts = {}) {
    requireConfigured('Stable Audio (audio-to-audio)');
    const m = model();
    return postAndPoll(
        `/v2beta/audio/${m}/audio-to-audio`,
        '/v2beta/audio/results',
        {
            audio: audioBuffer,
            prompt,
            strength: opts.strength ?? 0.5,
            output_format: opts.outputFormat || 'mp3',
        },
        'audio/*'
    );
}

module.exports = { textToAudio, audioToAudio, model };
