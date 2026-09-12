const { cmd } = require('../redx');
const axios = require('axios');

const BRAND = '🔹 Powered by Progress Tech • 🥷TECH TOY™ ✓';
const API_BASE = 'https://api.omegatech.app/api/Sport';
const IMAGE = 'https://res.cloudinary.com/di2a9lenz/image/upload/v1786909227/omegatech_ai_media/upload-1786909226872.jpg';

async function fetchJson(url){
  const { data } = await axios.get(url,{ timeout:30000, headers:{'User-Agent':'Mozilla/5.0'} });
  return data;
}

cmd({
  pattern: "sports", alias: ["sport","football","soccer"], react:"⚽",
  desc:"Sports news, live scores, highlights", category:"progresstech tools",
  use:".sports |.sports trends |.sports feeds |.sports highlights |.sports news 0",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    const args=(q||"").trim().split(/\s+/);
    const sub=(args[0]||'').toLowerCase();
    const idx=parseInt(args[1]);
    const pageArg=parseInt(args[1])||1;

    if(!q || ['menu','sports'].includes(sub)){
      return reply(
`*⚽ SPORTS HUB*\n\n`+
`*📰 ${prefix}sports trends - Trending headlines*\n`+
`*⚽ ${prefix}sports feeds - Live scores*\n`+
`*🎬 ${prefix}sports highlights - Video clips*\n\n`+
`*Details:*\n`+
`${prefix}sports trends 2 - Page 2\n`+
`${prefix}sports news 0 - Read #0 (after trends)\n`+
`${prefix}sports match 0 - View match #0 (after feeds)\n`+
`${prefix}sports highlight 0 - Watch #0 (after highlights)\n\n${BRAND}`);
    }

    // NEWS detail - fetch again to avoid RAM DB
    if(sub==='news' &&!isNaN(idx)){
      const data=await fetchJson(`${API_BASE}/sport-trend?page=1&perPage=10`);
      const newsList=data?.news || data?.data?.news || data?.data || [];
      const item=newsList[idx];
      if(!item) return reply(`*❌ Invalid news #${idx}. Run ${prefix}sports trends first.*`);
      const date=item.createdAt? new Date(parseInt(item.createdAt)).toLocaleString() : 'N/A';
      const cover=item.cover?.url || item.thumbnail || IMAGE;
      const content=`*📰 ${item.title}*\n━━━━━━━━━━━━━━\n${item.summary||'No summary'}\n\n*📅 ${date}*\n*🔗 ${item.detailPath||''}*`;
      await conn.sendMessage(from,{ image:{ url: cover }, caption: content },{quoted:mek});
      return;
    }

    if(sub==='match' &&!isNaN(idx)){
      const data=await fetchJson(`${API_BASE}/sport-feeds`);
      const matches=data?.matches || data?.data?.matches || data?.data || [];
      const sel=matches[idx];
      if(!sel) return reply(`*❌ Invalid match #${idx}. Run ${prefix}sports feeds*`);
      let content=`*⚽ ${sel.team1?.name||'Team1'} vs ${sel.team2?.name||'Team2'}*\n━━━━━━━━━━━━━━\n*Score: ${sel.team1?.score||'0'} - ${sel.team2?.score||'0'}*\n*League: ${sel.league||'N/A'}*\n*Status: ${sel.status||'Unknown'}*\n`;
      if(sel.replay?.length) content+=`\n*📺 Full Replay:*\n${sel.replay[0].path||sel.replay[0].url}\n`;
      if(sel.highlights?.length){
        content+=`\n*🎬 Highlights:*\n`;
        sel.highlights.forEach((h,i)=> content+=`${i}. ${h.title||'Clip'}\n`);
        content+=`\n*Watch: ${prefix}sports highlight ${i}*\n`.replace(/\{i\}/g, '0');
      }
      return reply(content);
    }

    if(sub==='highlight' &&!isNaN(idx)){
      const data=await fetchJson(`${API_BASE}/sport-feeds`);
      const matches=data?.matches || data?.data?.matches || data?.data || [];
      const all=[];
      for(const match of matches){
        (match.highlights||match.videos||[]).forEach(h=> all.push({...h, matchTitle:`${match.team1?.name||'Team1'} vs ${match.team2?.name||'Team2'}`, videoUrl:h.path||h.url||h.videoUrl||h.src||''}));
      }
      const sel=all[idx];
      if(!sel) return reply(`*❌ Invalid highlight #${idx}. Run ${prefix}sports highlights*`);
      if(!sel.videoUrl) return reply(`*❌ No URL for this clip*\n${sel.title||''}`);
      reply(`*📤 Sending: ${sel.title||sel.matchTitle}...*`);
      try{
        await conn.sendMessage(from,{ video:{ url: sel.videoUrl }, caption:`*🎬 ${sel.title||sel.matchTitle}*` },{quoted:mek});
      }catch{
        reply(`*📺 Watch:* ${sel.videoUrl}`);
      }
      return;
    }

    if(['trends','trend'].includes(sub)){
      const data=await fetchJson(`${API_BASE}/sport-trend?page=${pageArg}&perPage=5`);
      const newsList=data?.news || data?.data?.news || data?.data || [];
      let msg=`*📰 TRENDING NEWS - Page ${data?.page||pageArg}*\n*Total: ${data?.totalNews||newsList.length}*\n\n`;
      newsList.slice(0,5).forEach((item,i)=>{
        msg+=`*${i}. ${item.title?.slice(0,60)}*\n${item.summary?.slice(0,80)}...\n*Read: ${prefix}sports news ${i}*\n\n`;
      });
      if(data?.hasMore) msg+=`*Next: ${prefix}sports trends ${pageArg+1}*\n`;
      return reply(msg+`\n${BRAND}`);
    }

    if(['feeds','feed','matches'].includes(sub)){
      const data=await fetchJson(`${API_BASE}/sport-feeds`);
      const matches=data?.matches || data?.data?.matches || data?.data || [];
      let msg=`*⚽ LIVE FEEDS - ${matches.length} matches*\n\n`;
      matches.slice(0,8).forEach((mt,i)=>{
        msg+=`*${i}. ${mt.team1?.name||'T1'} ${mt.team1?.score||'0'} - ${mt.team2?.score||'0'} ${mt.team2?.name||'T2'}*\n${mt.league||''} • ${mt.status||''}\n*View: ${prefix}sports match ${i}*\n\n`;
      });
      return reply(msg+`${BRAND}`);
    }

    if(['highlights','hl','replay'].includes(sub)){
      const data=await fetchJson(`${API_BASE}/sport-feeds`);
      const matches=data?.matches || data?.data?.matches || data?.data || [];
      const all=[];
      for(const match of matches){
        (match.highlights||match.videos||[]).forEach(h=> all.push({...h, matchTitle:`${match.team1?.name||'T1'} vs ${match.team2?.name||'T2'}`, videoUrl:h.path||h.url||h.videoUrl||''}));
      }
      if(!all.length) return reply(`*⚠️ No highlights available.*`);
      let msg=`*🎬 HIGHLIGHTS - ${all.length} clips*\n\n`;
      all.slice(0,10).forEach((h,i)=> msg+=`*${i}. ${h.title||h.matchTitle}*\n*Watch: ${prefix}sports highlight ${i}*\n\n`);
      return reply(msg+`${BRAND}`);
    }

    reply(`*Unknown: ${sub}. Use ${prefix}sports menu*`);
  }catch(e){
    console.error('Sports error:', e.response?.data||e.message);
    reply(`*❌ Sports Error:* ${e.response?.data?.message||e.message}`);
  }
});
