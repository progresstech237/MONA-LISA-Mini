const { cmd } = require('../redx');
const { sendImage } = require('../lib/media');

cmd({
  pattern: "screenshot",
  alias: ["ss", "webshot", "sitepic"],
  react: "🖥️",
  category: "tools",
  desc: "Take full HD desktop screenshot of a website",
  filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
  try {
    if (!q) {
      return reply(
        "*🖥️ WEBSITE SCREENSHOT COMMAND*\n\n" +
        "Use is tarah:\n" +
        "*.screenshot <website URL>*\n\n" +
        "Example:\n" +
        "*.screenshot https://google.com*"
      );
    }

    const target = q.startsWith('http') ? q : `https://${q}`;
    const screenshotUrl = `https://image.thum.io/get/width/1280/crop/900/noanimate/${encodeURIComponent(target)}`;
    await sendImage(conn, from, {
      url: screenshotUrl,
      caption: `Screenshot of: ${target}`,
      quoted: mek,
    });

  } catch (err) {
    console.error("SCREENSHOT COMMAND ERROR:", err.message);
    reply("❌ Screenshot generate nahi hua / API busy");
  }
});
