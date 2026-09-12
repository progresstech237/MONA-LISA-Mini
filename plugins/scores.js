const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const NEWSLETTER_JID = '120363425282620066@newsletter';
const CHANNEL_LINK = 'https://whatsapp.com/channel/0029Vb7Lk3yAzNbrVaWDOk1P';
const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API = 'https://api.omegatech.app/api/tools/scores';

function getThumb(){ try{ for(const p of ['./media/menu1.png','./media/menu2.png']) if(fs.existsSync(p)) return fs.readFileSync(p); }catch{} return null; }

function formatMatch(m){
  try{
    const home=m.home_team||m.homeTeam||m.home||m.team1||m.localteam?.name||'Home';
    const away=m.away_team||m.awayTeam||m.away||m.team2||m.visitorteam?.name||'Away';
    const hs=m.home_score??m.homeScore??m.score1??m.goals_home??m.localteam?.goals??'-';
    const as=m.away_score??m.awayScore??m.score2??m.goals_away??m.visitorteam?.goals??'-';
    const status=m.status||m.match_status||m.state||'LIVE';
    const minute=m.minute||m.time||m.live_minute||'';
    const league=m.league||m.competition||m.tournament?.name||m.league_name||'';
    let icon='⚽';
    if(String(status).toLowerCase().includes('live')||minute) icon='🔴 LIVE';
    if(String(status).toLowerCase().includes('ft')||String(status).toLowerCase().includes('finished')) icon='✅ FT';
    if(String(status).toLowerCase().includes('ht')) icon='⏸️ HT';
    return `${icon} *${home} ${hs} - ${as} ${away}*\n 🏆 ${league} | ⏱️ ${minute? minute+"'": status}`;
  }catch{ return JSON.stringify(m).slice(0,200); }
}

cmd({
  pattern: "scores", alias: ["livescore","livescores","score","match"], react:"⚽",
  desc:"Live football scores", category:"progresstech tools",
  use:".scores |.scores live |.scores premier league",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    let rawQ=(q||"").trim();
    try{
      const p=JSON.parse(mek.message?.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson||'{}');
      if(p.id) rawQ=p.id.replace(prefix,"").trim();
      const r=mek.message?.listResponseMessage?.singleSelectReply?.selectedRowId;
      if(r) rawQ=r.replace(prefix,"").trim();
    }catch{}
    if(rawQ.startsWith(prefix)) rawQ=rawQ.replace(new RegExp(`^${prefix}[a-z0-9-]+\\s*`,'i'),'').trim();

    const ctx={ forwardingScore:999, isForwarded:true, forwardedNewsletterMessageInfo:{ newsletterJid:NEWSLETTER_JID, serverMessageId:1, newsletterName:'🥷TECH TOY™ ✓' } };
    if(!rawQ || ['all','today'].includes(rawQ.toLowerCase())) rawQ="live";

    await conn.sendMessage(from,{react:{text:"⚽",key:mek.key}}).catch(()=>{});

    if(rawQ.toLowerCase()==='scores'){
      let thumb=null; try{ const { prepareWAMessageMedia }=require('@whiskeysockets/baileys'); const tb=getThumb(); if(tb){ const md=await prepareWAMessageMedia({image:tb},{upload:conn.waUploadToServer}); thumb=md.imageMessage; } }catch{}
      const scores=`┏━━〔 ⚽ Live Scores 〕━━┓\n┃ Real-time scores\n┃\n┃ ${prefix}scores\n┃ ${prefix}scores live\n┃ ${prefix}scores premier league\n┃ ${prefix}scores barcelona\n┗━━━━━━━━━━━━━━┛`;
      return await conn.relayMessage(from,{ interactiveMessage:{ header:{title:"⚽ Live Scores",hasMediaAttachment:!!thumb,...(thumb?{imageMessage:thumb}:{})}, body:{text:menu}, footer:{text:BRAND}, nativeFlowMessage:{ buttons:[
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🔴 LIVE",id:`${prefix}scores live`})},
        {name:"quick_reply",buttonParamsJson:JSON.stringify({display_text:"🏆 EPL",id:`${prefix}scores premier league`})},
        {name:"cta_url",buttonParamsJson:JSON.stringify({display_text:"📢 Channel",url:CHANNEL_LINK})}
      ] } }, contextInfo:ctx },{});
    }

    let dataResult=null;
    const query=rawQ;
    const headers={'Content-Type':'application/json','User-Agent':'Mozilla/5.0'};

    try{
      const { data } = await axios.post(API, { query: query }, { timeout:30000, headers });
      dataResult=data.data||data.result||data;
    }catch(e){ console.log('scores POST fail', e.response?.data||e.message); }

    if(!dataResult){
      try{
        const { data } = await axios.get(`${API}?q=${encodeURIComponent(query)}`, { timeout:30000, headers:{'User-Agent':'Mozilla/5.0'} });
        dataResult=data.data||data.result||data;
      }catch{}
    }

    if(!dataResult){
      try{
        const { data } = await axios.get(API, { timeout:30000, headers:{'User-Agent':'Mozilla/5.0'} });
        dataResult=data.data||data.result||data;
      }catch{}
    }

    if(!dataResult) throw new Error('No scores from API');

    let matches=[];
    if(Array.isArray(dataResult)) matches=dataResult;
    else if(Array.isArray(dataResult.matches)) matches=dataResult.matches;
    else if(Array.isArray(dataResult.data)) matches=dataResult.data;
    else if(Array.isArray(dataResult.scores)) matches=dataResult.scores;
    else if(Array.isArray(dataResult.live)) matches=dataResult.live;
    else matches=[dataResult];

    if(query.toLowerCase()!=='live' && query.toLowerCase()!=='all'){
      const qlow=query.toLowerCase();
      const f=matches.filter(mm=> JSON.stringify(mm).toLowerCase().includes(qlow));
      if(f.length) matches=f;
    }

    if(!matches.length) return reply(`*⚽ No matches for:* ${query}\nTry ${prefix}scores live\n\n${BRAND}`);

    const limited=matches.slice(0,20);
    let msg=`*⚽ Live Football Scores*\n*Query:* ${query} | Found: ${matches.length}\n\n`;
    msg+=limited.map(formatMatch).join('\n\n');
    if(matches.length>20) msg+=`\n\n_...and ${matches.length-20} more_`;
    msg+=`\n\n_${BRAND}_\n_Updated: ${new Date().toLocaleTimeString()}_`;

    await conn.sendMessage(from,{ text: msg, contextInfo: ctx },{quoted:mek});
    if(matches.length>20){
      const fullTxt=matches.map((mm,i)=> `${i+1}. ${formatMatch(mm)}`).join('\n\n');
      await conn.sendMessage(from,{ document: Buffer.from(`LIVE SCORES - ${query}\n${fullTxt}\n\n${BRAND}`), mimetype:'text/plain', fileName:`Scores_${Date.now()}.txt`, contextInfo:ctx },{quoted:mek});
    }
    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(e){
    console.error('Scores Error:', e.response?.data||e.message);
    reply(`*❌ Scores Failed*\n${e.message}\nTry ${'.scores live'}`);
  }
});
