const { cmd } = require('../../redx');

cmd({
  pattern: "sonic",
  alias: ["game", "speedydash", "speedy", "dash"],
  react: "🦔",
  desc: "Speedy Dash Game - Fixed Render",
  category: "game",
  filename: __filename
}, async (conn, mek, m, { from, reply, sender }) => {
  try {
    global.sonicLimit = global.sonicLimit || {};
    const now = Date.now();
    if (global.sonicLimit[sender] && now - global.sonicLimit[sender] < 30000) {
      return reply(`⏳ Wait ${Math.ceil((30000 - (now - global.sonicLimit[sender]))/1000)}s`);
    }
    global.sonicLimit[sender] = now;

    const html = `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1"><style>
*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;-webkit-tap-highlight-color:transparent;user-select:none}
body{background:linear-gradient(165deg,#071538,#040a1e 60%,#02061a);padding:8px;color:#eaf2ff}
#app{max-width:420px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;padding:2px 2px 7px}
.tt{font:900 18px 'Arial Black';color:#ffd700;text-shadow:0 0 12px #ffd70066}
.hrs{display:flex;gap:6px}
.hr{background:rgba(0,0,0,.42);border:1px solid rgba(255,215,0,.3);border-radius:9px;padding:3px 9px;text-align:center;min-width:52px}
.hr i{display:block;font:700 7px Arial;font-style:normal;color:#7a9cc8}
.hr b{font:900 13px 'Arial Black';color:#ffd75e}
.mbtn{width:34px;height:34px;border:2px solid rgba(255,215,0,.3);border-radius:9px;background:rgba(0,0,0,.42);color:#fff;font-size:15px}
.gw{position:relative;border:2px solid rgba(255,215,0,.3);border-radius:14px;overflow:hidden;background:#000}
canvas{width:100%;display:block;touch-action:none}
.pads{display:grid;grid-template-columns:1fr 1.3fr;gap:10px;margin-top:8px}
.pd{height:52px;border:2px solid rgba(255,255,255,.18);border-radius:14px;font:900 14px 'Arial Black';color:#fff}
#boostB{background:linear-gradient(#ffd75e,#e09406 60%,#7a5205);color:#3a2805}
#jumpB{background:linear-gradient(#58c7ff,#1f7fd6 60%,#0a3a6e)}
</style></head><body>
<div id="app">
<div class="hdr"><div class="tt">🦔 SPEEDY DASH</div><div class="hrs"><div class="hr"><i>RINGS</i><b id="rg">0</b></div><div class="hr"><i>SCORE</i><b id="sc">0</b></div><div class="hr"><i>BEST</i><b id="bs">0</b></div><button class="mbtn" id="muteB">🔊</button></div></div>
<div class="gw"><canvas id="cv" width="404" height="300"></canvas></div>
<div class="pads"><button class="pd" id="boostB">⚡ BOOST</button><button class="pd" id="jumpB">⤒ JUMP</button></div>
</div>
<script>
(function(){
var cv=document.getElementById('cv'),x=cv.getContext('2d'),W=404,H=300;cv.width=808;cv.height=600;
var rgEl=document.getElementById('rg'),scEl=document.getElementById('sc'),bsEl=document.getElementById('bs');
var BEST=0;try{BEST=parseInt(localStorage.getItem('dash_best')||'0')||0}catch(e){} bsEl.textContent=BEST;
var AC=null,MUTED=false;function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==='suspended')AC.resume();return AC}
function tone(f,d,t,v){var a=AC;if(!a||MUTED)return;try{var n=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=t;o.frequency.value=f;g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(a.destination);o.start(n);o.stop(n+d)}catch(e){}}
var state='ready',score=0,rings=0,best=BEST,boost=0,boostOn=false,camX=0,speed=6.2,frame=0,CY=200,CX=120,vy=0,grounded=true,rot=0,overT=0,ents=[],parts=[],shake=0,laser=null,laserCd=520,boss=null,bossWarnT=0,bossNext=50;
function gy(wx){return 242-(Math.sin(wx*0.0045)*13+Math.sin(wx*0.012)*5)}
var nextRing=200,nextFoe=600;
function reset(){score=0;rings=0;boost=0;boostOn=false;speed=6.2;camX=0;CY=gy(120)-16;vy=0;grounded=true;ents=[];parts=[];laser=null;boss=null;bossWarnT=0;bossNext=50;laserCd=520;rgEl.textContent='0';scEl.textContent='0';nextRing=200;nextFoe=600;}
function jump(){ac();if(state==='ready'){state='play';reset();return}if(state==='dead'&&Date.now()-overT>800){state='play';reset();return}if(grounded){vy=-13.2;grounded=false;tone(260,.12,'sine',.13)}}
function doBoost(){ac();if(state!=='play')return;if(!boostOn&&boost>=25){boostOn=true;boost=0}}
document.getElementById('jumpB').onclick=jump;document.getElementById('boostB').onclick=doBoost;
document.addEventListener('touchstart',function(e){if(e.target.closest('.pads,.mbtn'))return;e.preventDefault();if(e.touches[0].clientX<innerWidth/2)doBoost();else jump()},{passive:false});
function spawn(){var wx=camX+W+40;while(nextRing<wx){ents.push({t:'ring',x:nextRing,y:-30,got:false});nextRing+=120+Math.random()*100}if(!boss&&nextFoe<wx){ents.push({t:'foe',x:nextFoe});nextFoe+=400+Math.random()*300}ents=ents.filter(e=>e.x>camX-80)}
function update(){frame++;if(state!=='play')return;camX+=speed+(boostOn?4.5:0);score+=1;if(frame%6===0)scEl.textContent=score;if(boostOn&&frame%10===0){boost+=2;if(boost>100){boostOn=false;boost=0}}spawn();for(var j=ents.length-1;j>=0;j--){var e=ents[j],sx=e.x-camX;if(e.t==='ring'&&!e.got){var ey=gy(e.x)+e.y;if(Math.abs(sx-CX)<20&&Math.abs(ey-CY)<20){e.got=true;rings++;rgEl.textContent=rings;score+=10;boost=Math.min(100,boost+7);tone(988,.1,'sine',.2)}}else if(e.t==='foe'){var fy=gy(e.x);if(Math.abs(sx-CX)<20&&Math.abs(fy-CY)<20){if(boostOn){ents.splice(j,1);score+=100}else{if(rings>0){rings=Math.floor(rings*0.9);rgEl.textContent=rings}else{state='dead';overT=Date.now();if(score>best){best=score;bsEl.textContent=best;try{localStorage.setItem('dash_best',best)}catch(e){}}}}}}}
function draw(){x.setTransform(2,0,0,2,0,0);x.fillStyle='#1f5fc4';x.fillRect(0,0,W,H);x.fillStyle='#8a5a2b';x.beginPath();x.moveTo(0,H);for(var px=0;px<=W;px+=8)x.lineTo(px,gy(px+camX));x.lineTo(W,H);x.fill();ents.forEach(e=>{var sx=e.x-camX;if(e.t==='ring'&&!e.got){x.strokeStyle='#ffd75e';x.lineWidth=3;x.beginPath();x.ellipse(sx,gy(e.x)+e.y,8,10,0,0,7);x.stroke()}else if(e.t==='foe'){x.fillStyle='#d62a2a';x.beginPath();x.arc(sx,gy(e.x),10,0,7);x.fill()}});x.fillStyle='#58c7ff';x.beginPath();x.arc(CX,CY,12,0,7);x.fill();x.fillStyle='#fff';x.font='bold 8px monospace';x.fillText('SPD '+(speed+(boostOn?4.5:0)).toFixed(1),W-50,20);for(var s=0;s<10;s++){x.fillStyle=s<boost/10?'#ffd75e':'rgba(90,130,180,.25)';x.fillRect(10+s*10,10,8,7)}if(state==='ready'){x.fillStyle='rgba(2,8,26,.7)';x.fillRect(0,0,W,H);x.textAlign='center';x.fillStyle='#58c7ff';x.font='900 20px Arial';x.fillText('SPEEDY DASH',W/2,120);x.fillStyle='#fff';x.font='14px Arial';x.fillText('TAP TO START',W/2,160);x.textAlign='left'}if(state==='dead'){x.fillStyle='rgba(2,8,26,.7)';x.fillRect(0,0,W,H);x.textAlign='center';x.fillStyle='#ff8aa0';x.font='900 20px Arial';x.fillText('GAME OVER',W/2,120);x.fillStyle='#fff';x.font='12px monospace';x.fillText('SCORE '+score+' RINGS '+rings,W/2,145);x.fillText('tap to retry',W/2,165);x.textAlign='left'}}
function loop(){update();draw();requestAnimationFrame(loop)}loop();
})();
<\/script></body></html>`;

    // METHOD 1 - NEW BETA METHOD
    try {
      const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
      const crypto = require('crypto');
      const msg = await generateWAMessageFromContent(from, {
        botForwardedMessage: {
          message: {
            richResponseMessage: {
              messageType: 1,
              unifiedResponse: {
                data: Buffer.from(JSON.stringify({
                  __typename: "GenAIUnifiedResponse",
                  response_id: crypto.randomUUID(),
                  sections: [{ __typename: "GenAIUnifiedResponseSection", view_model: { __typename: "GenAISingleLayoutViewModel", primitive: { __typename: "FOAHtmlPrimitiveDemoDONOTUSE", trusted_sources: [], payload: html } } }]
                })).toString("base64")
              }
            }
          }
        }
      }, {});
      await conn.relayMessage(from, msg.message, { messageId: msg.key.id });
      return;
    } catch (e1) {
      console.log('Method1 fail', e1.message);
    }

    // METHOD 2 - OLD WORKING METHOD (viewOnce + interactive)
    try {
      const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
      const msg2 = await generateWAMessageFromContent(from, {
        viewOnceMessage: {
          message: {
            interactiveMessage: {
              header: { title: "🦔 SPEEDY DASH - BATMAN EDITION", hasMediaAttachment: false },
              body: { text: "Tap PLAY to start\nRings: 0 | Best: 0\n\n⚡ BOOST when bar full\n⤒ JUMP to dodge" },
              footer: { text: "MONA LISA - Sonic Game" },
              nativeFlowMessage: {
                buttons: [{ name: "quick_reply", buttonParamsJson: JSON.stringify({ display_text: "🎮 PLAY NOW", id: "play_sonic" }) }],
                messageParamsJson: ""
              }
            }
          }
        }
      }, {});
      // send html as second msg
      await conn.relayMessage(from, msg2.message, { messageId: msg2.key.id });

      // Then send actual game html primitive with different wrapper
      const msgHtml = await generateWAMessageFromContent(from, {
        ephemeralMessage: {
          message: {
            extendedTextMessage: {
              text: "🦔 *SPEEDY DASH LOADING...*",
              contextInfo: { isForwarded: true }
            }
          }
        }
      }, {});
      await conn.relayMessage(from, msgHtml.message, { messageId: msgHtml.key.id });

      // Final try - send as bot doc with html
      await conn.sendMessage(from, {
        text: html
      }, { quoted: mek });

    } catch (e2) {
      console.log('Method2 fail', e2.message);
      // METHOD 3 - SIMPLE FALLBACK
      await conn.sendMessage(from, { text: `*🦔 SPEEDY DASH - FALLBACK*\n\nYour WhatsApp version doesn't support canvas games.\n\n*But game code is OK:*\n${html.slice(0,1000)}...\n\n*FIX:*\n1. Update WhatsApp to beta\n2. Update Baileys: npm i @whiskeysockets/baileys@latest\n3. Try.sonic again\n\nError: ${e2.message}` }, { quoted: mek });
    }

  } catch (e) {
    console.error('[Sonic] Error:', e);
    await reply(`❌ Sonic Error: ${e.message}\n${e.stack?.slice(0,500)}`);
  }
});
