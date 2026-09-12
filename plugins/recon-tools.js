// 🔎 RECON & WEB SECURITY (passive) — Progress Tech
const { cmd } = require('../redx');
const axios = require('axios');
const dns = require('dns').promises;
const tls = require('tls');
const net = require('net');

function normalizeDomain(input){ return input.trim().replace(/^https?:\/\//i,'').replace(/\/.*$/,''); }
function normalizeUrl(input){ const t=input.trim(); return /^https?:\/\//i.test(t)? t : `https://${t}`; }
function fmtResult(r){ return r.status==='fulfilled'? r.value : null; }

// ── DNS ──
cmd({ pattern:"dns", desc:"Look up DNS records", category:"hacking tools", react:"🌐", filename:__filename },
async (conn, mek, m, { reply, q })=>{
  if(!q) return reply("🌐 *Usage:*.dns <domain>");
  const domain=normalizeDomain(q);
  try{
    const [a,aaaa,mx,ns,txt]=await Promise.allSettled([ dns.resolve4(domain), dns.resolve6(domain), dns.resolveMx(domain), dns.resolveNs(domain), dns.resolveTxt(domain) ]);
    const lines=[];
    if(fmtResult(a)) lines.push(`*A:* ${fmtResult(a).join(', ')}`);
    if(fmtResult(aaaa)) lines.push(`*AAAA:* ${fmtResult(aaaa).join(', ')}`);
    if(fmtResult(mx)) lines.push(`*MX:* ${fmtResult(mx).map(x=>x.exchange).join(', ')}`);
    if(fmtResult(ns)) lines.push(`*NS:* ${fmtResult(ns).join(', ')}`);
    if(fmtResult(txt)) lines.push(`*TXT:* ${fmtResult(txt).map(t=>t.join('')).slice(0,3).join(' | ')}`);
    reply(lines.length? `✅ *DNS ${domain}:*\n\n${lines.join('\n')}` : `❌ No DNS records found for ${domain}`);
  }catch(e){ reply(`❌ DNS lookup failed: ${e.message}`); }
});

// ── WHOIS ──
function whoisQuery(server,domain){
  return new Promise((resolve,reject)=>{
    const socket=net.createConnection(43,server);
    let data=''; socket.setTimeout(10000);
    socket.on('connect',()=> socket.write(domain+'\r\n'));
    socket.on('data',chunk=> data+=chunk);
    socket.on('end',()=> resolve(data));
    socket.on('timeout',()=>{ socket.destroy(); reject(new Error('WHOIS timeout')); });
    socket.on('error',reject);
  });
}
cmd({ pattern:"whois", desc:"WHOIS domain", category:"hacking tools", react:"📋", filename:__filename },
async (conn, mek, m, { reply, q })=>{
  if(!q) return reply("📋 *Usage:*.whois <domain>");
  const domain=normalizeDomain(q);
  try{
    const iana=await whoisQuery('whois.iana.org',domain);
    const ref=iana.match(/refer:\s*(\S+)/i);
    const server=ref? ref[1] : 'whois.iana.org';
    const raw=server!=='whois.iana.org'? await whoisQuery(server,domain) : iana;
    const trimmed=raw.split('\n').filter(l=> l.trim() &&!l.trim().startsWith('%') &&!l.trim().startsWith('#')).slice(0,25).join('\n');
    reply(`✅ *WHOIS ${domain}:*\n\n\`\`\`${trimmed}\`\`\``);
  }catch(e){ reply(`❌ WHOIS failed: ${e.message}`); }
});

// ── HTTP headers ──
cmd({ pattern:"headers", desc:"Fetch HTTP headers", category:"hacking tools", react:"📨", filename:__filename },
async (conn, mek, m, { reply, q })=>{
  if(!q) return reply("📨 *Usage:*.headers <url>");
  try{
    const res=await axios.get(normalizeUrl(q),{ timeout:15000, maxRedirects:5, validateStatus:()=>true });
    const lines=Object.entries(res.headers).map(([k,v])=> `*${k}:* ${v}`).join('\n');
    reply(`✅ *Headers ${normalizeUrl(q)}* (HTTP ${res.status}):\n\n${lines}`);
  }catch(e){ reply(`❌ Could not fetch headers: ${e.message}`); }
});

// ── Security headers ──
const SEC_HDR=['strict-transport-security','content-security-policy','x-frame-options','x-content-type-options','referrer-policy','permissions-policy'];
cmd({ pattern:"securityheaders", desc:"Check security headers", category:"tools", react:"🛡️", filename:__filename },
async (conn, mek, m, { reply, q })=>{
  if(!q) return reply("🛡️ *Usage:*.securityheaders <url>");
  try{
    const res=await axios.get(normalizeUrl(q),{ timeout:15000, maxRedirects:5, validateStatus:()=>true });
    const lines=SEC_HDR.map(h=> `${res.headers[h]? '✅' : '❌'} ${h}`);
    reply(`✅ *Security headers ${normalizeUrl(q)}:*\n\n${lines.join('\n')}`);
  }catch(e){ reply(`❌ Check failed: ${e.message}`); }
});

// ── Cookies ──
cmd({ pattern:"cookies", desc:"List cookies", category:"hacking tools", react:"🍪", filename:__filename },
async (conn, mek, m, { reply, q })=>{
  if(!q) return reply("🍪 *Usage:*.cookies <url>");
  try{
    const res=await axios.get(normalizeUrl(q),{ timeout:15000, maxRedirects:5, validateStatus:()=>true });
    const cookies=res.headers['set-cookie'];
    reply(cookies?.length? `✅ *Cookies from ${normalizeUrl(q)}:*\n\n${cookies.join('\n\n')}` : 'No cookies set on this response.');
  }catch(e){ reply(`❌ Check failed: ${e.message}`); }
});

// ── CORS ──
cmd({ pattern:"corscheck", desc:"Check CORS headers", category:"hacking tools", react:"🔀", filename:__filename },
async (conn, mek, m, { reply, q })=>{
  if(!q) return reply("🔀 *Usage:*.corscheck <url>");
  try{
    const res=await axios.get(normalizeUrl(q),{ timeout:15000, maxRedirects:5, validateStatus:()=>true, headers:{ Origin:'https://example.com' } });
    const acao=res.headers['access-control-allow-origin'];
    const acac=res.headers['access-control-allow-credentials'];
    reply(`✅ *CORS ${normalizeUrl(q)}:*\n\nACAO: ${acao||'(not set)'}\nACAC: ${acac||'(not set)'}${acao==='*'&&acac==='true'? '\n\n⚠️ Wildcard + credentials is misconfiguration.' : ''}`);
  }catch(e){ reply(`❌ Check failed: ${e.message}`); }
});

// ── Redirect chain ──
cmd({ pattern:"redirectcheck", desc:"Trace redirects", category:"hacking tools", react:"↪️", filename:__filename },
async (conn, mek, m, { reply, q })=>{
  if(!q) return reply("↪️ *Usage:*.redirectcheck <url>");
  try{
    const chain=[]; let url=normalizeUrl(q);
    for(let i=0;i<10;i++){
      const res=await axios.get(url,{ timeout:15000, maxRedirects:0, validateStatus:()=>true });
      chain.push(`${res.status} ${url}`);
      const loc=res.headers.location;
      if(!loc||res.status<300||res.status>=400) break;
      url=new URL(loc,url).toString();
    }
    reply(`✅ *Redirect chain:*\n\n${chain.join('\n↓\n')}`);
  }catch(e){ reply(`❌ Check failed: ${e.message}`); }
});

// ── TLS ──
cmd({ pattern:"sslcheck", alias:["tlsaudit"], desc:"TLS cert info", category:"progresstech tools", react:"🔒", filename:__filename },
async (conn, mek, m, { reply, q })=>{
  if(!q) return reply("🔒 *Usage:*.sslcheck <domain>");
  const domain=normalizeDomain(q);
  try{
    const cert=await new Promise((resolve,reject)=>{
      const socket=tls.connect(443,domain,{ servername:domain, timeout:10000 },()=>{
        const c=socket.getPeerCertificate(); socket.end(); resolve(c);
      });
      socket.on('error',reject);
      socket.on('timeout',()=>{ socket.destroy(); reject(new Error('Timeout')); });
    });
    if(!cert||!cert.subject) return reply('❌ Could not retrieve certificate.');
    const daysLeft=Math.round((new Date(cert.valid_to)-Date.now())/86400000);
    reply(`✅ *TLS ${domain}:*\n\nSubject: ${cert.subject?.CN||'N/A'}\nIssuer: ${cert.issuer?.O||cert.issuer?.CN||'N/A'}\nFrom: ${cert.valid_from}\nTo: ${cert.valid_to}\n${daysLeft<0? '⚠️ EXPIRED' : daysLeft<30? `⚠️ Expires in ${daysLeft}d` : `✅ ${daysLeft}d remaining`}`);
  }catch(e){ reply(`❌ TLS check failed: ${e.message}`); }
});

// ── robots.txt / sitemap.xml ──
cmd({ pattern:"robots", desc:"Fetch robots.txt", category:"hacking tools", react:"🤖", filename:__filename },
async (conn, mek, m, { reply, q })=>{
  if(!q) return reply("🤖 *Usage:*.robots <domain>");
  try{
    const res=await axios.get(`${normalizeUrl(q).replace(/\/$/,'')}/robots.txt`,{ timeout:15000, validateStatus:()=>true });
    reply(res.status===200? `✅ *robots.txt:*\n\n\`\`\`${res.data.slice(0,1500)}\`\`\`` : '❌ No robots.txt found.');
  }catch(e){ reply(`❌ Fetch failed: ${e.message}`); }
});

cmd({ pattern:"sitemap", desc:"Fetch sitemap.xml", category:"hacking tools", react:"🗺️", filename:__filename },
async (conn, mek, m, { reply, q })=>{
  if(!q) return reply("🗺️ *Usage:*.sitemap <domain>");
  try{
    const res=await axios.get(`${normalizeUrl(q).replace(/\/$/,'')}/sitemap.xml`,{ timeout:15000, validateStatus:()=>true });
    reply(res.status===200? `✅ *sitemap.xml:*\n\n\`\`\`${res.data.slice(0,1500)}\`\`\`` : '❌ No sitemap.xml found.');
  }catch(e){ reply(`❌ Fetch failed: ${e.message}`); }
});

// ── CVE ──
cmd({ pattern:"cve", alias:["cveinfo"], desc:"CVE lookup", category:"hacking tools", react:"🛡️", filename:__filename },
async (conn, mek, m, { reply, q })=>{
  if(!q||!/^CVE-\d{4}-\d+$/i.test(q.trim())) return reply("🛡️ *Usage:*.cve <CVE-ID>\nExample:.cve CVE-2021-44228");
  try{
    const res=await axios.get(`https://services.nvd.nist.gov/rest/json/cves/2.0?cveId=${q.trim().toUpperCase()}`,{ timeout:20000 });
    const vuln=res.data?.vulnerabilities?.[0]?.cve;
    if(!vuln) return reply(`❌ No data for ${q}.`);
    const desc=vuln.descriptions?.find(d=>d.lang==='en')?.value||'No description';
    const metrics=vuln.metrics?.cvssMetricV31?.[0]||vuln.metrics?.cvssMetricV30?.[0]||vuln.metrics?.cvssMetricV2?.[0];
    const score=metrics?.cvssData?.baseScore; const severity=metrics?.cvssData?.baseSeverity||metrics?.baseSeverity;
    reply(`🛡️ *${vuln.id}*\n\n${score? `📊 CVSS: ${score} (${severity})\n` : ''}📅 ${vuln.published?.split('T')[0]||'N/A'}\n\n${desc.slice(0,700)}\n\n🔗 https://nvd.nist.gov/vuln/detail/${vuln.id}`);
  }catch(e){ reply(`❌ CVE lookup failed: ${e.response?.status===404? 'not found' : e.message}`); }
});
