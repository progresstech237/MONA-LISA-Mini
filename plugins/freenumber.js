const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY🧑‍💻™ ✓';
const API = 'https://api.omegatech.app/api/tools/freenumber-countries-availble';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

cmd({
  pattern: "freenumber",
  alias: ["veepn","freenum","countries"],
  react: "🌍",
  desc: "Veepn free number countries",
  category: "progresstech tools",
  use: ".freenumber | .freenumber cameroon",
  filename: __filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    const ctx = { forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY🧑‍💻™ ✓' } };
    await conn.sendMessage(from,{react:{text:"🌍",key:mek.key}}).catch(()=>{});

    let raw = null;
    try{
      const { data } = await axios.get(API, { timeout:15000, headers:{ 'User-Agent':'Mozilla/5.0' } });
      raw = data;
    }catch{
      const { data } = await axios.post(API, {}, { timeout:15000, headers:{ 'Content-Type':'application/json','User-Agent':'Mozilla/5.0' } });
      raw = data;
    }

    // Omega returns: { status:true, data: [ {country, code, ...} ] } or { countries: [...] }
    let countries = raw?.data?.countries || raw?.countries || raw?.data || raw?.result || [];
    if(!Array.isArray(countries)){
      if(typeof countries === 'object' && countries!==null){
        // try to extract list from object
        if(Array.isArray(countries.available)) countries = countries.available;
        else if(Array.isArray(countries.list)) countries = countries.list;
        else countries = Object.values(countries).filter(v=> typeof v==='string' || (v && v.name));
      }
    }
    if(!Array.isArray(countries) || countries.length===0) countries = [JSON.stringify(raw).slice(0,2000)];

    let list = countries.map(c=>{
      if(typeof c==='string') return c;
      if(c.name && c.code) return `${c.name} (${c.code}) ${c.flag||''}`.trim();
      return c.name || c.country || c.code || JSON.stringify(c).slice(0,100);
    }).filter(Boolean);

    // dedup + sort
    list = [...new Set(list)].sort();

    let filterQ = (q||"").trim().toLowerCase();
    let display = list;
    if(filterQ && !['help','menu'].includes(filterQ)){
      const f = list.filter(x=> x.toLowerCase().includes(filterQ));
      if(f.length>0) display = f;
    }

    const header = filterQ && display.length!==list.length ? `*🌍 Filtered "${q}"* - Found ${display.length}/${list.length}\n\n` : `*🌍 Veepn Free Number - Available Countries*\n*Total:* ${list.length}\n\n`;

    let msg = header + display.map((c,i)=> `${i+1}. ${c}`).join('\n') + `\n\n_${BRAND}_`;

    if(msg.length > 3800){
      await conn.sendMessage(from,{ text: msg.slice(0,3800)+`\n\n_...${display.length-80} more in file_`, contextInfo:ctx }, {quoted:mek});
      await conn.sendMessage(from,{
        document: Buffer.from(`VEEPN COUNTRIES - Total ${list.length}\nDate: ${new Date().toLocaleString()}\nFilter: ${q||'none'}\n\n${list.join('\n')}\n\n${BRAND}`),
        mimetype:'text/plain',
        fileName:`Veepn_Countries_${list.length}.txt`,
        caption:`*🌍 All ${list.length} Countries*\n${BRAND}`,
        contextInfo:ctx
      },{quoted:mek});
    }else{
      await conn.sendMessage(from,{ text: msg, contextInfo:ctx },{quoted:mek});
    }

    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('Veepn Error:', e.response?.data||e.message);
    reply(`*❌ Veepn Countries Failed*\n${e.response?.data?.message || e.message}\n${BRAND}`);
  }
});
