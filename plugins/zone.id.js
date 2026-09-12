const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/tools/Zoneid';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "zoneid",
  alias: ["zone","freedomain"],
  react: "🌐",
  desc: "Create & manage Zone.id subdomain",
  category: "progresstech tools",
  use: ".zoneid create mysite |.zoneid list |.zoneid dns mysite |.zoneid add mysite A 1.2.3.4",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let rawQ=(q||"").trim();
    try{
      const p=mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson;
      if(p){ const j=JSON.parse(p); if(j.id) rawQ=j.id.replace(prefix,"").trim(); }
      const r=mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
      if(r) rawQ=r.replace(prefix,"").trim();
    }catch{}
    if(rawQ.startsWith(prefix)) rawQ=rawQ.replace(new RegExp(`^${prefix}[a-z-]+\\s*`,'i'),'').trim();

    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY🧑‍💻™ ✓' } };

    if(!rawQ || ['zone.id','menu'].includes(rawQ.toLowerCase())){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const menu=`┏━━〔 🌐 Zone.id Manager 〕━━┓\n┃ via /api/tools/Zoneid\n┃\n┃ ${prefix}zoneid create mysite\n┃ → mysite.zone.id\n┃ ${prefix}zoneid list\n┃ ${prefix}zoneid dns mysite\n┃ ${prefix}zoneid add mysite A 1.2.3.4\n┃ ${prefix}zoneid add mysite CNAME example.com\n┃ ${prefix}zoneid add mysite TXT hello\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"🌐 Zone.id Manager",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🌐 Create",id:`${prefix}zoneid create demo${Date.now().toString().slice(-3)}`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"📜 List",id:`${prefix}zoneid list`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    await conn.sendMessage(from,{react:{text:"🌐",key:mek.key}}).catch(()=>{});

    const low=rawQ.toLowerCase();
    let action='create', subdomain='', rtype='', rvalue='';

    const parts=rawQ.split(/\s+/);
    if(low.startsWith('create ')){ action='create'; subdomain=parts[1]; }
    else if(low==='list' || low.startsWith('list ')){ action='list'; }
    else if(low.startsWith('dns ') || low.startsWith('get ')){ action='getdns'; subdomain=parts[1]; }
    else if(low.startsWith('add ')){ action='add'; subdomain=parts[1]; rtype=(parts[2]||'A').toUpperCase(); rvalue=parts.slice(3).join(' '); }
    else { action='create'; subdomain=parts[0]; }

    const clean = s=> (s||'').toString().trim().replace(/[^a-z0-9-]/gi,'').toLowerCase();
    if(subdomain) subdomain=clean(subdomain);

    let apiRes=null;
    const headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'};

    if(action==='create'){
      if(!subdomain) return reply(`❌ Provide name: ${prefix}zoneid create mysite`);
      reply(`*🌐 Creating...*\n*Subdomain:* ${subdomain}.zone.id`);
      try{
        const { data } = await axios.post(API, { subdomain, action:'create' }, { timeout:40000, headers });
        apiRes=data;
      }catch(e){
        const { data } = await axios.get(`${API}?subdomain=${encodeURIComponent(subdomain)}`, { timeout:30000, headers });
        apiRes=data;
      }
    }
    else if(action==='list'){
      reply(`*🌐 Listing your subdomains...*`);
      try{
        const { data } = await axios.get(`${API}?action=list`, { timeout:30000, headers });
        apiRes=data;
      }catch{
        const { data } = await axios.post(API, { action:'list' }, { timeout:30000, headers });
        apiRes=data;
      }
    }
    else if(action==='getdns'){
      if(!subdomain) return reply(`❌ ${prefix}zoneid dns mysite`);
      reply(`*🔍 DNS for ${subdomain}...*`);
      try{
        const { data } = await axios.get(`${API}?subdomain=${encodeURIComponent(subdomain)}&action=dns`, { timeout:30000, headers });
        apiRes=data;
      }catch{
        const { data } = await axios.post(API, { subdomain, action:'dns' }, { timeout:30000, headers });
        apiRes=data;
      }
    }
    else if(action==='add'){
      if(!subdomain||!rtype||!rvalue) return reply(`❌ Usage: ${prefix}zoneid add <sub> <TYPE> <value>`);
      reply(`*➕ Adding ${rtype} record to ${subdomain}...*`);
      try{
        const { data } = await axios.post(API, { subdomain, type:rtype, value:rvalue, content:rvalue, action:'add' }, { timeout:40000, headers });
        apiRes=data;
      }catch{
        const { data } = await axios.get(`${API}?subdomain=${encodeURIComponent(subdomain)}&type=${encodeURIComponent(rtype)}&value=${encodeURIComponent(rvalue)}`, { timeout:30000, headers });
        apiRes=data;
      }
    }

    if(!apiRes) throw new Error('No response');

    let msg='';
    const jStr = JSON.stringify(apiRes,null,2);
    if(action==='create'){
      const dom = apiRes?.data?.subdomain || apiRes?.data?.domain || apiRes?.subdomain || `${subdomain}.zone.id`;
      msg=`*✅ Zone.id Created*\n\n🌐 *Domain:* ${dom}\n📝 ${apiRes?.message || apiRes?.data?.message || 'Success'}\n\n\`\`\`${jStr.slice(0,2500)}\`\`\``;
    }else if(action==='list'){
      let list = apiRes?.data?.subdomains || apiRes?.data || apiRes?.subdomains || apiRes?.domains || [];
      if(!Array.isArray(list)) list=[apiRes];
      msg=`*🌐 Your Subdomains (${list.length})*\n\n${list.map((d,i)=> typeof d==='string'? `${i+1}. ${d}` : `${i+1}. ${d.subdomain||d.domain||d.name||JSON.stringify(d).slice(0,80)}`).join('\n')}\n\n\`\`\`${jStr.slice(0,2500)}\`\`\``;
    }else if(action==='getdns'){
      msg=`*🔍 DNS for ${subdomain}*\n\n\`\`\`${jStr.slice(0,3500)}\`\`\``;
    }else{
      msg=`*✅ DNS Added ${rtype} -> ${rvalue}*\n*Sub:* ${subdomain}\n\n\`\`\`${jStr.slice(0,3000)}\`\`\``;
    }

    await conn.sendMessage(from,{ text: msg+`\n\n${BRAND}\n${CHANNEL_LINK}`, contextInfo:ctx },{quoted:mek});
    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('Zoneid Error:', e.response?.data||e.message);
    reply(`*❌ Zone.id Failed*\n${e.response?.data?.message || e.message}\n\n${prefix}zoneid create mysite\n${prefix}zoneid list`);
  }
});
