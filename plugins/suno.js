const { cmd } = require('../redx');

cmd({
  pattern: "sonu2", alias: ["sonupro","musicai","genmusic"], react:"🎵",
  desc:"Sonu Pro alias - use sonu4", category:"progressrech ai",
  use:".sonu2 afrobeat love | Mona Lisa",
  filename:__filename
}, async (conn, mek, m, { from, q, reply, prefix }) => {
  // Redirect to sonu4 handler - avoids duplicate API code
  if(!q) return reply(`Use: ${prefix}sonu4 afrobeat | Mona Lisa lyrics\n\n${prefix}sonu2 is alias of sonu4`);
  // Trigger sonu4
  mek.message.conversation = `${prefix}sonu4 ${q}`;
  // Re-emit via redx - or just tell user
  return reply(`*Redirecting to sonu4...*\n\n${prefix}sonu4 ${q}\n\n_Using sonu4 engine (3min support)_`);
});
