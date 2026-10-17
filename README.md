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
- **AI / Image / Video / Music provider architecture** (`providers/`, `lib/omegatech.js`) — backed by the free OmegaTech API (no key required), with automatic fallbacks so a single provider outage does not disable a feature
- **MONA LISA personality system** (`lib/responses.js`) — reusable success/error/loading/warning message pools any plugin can use
- **Redesigned command menu** (`.menu`) grouped into elegant categories
- **New Fun & Entertainment commands** with local content pools (jokes, facts, quotes, trivia, would-you-rather, compliments, riddles, coinflip, dice, 8-ball)
- Centralized config in `config.js`, fully MONA LISA-branded

---

## ⬆️ Baileys 7.0.0-rc14

Pinned to this exact version. Checked against the official migration guide: `fetchLatestBaileysVersion`, `makeCacheableSignalKeyStore` and a store-backed `getMessage` were already in place. One required change was missing and is now fixed: the main `messages.upsert` handler only ever processed `messages[0]`, silently dropping any extra messages WhatsApp batched into the same event. It now loops the whole batch.

**This is a release candidate, not a stable release.** While researching the upgrade I found other projects reporting, on this rc track, sessions disconnecting within seconds of login and a pairing-time decode crash. Those are upstream library issues; if you hit exactly those symptoms, the remedy is a newer Baileys release rather than more changes here.

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
| **`config` and `botNumber` were never actually included in the command dispatch context anywhere in `main.js`** | Every command relying on them — the entire `.autorecording`/`.autotyping`/`.anticall`-settings toggle group in `all-settings.js` (~29 call sites) — threw "Cannot read properties of undefined" on every use | Added both to all three dispatch sites, matching the same fix pattern used earlier for `mentionedJid`/`quoted` |
| `all-settings.js` imported a function, `updateUserConfig`, that doesn't exist in `lib/database.js` (the real export is `updateUserConfigInMongoDB`) | Every settings toggle that reached the database-save step would have thrown "not a function" | Fixed the import to alias the real export name |
| `antidelete.js`'s status-check command referenced `getUserConfigFromMongoDB` without importing it | `.antidelstatus` threw a ReferenceError every time | Added the missing import |
| Antidelete only ever sent a text label like "🖼️ Image" for deleted media — never the actual file | Owners never actually saw what was deleted, just that something was | Now attempts to re-download and forward the real image/video/audio/sticker/document (can still fail if WhatsApp already evicted it from its CDN — that's a platform limit, not a bug) |
| No edited-message detection existed at all, despite `.antiedit` being expected | Edits were invisible | Added `lib/antiedit.js`, wired into the same `messages.update` stream antidelete already uses, reporting before/after text to the owner |
| 9 game plugins (`car`, `dino`, `fopply`, `fruit`, `ludo`, `ninja`, `shooter`, `snake`, `sonic`) and `penalty` used `require('../../redx')` | Wrong path — none of these could ever load | Fixed to `../redx` |
| `providers/` folder missing from the repo | `ai-studio.js` (`.ai`, `.translate`, `.genvideo`, `.freeimagine`, ...) failed to load | Added `providers/ai`, `providers/video`, `providers/pollinations`, all wired to OmegaTech |
| 11 plugins request `prefix` and `.online` requests `fromMe`, but the dispatcher never provided them | Help text showed `undefinedephoto`, `undefinedantibad`...; `.online` permission check misbehaved | Added both to all three dispatch contexts |
| Old channel JID/link hardcoded in 13 files | Wrong channel everywhere | Replaced with the new channel in code, README and `.env.example` |

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
│   ├── ai.js       (chat, translate, summarize, code help — OmegaTech chat API)
│   ├── pollinations.js (free text-to-image, returns raw bytes)
│   └── video.js    (text-to-video / image-to-video via OmegaTech)
├── lib/                    # shared helpers (message parsing, responses, anti-call, ...)
│   └── omegatech.js        # OmegaTech API client (chat, image gen/edit, music, upload)
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

## 🚀 Hosting & staying online 24/7

**Vercel will not work for this bot.** Vercel runs code as short-lived serverless functions that are shut down seconds after each request. This bot has to hold one open connection to WhatsApp around the clock (and finish the pairing handshake *after* showing you the code), so on Vercel it would disconnect constantly and pairing would fail with "Incorrect code" / endless "Logging in...". The same goes for Cloudflare Workers and similar. It needs a host that runs a normal, continuously-running Node process.

| Option | Cost | Always on? | Notes |
|---|---|---|---|
| **Render (free web service) + a free uptime monitor** | Free, no card | Yes, *with* the keep-alive setup below | Free instances sleep after 15 min without web traffic; 750 free hours/month covers exactly one service running 24/7. Not an officially supported use — see caveats. |
| **Oracle Cloud "Always Free" VM** | Free, but needs a card for identity verification | Yes, truly | Real server: install Node 20 + `pm2`, or use the included `Dockerfile`. More hands-on; free capacity can be hard to get. |
| Render Starter / Railway / any VPS | Paid (a few $/month) | Yes | Simplest and most reliable if you can afford it. |

### Render free + keep-alive (step by step)
1. Push this repo to GitHub. **Never commit `.env`** — use `.env.example` as the template.
2. Render → **New → Blueprint** → pick the repo (it reads `render.yaml`).
3. When asked, set **`MONGODB_URI`** (required — a free Render disk is wiped on every restart, so MongoDB is where logins are kept). `AI_API_KEY` / `STABILITY_API_KEY` are optional.
4. After the first deploy, copy your URL (e.g. `https://mona-lisa-mini.onrender.com`).
5. Create a free monitor at [UptimeRobot](https://uptimerobot.com) or [cron-job.org](https://cron-job.org) that requests `https://<your-url>/ping` every 5 minutes. (`KEEP_ALIVE=true`, already set in `render.yaml`, also makes the bot ping itself every 10 minutes — but only an *external* monitor can wake it if it ever does fall asleep.)

**Caveats, honestly:** keeping a free Render service awake with pings is a widely-used workaround, not something Render promises; the 750-hour pool is per workspace, so don't run other free services next to it; if it does sleep, waking takes about a minute and the bot logs back in from MongoDB. If it ever matters more than the cost, pay for an always-on instance.

`/ping` is the health route (returns `{"status":"active", "activeSessions": N}`).

> **Channel settings:** the default channel is set in `config.js`, but `CHANNEL_JID` / `CHANNEL_LINK` in your host's Variables or `.env` **override** it. If you previously set them, update or delete them.

## 🧠🎨🎬🎵 OmegaTech AI suite (no API key needed)

All AI features are backed by **OmegaTech** (`https://api.omegatech.app`, attribution `@Omegatech-01`). No API key or signup is required — the client lives in `lib/omegatech.js` and is shared by every command below.

| Command | What it does | Returns on WhatsApp |
|---|---|---|
| `.aiimage <prompt>` | Text-to-image | Real image file |
| `.aimusic <prompt>` | Text-to-music | Real MP3 audio (falls back to generated lyrics if every audio backend is busy) |
| `.editimage <prompt>` | Reply to (or caption) an image and describe the change | Real PNG file |
| `.omega <prompt>` | Chat with the AI models | Text |
| `.imagetoprompt` | Reply to an image | Detailed description / reusable prompt |
| `.aimodels` | Lists chat models, image models, ratios and usage | Text |

**Image options:** add a ratio (`1:1`, `9:16`, `16:9`, `3:4`, `4:3`, `2:3`, `3:2`) and/or `--model <key>`:

```
.aiimage 16:9 a futuristic city at sunset --model cinematic
.aiimage a cute robot --model anime
```

Image model keys: `flux2`, `flux2pro`, `realistic`, `cinematic`, `anime`, `illustration`, `disney`, `chalk`, `zimage`.

**Chat model keys:** `standard`, `deepseek`, `gemini`, `gemma`, `llama`, `oss`, `gpt5nano`, `gpt-5`, `chatgpt`, `claude`, `perplexity`:

```
.omega --model claude write a short poem about the moon
```

**How image editing works:** the bot uploads the image you sent to a temporary public host (`Pone.rs` / `Kappa.lol` / `Top4top` / `shz.al`, tried in order), sends that URL + your instruction to the edit model (`NanoBanana` first, then `NanoBanana 2`, `Qwen`, `Flux Pro`, `GPT Image`), downloads the result and converts it to a real PNG before sending it back.

**Channel attribution:** the configured channel (`CHANNEL_JID`, default `120363431455356251@newsletter`) is attached to result and menu messages only — never to transient loading messages or reactions, so it appears on some messages, not all.

**Environment (all optional):**

| Variable | Default | Purpose |
|---|---|---|
| `OMEGATECH_API` | `https://api.omegatech.app` | Override the API base URL |
| `OMEGATECH_TIMEOUT` | `120000` | Per-request timeout in ms |
| `OMEGA_CHAT_MODEL` | `deepseek-v3.2` default on the API | Default model for `.ai` / `.translate` / `.summarize` / `.code` |

The other AI commands from `ai-studio.js` are wired to the same service: `.ai`, `.translate`, `.summarize`, `.code`, `.freeimagine`, `.genvideo` (text-to-video via `/api/ai/Txt2video`) and `.img2video` (image-to-video).

Talking-avatar lip-sync (`.talkingavatar`) is **not** offered by OmegaTech, so that command reports clearly that it is unavailable instead of pretending to work.


---

## 📜 Command menu

Send `.menu` to the bot to see the full, categorized command list, generated live from whatever plugins are actually loaded (so it never goes stale). **225 commands / 463 names including aliases** as of this build, across AI (OmegaTech), image/video/music, fun/games, an anime-reaction set (nekos.best/waifu.pics), a virtual economy game, audio effects (local ffmpeg), dev/security utilities, passive recon tools, group management, and owner tools.

**Not included:** active vulnerability/port scanning against arbitrary targets, real threat-intel/reputation lookups (would need paid API keys not provided), URL-cloaking, temp-phone-number SMS bypass, arbitrary remote-code plugin installation, and a fake premium/license system. This build *does* use the OmegaTech API for the AI/image/music features the owner requested; other OmegaTech routes (channel engagement boosting, social "stalk" lookups) are still not wired to any command.

---

## 🧪 What was and wasn't tested

**Verified in this build** (Node 22): every JS file passes a syntax check; all **58/58 plugins load cleanly**; the command registry has **225 commands / 463 names including aliases with zero collisions** and every command has a handler; the menu renders; every context field plugins request is provided by the dispatcher.

**Live-tested against OmegaTech during this build:** `.aiimage` (image returned), `.editimage` (real PNG returned, 1024x1024), `.imagetoprompt` (description returned), `.aimusic` (real 4.1 MB MP3 returned), `.omega` (chat reply), `.aimodels`, the upload/download pipeline, text-to-video, and `ai-studio`'s `.ai` / `.code` / `.summarize` / `.freeimagine`.

**Not testable here, so not verified:** the live WhatsApp pairing/login flow, unlink→relink, MongoDB persistence, and anything on Baileys 7.0.0-rc14 at runtime. Every third-party endpoint other than OmegaTech (downloaders, anime reactions, etc.) was outside this build's testing scope. Only login credentials (not WhatsApp's per-chat encryption keys) are backed up to MongoDB.

> **Note on external AI services:** OmegaTech is a free third-party aggregator, so individual routes can be rate-limited or temporarily down. The client retries across multiple backends (image: ArtGen → DreamFace → Flux Pro 2 → Pollinations; edit: NanoBanana → NanoBanana 2 → Qwen → Flux Pro → GPT Image; music: sonu3 → Remusic v2 → aisong → sonu4 → Melody-ai, then lyrics) so a single outage does not take a whole feature down.

## 📢 Official Channel

https://whatsapp.com/channel/0029Vb8rLzOCRs1j79bllH05

---

*© 2026 🥰 MONA LISA 🤭 · Powered by Progress Tech*
