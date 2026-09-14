const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/tools/Zoneid';

function getThumb() { try { for (const p of ['./media/menu1.png','./media/menu2.png']) if (fs.existsSync(p)) return fs.readFileSync(p); } catch {} return null; }

cmd({
  pattern: "zoneid",
  alias: ["zone", "subdomain", "zone-id", "zdns", "freedomain"],
  react: "🌐",
  desc: "Create and manage Zone.id subdomains - create, list, get DNS, add DNS records",
  category: "progresstech tools",
  use: ".zoneid create mysite |.zoneid list |.zoneid dns mysite |.zoneid add mysite A 1.2.3.4",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try {
    let rawQ = (q || "").trim();
    const inter = mek.message?.interactiveResponseMessage;
    if (inter?.nativeFlowResponseMessage?.paramsJson) {
      try { const p = JSON.parse(inter.nativeFlowResponseMessage.paramsJson); if (p.id) rawQ = p.id.replace(prefix,"").trim(); } catch {}
    }
    if (mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId) {
      rawQ = mek.message.listResponseMessage.singleSelectReply.selectedRowId.replace(prefix,"").trim();
    }
    if (rawQ.startsWith(prefix)) rawQ = rawQ.replace(new RegExp(`^${prefix}[a-z0-9-]+\\s*`, 'i'), '').trim();

    const ctx = { forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: NEWSLETTER_JID, serverMessageId: 1, newsletterName: '🥷TECH TOY🧑‍💻™ ✓' } };

    const low = rawQ.toLowerCase();

    if (!rawQ || ['help','menu'].includes(low)) {
        let thumb = null; try { const { prepareWAMessageMedia } = require('@whiskeysockets/baileys'); const tb = getThumb(); if (tb) { const media = await prepareWAMessageMedia({ image: tb }, { upload: conn.waUploadToServer }); thumb = media.imageMessage; } } catch {}
        const menu = `┏━━〔 🌐 Zone.id Manager 〕━━┓
┃ Create & Manage Zone.id subdomains
┃ via /api/tools/Zoneid
┃
┃ *Commands:*
┃ ${prefix}zoneid create mysite
┃ → creates mysite.zone.id
┃ ${prefix}zoneid list
┃ → list your subdomains
┃ ${prefix}zoneid dns mysite
┃ → get DNS records
┃ ${prefix}zoneid add mysite A 1.2.3.4
┃ → add A record
┃ ${prefix}zoneid add mysite CNAME example.com
┃ → add CNAME
┃ ${prefix}zoneid add mysite TXT hello
┃
┃ *Examples:*
┃ ${prefix}zoneid create progresstech
┃ ${prefix}zoneid list
┃ ${prefix}zoneid dns progresstech
┗━━━━━━━━━━━━━━┛
`;
        const buttons = [
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🌐 Create", id: `${prefix}zoneid create ` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "📜 List", id: `${prefix}zoneid list` }) },
            { name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🔍 Get DNS", id: `${prefix}zoneid dns ` }) },
            { name: "cta_url", buttonParamsJson: JSON.stringify({ display_text: "📢 Channel", url: CHANNEL_LINK }) }
        ];
        return await conn.relayMessage(from, {
            interactiveMessage: {
                header: { title: "🌐 Zone.id Subdomain Manager", hasMediaAttachment:!!thumb,...(thumb? { imageMessage: thumb } : {}) },
                body: { text: menu }, footer: { text: BRAND }, nativeFlowMessage: { buttons }
            }, contextInfo: ctx
        }, {});
    }

    await conn.sendMessage(from, { react: { text: "🌐", key: mek.key } });

    let action = "create";
    let subdomain = "";
    let recordType = "";
    let recordValue = "";

    const parts = rawQ.split(/\s+/);

    if (low.startsWith('create ')) { action = 'create'; subdomain = parts[1]; }
    else if (low.startsWith('list')) { action = 'list'; }
    else if (low.startsWith('dns ') || low.startsWith('get ')) { action = 'getdns'; subdomain = parts[1]; }
    else if (low.startsWith('add ')) {
        action = 'add';
        subdomain = parts[1];
        recordType = (parts[2] || 'A').toUpperCase();
        recordValue = parts.slice(3).join(' ');
    } else {
        // If just a name, assume create
        if (parts.length === 1) { action = 'create'; subdomain = parts[0]; }
        else { action = 'create'; subdomain = parts[0]; }
    }

    let result = null;
    let url = API;
    let payload = {};

    try {
        if (action === 'create') {
            if (!subdomain) throw new Error('Provide subdomain name:.zoneid create mysite');
            reply(`*🌐 Creating Zone.id subdomain...*\n*Subdomain:* ${subdomain}.zone.id\n\n_${BRAND}_`);
            // Try multiple param formats
            try {
                const { data } = await axios.post(API, {
                    subdomain: subdomain,
                    sub_domain: subdomain,
                    name: subdomain,
                    domain: subdomain,
                    action: 'create',
                    create: true
                }, { timeout: 40000, headers: { 'Content-Type': 'application/json' } });
                result = data.data || data;
            } catch {
                const { data } = await axios.get(`${API}?action=create&subdomain=${encodeURIComponent(subdomain)}&name=${encodeURIComponent(subdomain)}`, { timeout: 40000 });
                result = data.data || data;
            }
        }
        else if (action === 'list') {
            reply(`*🌐 Listing your Zone.id subdomains...*\n\n_${BRAND}_`);
            try {
                const { data } = await axios.post(API, { action: 'list', list: true }, { timeout: 30000, headers: { 'Content-Type': 'application/json' } });
                result = data.data || data;
            } catch {
                const { data } = await axios.get(`${API}?action=list&list=true`, { timeout: 30000 });
                result = data.data || data;
            }
        }
        else if (action === 'getdns') {
            if (!subdomain) throw new Error('Provide subdomain:.zoneid dns mysite');
            reply(`*🔍 Getting DNS records for ${subdomain}...*\n\n_${BRAND}_`);
            try {
                const { data } = await axios.post(API, { action: 'getdns', subdomain: subdomain, name: subdomain, get: true }, { timeout: 30000, headers: { 'Content-Type': 'application/json' } });
                result = data.data || data;
            } catch {
                const { data } = await axios.get(`${API}?action=getdns&subdomain=${encodeURIComponent(subdomain)}&name=${encodeURIComponent(subdomain)}&dns=true`, { timeout: 30000 });
                result = data.data || data;
            }
        }
        else if (action === 'add') {
            if (!subdomain ||!recordType ||!recordValue) throw new Error(`Usage: ${prefix}zoneid add <subdomain> <TYPE> <value>\nExample: ${prefix}zoneid add mysite A 1.2.3.4`);
            reply(`*➕ Adding DNS record...*\n*Subdomain:* ${subdomain}\n*Type:* ${recordType}\n*Value:* ${recordValue}\n\n_${BRAND}_`);
            try {
                const { data } = await axios.post(API, {
                    action: 'add',
                    subdomain: subdomain,
                    name: subdomain,
                    type: recordType,
                    record_type: recordType,
                    value: recordValue,
                    content: recordValue,
                    record: recordValue
                }, { timeout: 40000, headers: { 'Content-Type': 'application/json' } });
                result = data.data || data;
            } catch {
                const { data } = await axios.get(`${API}?action=add&subdomain=${encodeURIComponent(subdomain)}&type=${encodeURIComponent(recordType)}&value=${encodeURIComponent(recordValue)}`, { timeout: 40000 });
                result = data.data || data;
            }
        }

    } catch (e) {
        console.log('Zoneid primary failed', e.response?.data || e.message);
        // Final fallback bare
        try {
            const { data } = await axios.get(`${API}?subdomain=${encodeURIComponent(subdomain || rawQ)}&action=${action}`, { timeout: 30000 });
            result = data.data || data;
        } catch {}
    }

    if (!result) throw new Error('No response from Zone.id API');

    // Format result
    let msg = "";
    if (action === 'create') {
        msg = `*✅ Zone.id Subdomain Created*\n\n`;
        if (typeof result === 'string') msg += `${result}\n\n`;
        else {
            const dom = result.subdomain || result.domain || result.data?.subdomain || result.data?.domain || `${subdomain}.zone.id`;
            msg += `🌐 *Domain:* ${dom}\n`;
            if (result.message) msg += `📝 ${result.message}\n`;
            if (result.data?.message) msg += `📝 ${result.data.message}\n`;
            msg += `\n*Full Response:*\n\`\`\`${JSON.stringify(result, null, 2).slice(0,2500)}\`\`\`\n`;
        }
    } else if (action === 'list') {
        let list = [];
        if (Array.isArray(result)) list = result;
        else if (Array.isArray(result.data)) list = result.data;
        else if (Array.isArray(result.subdomains)) list = result.subdomains;
        else if (Array.isArray(result.domains)) list = result.domains;
        else list = [result];

        msg = `*🌐 Your Zone.id Subdomains*\n*Total:* ${list.length}\n\n`;
        msg += list.map((d,i)=> {
            if (typeof d === 'string') return `${i+1}. ${d}`;
            return `${i+1}. ${d.subdomain || d.domain || d.name || JSON.stringify(d).slice(0,100)}`;
        }).join('\n');
        msg += `\n\n\`\`\`${JSON.stringify(result, null, 2).slice(0,2500)}\`\`\``;
    } else if (action === 'getdns') {
        msg = `*🔍 DNS Records for ${subdomain}*\n\n\`\`\`${JSON.stringify(result, null, 2).slice(0,3500)}\`\`\`\n`;
    } else if (action === 'add') {
        msg = `*✅ DNS Record Added*\n*Subdomain:* ${subdomain}\n*Type:* ${recordType}\n*Value:* ${recordValue}\n\n\`\`\`${JSON.stringify(result, null, 2).slice(0,3000)}\`\`\`\n`;
    }

    msg += `\n\n_${BRAND}_\n${CHANNEL_LINK}`;

    await conn.sendMessage(from, { text: msg, contextInfo: ctx }, { quoted: mek });
    await conn.sendMessage(from, { react: { text: "✅", key: mek.key } });

  } catch (e) {
    console.error('Zoneid Error:', e.response?.data || e.message);
    reply(`*❌ Zone.id Failed*\n${e.response?.data?.message || e.message}\n\nTry:\n${'.zoneid create mysite'}\n${'.zoneid list'}\n${'.zoneid dns mysite'}`);
  }
});