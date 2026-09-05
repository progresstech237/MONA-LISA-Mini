# 🥰 MONA LISA 🤭 — Mini Bot

*Elegant. Legendary. Playful. Powered by Progress Tech.*

A WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys), with pairing-code login, a full plugin/command system, and a pluggable AI/Image/Video/Music provider architecture.

---

## ⚠️ Before you deploy — read this

This project was rebuilt from a template that shipped with three things that have been **removed entirely**, not fixed or hidden:

1. **`lib/system.js`** contained a 169KB obfuscated blob with anti-debugging code, wired directly into the live authenticated WhatsApp connection. It has been replaced with a small, transparent, readable file that does only what the bot actually needs (channel follow / auto-react / status handling).
2. **A `.pair` / `.pair2` chat command** forwarded any phone number typed by any user to an unrelated third-party server, which would generate a real WhatsApp linking code for that number — a credential-harvesting pattern disguised as a "clone the bot" feature. It has been deleted.
3. **NSFW/"leak" content plugins** (`nsfw-girls.js`, `leakvideos.js`, `dl-xdown.js`) pulled explicit content, including "leak" material, from third-party APIs on command. They have been deleted and will not be re-added.

If you obtained this template from somewhere else and plan to merge changes back in from that source, **do not** reintroduce those files.

**License note:** this project is derived from a template originally released under the MIT License by "ArslanMD Official" (see `LICENSE`). MIT requires the original copyright notice to be preserved in copies/substantial portions of the software, so `LICENSE` has been left intact. You may want to review this with your own judgment before public redistribution under your own name.

**A general note on this class of bot:** this bot connects to WhatsApp using Baileys, an unofficial, reverse-engineered library — not WhatsApp's official Business API. That's extremely common in this ecosystem, but it does mean this kind of use isn't officially sanctioned by WhatsApp's Terms of Service, and numbers used this way can in principle be flagged or banned by WhatsApp. That risk exists independent of anything above.

---

## ✨ What's included

- **Pairing-code login** via a redesigned web UI (`pair.html`)
- **Plugin-based command system** (`plugins/*.js`), auto-loaded at startup
- **Channel follow / auto-react / status automation** (clean `lib/system.js`)
- **Anti-link, anti-bad-words, anti-call, anti-delete** (two of these — anti-link and anti-bad-words — were completely broken before this rebuild; see "Bugs fixed" below)
- **AI / Image / Video / Music provider architecture** (`providers/`) — real adapters, gated behind your own API keys, that clearly explain what's missing rather than faking success
- **MONA LISA personality system** (`lib/responses.js`) — reusable success/error/loading/warning message pools any plugin can use
- **Redesigned command menu** (`.menu`) grouped into elegant categories
- **New Fun & Entertainment commands** with local content pools (jokes, facts, quotes, trivia, would-you-rather, compliments, riddles, coinflip, dice, 8-ball)
- Centralized config in `config.js`, fully MONA LISA-branded

---

## 🐛 Bugs fixed

| Bug | Impact | Fix |
|---|---|---|
| `lib/system.js` was a 169KB obfuscated file with anti-debugging code | Security risk — full access to the live WA session | Rewritten clean and transparent |
| `.pair` / `.pair2` forwarded arbitrary numbers to a third-party server | Credential/session harvesting | Removed |
| `plugins/anti-bad.js` imported `{ arslan }` from `redx.js`, which doesn't export that name | **Anti-bad-words silently never worked** — the whole plugin failed to load | Fixed import to `{ cmd }` |
| `plugins/antilink.js` had the same broken import | **Anti-link silently never worked** | Fixed import to `{ cmd }` |
| `m.quoted` only ever contained `{ message, stanzaId, participant }` | `.vv`, `.groupstatus`, `.tag`/kick-by-reply in group settings, `.ig` link-by-reply, and `.unblock`-by-reply all called `.download()`, `.text`, `.sender`, or `.imageMessage` on it and would throw | Rebuilt `m.quoted` in `lib/msg.js` with a real `.download()`, `.text`, `.sender`, `.mtype`, and flattened media-type shortcuts, with view-once unwrapping |
| Two hardcoded numbers in `plugins/gc-setting.js`'s mention-everyone ignore list | Old owner's number was hardcoded into a mention-exclusion list | Now built from `config.OWNER_NUMBER` + the bot's own number |
| Duplicate `CHANNEL_JID` key in `config.js` | Harmless but confusing | De-duplicated |
| `crypto`, `path`, `child_process` listed as npm dependencies | These are Node.js built-ins; installing packages with those names is dead weight and an unnecessary supply-chain surface | Removed from `package.json` |
| Old developer branding (name, numbers, footers, comments) scattered across ~10 files | Wrong branding shown to users | Replaced throughout with MONA LISA / Progress Tech |
| A number was marked "connected" the instant a socket object was created — before pairing even succeeded | If `requestPairingCode()` failed (rate limits, network blips) or a pairing code simply expired unused, that number was **permanently locked out of ever re-pairing** until the whole server restarted | Connection tracking now verifies the socket is genuinely open + logged in before treating a number as connected; every failure path (pairing request failure, expired code, exhausted reconnect attempts) now cleans up immediately instead of leaving a zombie entry |
| The pairing page had no way to recover from a stuck "Already Connected" state | Users had no self-serve way to force a fresh link | Added a "Force a fresh link" button, wired to an existing-but-unexposed `/force-code` route that fully clears the old session and issues a new code |
| `DisconnectReason.restartRequired` (the normal, expected disconnect WhatsApp sends right after a pairing code is accepted) wasn't handled specially | Every pairing attempt hit this, fell into the generic "wait 10s, then retry" reconnect path instead of reconnecting immediately — the phone's "Logging in..." screen would hang, often indefinitely | Added a fast, uncounted reconnect path specifically for this disconnect reason, so registration completes right after the code is accepted instead of stalling |
| That fast reconnect raced against the async MongoDB session save — landing before the save finished made the code conclude "no session exists" and delete the local session it had just created seconds earlier, wiping the exact credentials WhatsApp was mid-registration with | The phone would be stuck on "Logging in..." forever, because the server silently restarted the pairing process from scratch behind the scenes instead of resuming | A local session touched in the last 2 minutes is now treated as fresh and kept regardless of MongoDB's state, plus a small 500ms pause before the reconnect gives the local write time to finish flushing to disk |
| MongoDB connection had no retry on initial failure and no disconnect/reconnect logging | A single transient hiccup at boot silently disabled session persistence for the whole process lifetime, with no trace in the logs | Added retry-with-backoff on the initial connection attempt, plus `error`/`disconnected`/`reconnected` event logging |

**Dependencies to be aware of:** `denethdev-ytmp3` and `ruhend-scraper` (used by the download plugins) and the `arslan-apis-v2.vercel.app` endpoint (used by `song.js`, `video.js`) are unofficial third-party packages/services that ship with this template. They weren't part of this security review's scope beyond a surface check — if you rely on the download features, it's worth spot-checking them yourself before heavy production use.

---

## 📁 Project structure

```
.
├── main.js              # connection handling, message routing, HTTP routes
├── index.js              # process entrypoint
├── redx.js               # command registration (cmd/AddCommand/Function)
├── config.js              # centralized configuration (env-driven)
├── pair.html              # pairing web UI
├── plugins/               # all commands, auto-loaded
├── providers/              # AI / Image / Video / Music adapters
│   ├── ai/       (chat, translate, summarize, code help — any OpenAI-compatible endpoint)
│   ├── stability/ (image generate/upscale/edit/control, 3D, audio — real Stability AI v2beta API)
│   └── video/      (text-to-video / image-to-video via Replicate — Stability's own video API is deprecated)
├── lib/                    # shared helpers (message parsing, responses, anti-call, ...)
├── data/                   # presence/runtime helpers
├── .env.example
└── app.json                # one-click Heroku-style deploy config
```

---

## 🔧 Required environment variables

See `.env.example` for the full, commented list. At minimum:

```
OWNER_NUMBER=237682432296
PREFIX=.
```

Everything else has a sensible default. AI/Image/Video/Music features stay disabled — and say so clearly when used — until you add their specific keys (also documented in `.env.example`).

---

## ▶️ Running locally

```bash
git clone https://github.com/progresstech237/MONA-LISA-Mini
cd MONA-LISA-Mini
npm install
cp .env.example .env
# edit .env with your OWNER_NUMBER at minimum
npm start
```

Then open `http://localhost:3000` in a browser, enter your WhatsApp number, and follow the on-screen pairing steps.

---

## 🚀 Deployment

This bot needs a **long-running Node.js process** — it holds an always-on WebSocket connection to WhatsApp. It is **not** compatible with purely serverless/edge platforms that spin functions down between requests (e.g. Vercel serverless functions, Cloudflare Workers).

Works on:
- A VPS (DigitalOcean, Hetzner, etc.) running Node 20.x behind `pm2` or `systemd`
- Any container host that supports persistent processes (Railway, Render, Fly.io, a Docker host you control)
- Heroku-style platforms with a paid always-on dyno (`app.json` is included for this)

For session persistence across restarts, set `MONGODB_URI` — otherwise the bot will need to re-pair every time the process restarts.

---

## 🧠🎨🎬🎵 Configuring AI / Image / Video / Music

- **AI chat / translate / summarize / code** (`.ai .translate .summarize .code`) — any OpenAI-compatible endpoint, via `providers/ai/`.
- **Image generation, upscaling, editing, control, and 3D** — real Stability AI v2beta endpoints, via `providers/stability/`. One key (`STABILITY_API_KEY`) unlocks all of:
  - Generate: `.imagine` (Stable Image Ultra), `.core` (Stable Image Core), `.sd35` (SD 3.5 Large/Large Turbo/Medium/Flash)
  - Upscale: `.upscale` (fast 4x), `.upscalehd` (conservative, up to 4MP), `.upscalecreative` (AI reimagining)
  - Edit (reply to an image): `.removebg`, `.outpaint`, `.searchreplace`, `.recolor`, `.relight`
  - Control (reply to an image): `.sketch2img`, `.structure2img`, `.styleguide`
  - 3D (reply to an image): `.to3d`, `.to3dhq` — returns a `.glb` file
  - Audio: `.genmusic` (text-to-audio), `.audio2audio` (reply to audio to restyle it)
- **Text-to-video** (`.genvideo`) and **image-to-video** (`.img2video`) — via `providers/video/`, on Replicate. Default models in `.env.example`: `wan-video/wan-2.2-t2v-fast` (`REPLICATE_T2V_MODEL`) and `wan-video/wan-2.2-i2v-fast` (`REPLICATE_I2V_MODEL`) — fast, cheap, and their exact input field names (`prompt`, and `image`+`prompt`) were confirmed against Replicate's own blog post announcing them, not guessed. They're separate models/env vars because Wan's text-only and image+text variants are genuinely different endpoints, not one model that just ignores `image` when absent. This is *not* Stability — Stability deprecated their own Stable Video Diffusion API in July 2025, per their own release notes, so there's no current Stability video endpoint to wire up.
- **Talking avatar** (`.talkingavatar` / `.speak`) — reply to a portrait photo with the exact words you want spoken, get back an MP4 of that person saying them, lips synced to real generated speech. This is a genuinely different capability from `.genvideo`/`.img2video` — neither text-to-video nor image-to-video above reliably produces accurate spoken dialogue, only general motion. Configured via `REPLICATE_AVATAR_MODEL` (defaults to `prunaai/p-video-avatar` in `.env.example`), verified against that model's documented input contract (`image`, `voice_script`, `voice_prompt`, `video_prompt`).

**Not wired to a chat command (but implemented in `providers/stability/image.js` if you want to build a flow for them):** Erase and Inpaint both require a separate mask image, and Style Transfer requires two images — none of these fit cleanly into a single WhatsApp message/reply, so they're left as library functions rather than half-usable commands.

**On the Stable Audio model slug:** `/v2beta/audio/{model}/text-to-audio` is a confirmed, documented pattern for Stable Audio 2.x. Stability released Stable Audio 3.0 very recently (per the release notes you provided); the exact model slug for 3.0 wasn't independently verified while building this, so `STABILITY_AUDIO_MODEL` defaults to the confirmed `stable-audio-2` — switch it once you've checked platform.stability.ai/docs/api-reference yourself.

**On Nano Banana / Veo 3:** these are proprietary, vendor-specific models needing their own official API access (Google, for Veo 3) — outside what a generic adapter can respons­ibly wire up without real credentials to test against.


---

## 📜 Command menu

Send `.menu` to the bot to see the full, categorized command list, generated live from whatever plugins are actually loaded (so it never goes stale).

---

## 🧪 What was and wasn't tested

Tested: JS syntax across every file, the command-registration/import chain, the new `lib/system.js` and `lib/msg.js` logic against how they're actually called from `main.js`, JSON validity of `package.json`/`app.json`, and the pairing page's HTML/JS against the real `/code` API response shape.

**Not tested** (requires a live WhatsApp connection and/or real API keys, neither of which are available in this environment): the actual pairing/login flow end-to-end, MongoDB session persistence, and every AI/Image/Video/Music provider call. These are built against each provider's documented API contract but should be smoke-tested with real credentials before relying on them.

---

## 📢 Official Channel

https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P

---

*© 2026 🥰 MONA LISA 🤭 · Powered by Progress Tech*
