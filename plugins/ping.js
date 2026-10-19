const { cmd } = require('../redx');

cmd({
  pattern: "ping",
  desc: "Check bot response speed",
  category: "main",
  react: "👑",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const start = Date.now();
    const msg = await conn.sendMessage(from, { text: "*TESTING....*" }, { quoted: mek });
    const ping = Date.now() - start;
    await conn.sendMessage(from, {
      text: `*👑 SPEED :❯ ${ping}ms 👑*`,
      edit: msg.key
    });
  } catch (e) {
    console.error("Ping Error:", e);
    reply("*Ping failed — try again.*");
  }
});
