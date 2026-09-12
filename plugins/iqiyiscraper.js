const { cmd } = require('../redx');
const axios = require('axios');
const fs = require('fs');

const CACHE_FILE='./data/iqiyi.json';
if(!fs.existsSync('./data')) fs.mkdirSync('./data',{recursive:true});
let iqCache={};
try{ if(fs.existsSync(CACHE_FILE)) iqCache=JSON.parse(fs.readFileSync(CACHE_FILE,'utf8')); }catch{}
function saveCache(){ try{ fs.writeFileSync(CACHE_FILE, JSON.stringify(iqCache,null,2)); }catch{} }

class IQIYIScraper{
  constructor(){
    this.deviceId='8936806dac3e27d0daf95979310002f6';
    this.client=axios.create({ headers:{
      'User-Agent':'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36',
      'Accept':'application/json, text/plain, */*',
      'Referer':'https://www.iq.com/',
      'Origin':'https://www.iq.com'
    }, timeout:30000 });
  }
  _sid(){ return `${this.deviceId}_${Date.now()}`; }
  async getHotVideos(opts={}){
    const base='https://pcw-api.iq.com/api/lego/hot';
    const params={ platformId:4, modeCode:'intl', langCode:'en_us', deviceId:this.deviceId, uid:'', ua:'mozilla/5.0 (linux; android 10; k) applewebkit/537.36 (khtml, like gecko) chrome/139.0.0.0 mobile safari/537.36', sid:this._sid(), channelId:0, size:10, vip:0, pspStatus:1,...opts };
    const url=new URL(base); Object.entries(params).forEach(([k,v])=>url.searchParams.append(k,String(v)));
    const { data } = await this.client.get(url.toString());
    if(data.code!=='0') throw new Error(`Hot API ${data.code}`);
    return data.data.map(v=>({
      title:v.name||v.focus||'No title',
      rating:v.rating||'', desc:v.desc||'', poster:v.albumWebpPic||v.posterWebpPic||'',
      totalEpisodes:v.tvCount||0, albumId:v.qipuId||null, tvId:v.defaultTvId||null,
      webPlayUrl:v.playLocSuffix?`https://www.iq.com/play/${v.playLocSuffix}`:null,
      webAlbumUrl:v.albumLocSuffix?`https://www.iq.com/album/${v.albumLocSuffix}`:null
    }));
  }
  async searchViaAPI(query){
    const url=`https://pcw-api.iq.com/api/search/recommend?query=${encodeURIComponent(query)}&page=1&size=10&platformId=4&modeCode=intl&langCode=en_us&deviceId=${this.deviceId}`;
    const { data } = await this.client.get(url);
    return data;
  }
}

async function prepareImage(conn, url){
  try{
    const { prepareWAMessageMedia } = require('@whiskeysockets/baileys');
    const resp=await axios.get(url,{ responseType:'arraybuffer', headers:{'User-Agent':'Mozilla/5.0'}, timeout:15000 });
    const media=await prepareWAMessageMedia({ image:Buffer.from(resp.data) }, { upload: conn.waUploadToServer });
    return media.imageMessage;
  }catch{ return null; }
}

cmd({
  pattern:"iqiyi", alias:["iq","iqsearch"], react:"🎬",
  desc:"IQIYI hot/search/stream", category:"downloader",
  use:".iqiyi hot |.iqiyi search naruto |.iqiyi stream 0",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  try{
    const scraper=new IQIYIScraper();
    const args=(q||"").split(' ').filter(Boolean);
    const sub=args[0]?.toLowerCase()||'help';
    const query=args.slice(1).join(' ');

    if(!q||sub==='iqiyi'||sub==='iqiyi'){
      return reply(`*🎬 IQIYI SCRAPER*\n\n*${prefix}iqiyi hot* - hot videos\n*${prefix}iqiyi search <query>* - search\n*${prefix}iqiyi stream 0* - get stream url\n*${prefix}iqiyi info <url>* - info\n\n*Powered by Omegatech*`);
    }

    if(sub==='hot'){
      reply(`*🔥 Fetching hot videos...*`);
      const videos=await scraper.getHotVideos({ size:10 });
      iqCache[m.sender]={ videos, timestamp:Date.now() }; saveCache();
      const imgMsg=await prepareImage(conn, videos[0]?.poster);
      let text=`*🔥 IQIYI Hot - ${videos.length} found*\n\n`;
      videos.forEach((v,i)=>{ text+=`*${i}. ${v.title.slice(0,50)}* ${v.rating?`[${v.rating}]`:''} ${v.totalEpisodes?`${v.totalEpisodes}eps`:''}\n${v.webPlayUrl||''}\n*→ ${prefix}iqiyi stream ${i}*\n\n`; });
      if(imgMsg){
        await conn.relayMessage(from,{ interactiveMessage:{ header:{ title:"🔥 IQIYI Hot", hasMediaAttachment:true, imageMessage:imgMsg }, body:{ text: text.slice(0,3000) }, footer:{ text:"IQIYI • Educational use" }, nativeFlowMessage:{ buttons:[
          { name:"quick_reply", buttonParamsJson: JSON.stringify({ display_text:"Stream 0", id:`${prefix}iqiyi stream 0` }) },
          { name:"quick_reply", buttonParamsJson: JSON.stringify({ display_text:"Stream 1", id:`${prefix}iqiyi stream 1` }) },
          { name:"cta_url", buttonParamsJson: JSON.stringify({ display_text:"Open IQIYI", url:"https://www.iq.com" }) }
        ] } } },{});
      }else reply(text.slice(0,4000));
      return;
    }

    if(sub==='search'){
      if(!query) return reply(`*❌ ${prefix}iqiyi search naruto*`);
      reply(`*🔍 Searching IQIYI for: ${query}...*`);
      try{
        const apiRes=await scraper.searchViaAPI(query);
        // API returns structure, parse
        let msg=`*🔍 Results for ${query}*\n\n`;
        if(apiRes.data?.list?.length){
          const list=apiRes.data.list.slice(0,10);
          iqCache[m.sender]={ videos:list.map(x=>({ title:x.name||x.title, webPlayUrl:x.playUrl||x.url, poster:x.pic||'' })), timestamp:Date.now() }; saveCache();
          list.forEach((v,i)=>{ msg+=`*${i}. ${v.name||v.title}*\n*→ ${prefix}iqiyi stream ${i}*\n${v.playUrl||''}\n\n`; });
        }else{
          msg+=`\`\`\`${JSON.stringify(apiRes).slice(0,2000)}\`\`\``;
        }
        reply(msg.slice(0,4000));
      }catch(e){
        // fallback try ytdlp if installed
        try{
          const { YtDlp } = require('ytdlp-nodejs');
          const ytdlp=new YtDlp();
          const searchUrl=`https://www.iq.com/search?query=${encodeURIComponent(query)}`;
          const info=await ytdlp.getInfoAsync(searchUrl,{ dumpSingleJson:true, flatPlaylist:true });
          const entries=(info.entries||[]).slice(0,10);
          iqCache[m.sender]={ videos:entries.map(e=>({ title:e.title, url:e.url })), timestamp:Date.now() }; saveCache();
          let txt=`*🔍 Results for ${query} - ${entries.length}*\n\n`;
          entries.forEach((v,i)=>{ txt+=`*${i}. ${v.title}*\n${v.url}\n*→ ${prefix}iqiyi stream ${i}*\n\n`; });
          reply(txt.slice(0,4000));
        }catch{ reply(`*❌ Search failed: ${e.message}*`); }
      }
      return;
    }

    if(sub==='stream'){
      const idx=parseInt(args[1]);
      const cache=iqCache[m.sender];
      if(!cache) return reply(`*⚠️ No cache. Run ${prefix}iqiyi hot or search first*`);
      const video=cache.videos[idx];
      if(!video) return reply(`*❌ Invalid index*`);
      const playUrl=video.webPlayUrl||video.url||video.playUrl;
      if(!playUrl) return reply(`*❌ No playable URL*`);
      reply(`*⏳ Fetching stream for ${video.title}...*`);
      try{
        const { YtDlp } = require('ytdlp-nodejs');
        const ytdlp=new YtDlp();
        const info=await ytdlp.getInfoAsync(playUrl);
        const best=(info.formats||[]).filter(f=>f.has_video&&f.has_audio).sort((a,b)=>(b.height||0)-(a.height||0))[0];
        let txt=`*🎬 ${info.title||video.title}*\nDuration: ${info.duration||'N/A'}s\nUploader: ${info.uploader||'IQIYI'}\nViews: ${info.view_count||'N/A'}\n\n`;
        if(best) txt+=`*Best ${best.height}p*\n${best.url}\n\nFormats: ${info.formats.length}`;
        else txt+=`*No stream found - ${info.formats?.length||0} formats*`;
        reply(txt.slice(0,4000));
      }catch(e){
        reply(`*🎬 ${video.title}*\n*URL:* ${playUrl}\n\n*Direct stream requires ytdlp-nodejs*\nError: ${e.message}\n\nOpen: ${playUrl}`);
      }
      return;
    }

    if(sub==='info'){
      const url=args[1];
      if(!url) return reply(`*❌ ${prefix}iqiyi info https://www.iq.com/play/...*`);
      reply(`*📺 Getting info ${url}...*`);
      try{
        const { YtDlp } = require('ytdlp-nodejs');
        const ytdlp=new YtDlp();
        const info=await ytdlp.getInfoAsync(url);
        reply(`*🎬 ${info.title}*\nDuration: ${info.duration}s\nUploader: ${info.uploader}\nViews: ${info.view_count}\nDesc: ${info.description?.slice(0,300)}...\nFormats: ${info.formats?.length}`.slice(0,4000));
      }catch(e){ reply(`*❌ Info error: ${e.message}*`); }
      return;
    }

    reply(`*⚠️ Unknown. Use ${prefix}iqiyi menu*`);
  }catch(e){
    console.error('IQIYI error:', e.message);
    reply(`*❌ Error: ${e.message}*`);
  }
});
