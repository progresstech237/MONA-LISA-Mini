const { cmd } = require('../../redx');
const axios = require('axios');

const API = 'https://omegatech-api.dixonomega.tech/api/ai/Chatbot';

// Memory: { from: sessionId }
global.claudeSessions = global.claudeSessions || {};

async function callClaude({ action='chat', message, sessionId='', needSearch=false }){
  const params = { action, message, needSearch: String(needSearch) };
  if(sessionId) params.sessionId = sessionId;
  const { data } = await axios.get(API, { params, timeout: 30000 });
  return data;
}

cmd({
  pattern: "chatbot",
  alias: ["chatbot","aichat","progresschat"],
  react: "🧠",
  desc: "Chat with Claude (Omegatech) - Multi-turn + Web Search - /api/ai/Chatbot",
  category: "ai",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try{
    // MENU when no args
    if(!q){
      return reply(
`╭─ *🧠 PROGRESS CHATBOT - LIVE ✅* ─
│ Via Progress Tech API
│ Supports multi-turn + web search
│
├─ *COMMANDS*
│ •.chatbot <message> - Chat
│ •.chatbot reset - Clear session
│ •.chatbot search <query> - With web search
│ •.claude history - Show sessionId
│
├─ *EXAMPLES*
│.chatbot Hi how are you?
│.claude search who is Dixon Omega?
│.chatbot write code for snake game
│
├─ *FLAGS*
│ --search true/false (enable web)
│ Ex:.chatbot what is Bitcoin? --search true
│
├─ *SESSION*
│ Auto-saved per chat, continues
│ Type.claude reset to start new
│
╰─ API: /api/ai/Chatbot • Working 🟢`
      );
    }

    const low = q.toLowerCase().trim();

    // RESET
    if(low === 'reset' || low === 'clear'){
      const sid = global.claudeSessions[from];
      if(sid){
        try{ await callClaude({ action:'reset', message:'', sessionId: sid }); }catch{}
        delete global.claudeSessions[from];
      }
      return reply('✅ Session cleared. New chat will start fresh.');
    }

    if(low === 'history' || low === 'session'){
      const sid = global.claudeSessions[from] || 'None (new chat)';
      return reply(`*SessionId:* ${sid}\nAction: chat | reset\nneedSearch: false/true`);
    }

    // PARSE --search flag
    let needSearch = false;
    let message = q;
    if(q.includes('--search')){
      const m = q.match(/--search\s+(true|false)/i);
      if(m){ needSearch = m[1].toLowerCase()==='true'; message = q.replace(/--search\s+(true|false)/i,'').trim(); }
      else if(q.includes('--search')){ needSearch=true; message = q.replace(/--search/g,'').trim(); }
    }
    if(low.startsWith('search ')){
      needSearch = true;
      message = q.replace(/^search\s+/i,'');
    }

    if(!message) return reply('Give a message:.claude hello');

    await conn.sendMessage(from, { react: { text: "💭", key: mek.key } });
    await conn.sendPresenceUpdate('composing', from);

    const existingSid = global.claudeSessions[from] || '';
    const res = await callClaude({ action:'chat', message, sessionId: existingSid, needSearch });

    // Save session
    if(res.sessionId) global.claudeSessions[from] = res.sessionId;

    const replyText = res.reply || res.response || res.result || 'No reply';

    await conn.sendMessage(from, {
      text: `${replyText}\n\n> _Session: ${res.sessionId?.slice(0,12)}... | Search: ${needSearch} | ${res.attribution||'@Omegatech'}_`
    }, { quoted: mek });

  }catch(e){
    console.error('Claude error', e.response?.data || e.message);
    reply(`❌ Claude failed: ${e.response?.data?.message || e.message}\nAPI: ${API}?action=chat&message=hi&needSearch=false`);
  }
});