const { cmd } = require('../redx');
const axios = require('axios');

cmd({
  pattern: "screenshot", alias: ["ss","webshot","sitepic"], react:"🖥️",
  category:"tools",
  desc:"Full HD website screenshot",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    if(!q) return reply(`*🖥️ WEBSITE SCREENSHOT*\n\n*${prefix}screenshot https://google.com*\n*${prefix}ss https://example.com*`);

    let url=q.trim().split(' ')[0];
    if(!/^https?:\/\//.test(url)) url='https://'+url;

    await conn.sendMessage(from,{react:{text:"🖥️",key:mek.key}}).catch(()=>{});
    reply(`*⏳ Taking screenshot of ${url}...*`);

    let screenshotUrl=null;

    // Try movanest API (fixed ///)
    try{
      const apiUrl=`https://movanest.xyz/v2/ssweb?url=${encodeURIComponent(url)}&width=1280&height=720&full_page=true`;
      const { data } = await axios.get(apiUrl,{ timeout:60000, headers:{'User-Agent':'Mozilla/5.0'} });
      screenshotUrl=data?.screenshot || data?.data?.screenshot || data?.url || data?.image;
      if(data?.status===false) throw new Error('API status false');
    }catch(e){ console.log('movanest fail', e.message); }

    // Fallback 1: omegatech screenshot if available
    if(!screenshotUrl){
      try{
        const { data } = await axios.get(`https://api.omegatech.app/api/tools/screenshot?url=${encodeURIComponent(url)}`, { timeout:60000, headers:{'User-Agent':'Mozilla/5.0'} });
        screenshotUrl=data?.data?.url || data?.url || data?.screenshot || data?.data?.screenshot;
      }catch{}
    }

    // Fallback 2: thum.io / screenshotone free
    if(!screenshotUrl){
      screenshotUrl=`https://image.thum.io/get/width/1280/crop/720/noanimate/${url}`;
    }

    await conn.sendMessage(from,{
      image:{ url: screenshotUrl },
      caption:`🖥️ *Screenshot*\n*URL:* ${url}\n\n🔹 Powered by Progress Tech`
    },{quoted:mek});

    await conn.sendMessage(from,{react:{text:"✅",key:mek.key}}).catch(()=>{});
  }catch(err){
    console.error("SCREENSHOT ERROR:", err.response?.data||err.message);
    reply(`❌ Screenshot failed: ${err.message}\nTry: ${err.config?.url? 'API busy' : ''}.screenshot https://google.com`);
  }
});
