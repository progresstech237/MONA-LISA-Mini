const { cmd } = require('../redx');
const crypto = require('crypto');

cmd({
  pattern: "temple",
  alias: ["templerun","run","trun"],
  desc: "🏃‍♂️ Temple Run - Mona Lisa Edition",
  category: "game",
  react: "🏃‍♂️",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
try{

const html = `
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;-webkit-tap-highlight-color:transparent;user-select:none}
body{background:linear-gradient(165deg,#2a1a0a,#1a0f05 70%,#0a0500);padding:8px;color:#ffefc8}
#app{max-width:420px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;padding:4px 2px 8px}
.tt{font:900 18px 'Arial Black';color:#ffcc3a;text-shadow:0 0 14px #ffcc3a66}
.tt small{display:block;font:700 7px Arial;letter-spacing:2px;color:#a08a60}
.hrs{display:flex;gap:6px;align-items:center}
.hr{background:rgba(0,0,0,.55);border:1px solid rgba(255,204,58,.35);border-radius:10px;padding:4px 10px;text-align:center;min-width:52px}
.hr i{display:block;font:700 7px Arial;color:#a08a60}
.hr b{font:900 13px 'Arial Black';color:#ffcc3a}
.mbtn{width:34px;height:34px;border:2px solid rgba(255,204,58,.35);border-radius:10px;background:rgba(0,0,0,.55);color:#fff;font-size:15px}
.gw{position:relative;border:2px solid rgba(255,204,58,.45);border-radius:16px;overflow:hidden;background:#000;box-shadow:0 0 22px rgba(255,204,58,.2)}
canvas{width:100%;display:block;touch-action:none}
.pads{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px}
.pd{height:54px;border:2px solid rgba(255,255,255,.15);border-radius:14px;font:900 12px 'Arial Black';color:#fff;cursor:pointer;box-shadow:0 4px 0 rgba(0,0,0,.5)}
.pd:active{transform:translateY(3px);box-shadow:none}
#leftB{background:linear-gradient(#ff8a3a,#b84a0a)}
#jumpB{background:linear-gradient(#5ac8ff,#1a6ab8)}
#rightB{background:linear-gradient(#ff8a3a,#b84a0a)}
#slideB{grid-column:span 3;height:44px;background:linear-gradient(#9a6aff,#5a2ab8);font-size:11px}
.hint{text-align:center;font:700 9px Arial;color:#a08a60;margin-top:8px}
</style>
<div id="app">
<div class="hdr"><div class="tt">🏃 TEMPLE RUN<small>MONA LISA • MONSTER CHASE</small></div><div class="hrs"><div class="hr"><i>COINS</i><b id="cn">0</b></div><div class="hr"><i>DIST</i><b id="ds">0</b></div><div class="hr"><i>BEST</i><b id="bs">0</b></div><button class="mbtn" id="muteB">🔊</button></div></div>
<div class="gw"><canvas id="cv" width="404" height="380"></canvas></div>
<div class="pads"><button class="pd" id="leftB">◀ LEFT</button><button class="pd" id="jumpB">⤒ JUMP</button><button class="pd" id="rightB">RIGHT ▶</button><button class="pd" id="slideB">▼ SLIDE ▼ SWIPE DOWN</button></div>
<div class="hint">🥰 Swipe: Left/Right to change lane • Jump over gaps & fire • Slide under logs • Monster behind you! 🐒</div>
</div>
<script>
(function(){
var cv=document.getElementById('cv'),x=cv.getContext('2d'),W=404,H=380;
var DPR=2;cv.width=W*DPR;cv.height=H*DPR;
var cnEl=document.getElementById('cn'),dsEl=document.getElementById('ds'),bsEl=document.getElementById('bs');
var BEST=0;try{BEST=parseInt(localStorage.getItem('mona_temple_best')||'0')}catch(e){} bsEl.textContent=BEST;
function saveBest(v){try{localStorage.setItem('mona_temple_best',String(v))}catch(e){}}
var AC=null,MUTED=false;try{MUTED=localStorage.getItem('mona_temple_mute')==='1'}catch(e){}
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==='suspended')try{AC.resume()}catch(e){}return AC}
function tone(f,d,t,v,at,sl){var a=AC;if(!a||MUTED)return;try{var n=a.currentTime+(at||0),o=a.createOscillator(),g=a.createGain();o.type=t;o.frequency.setValueAtTime(f,n);if(sl)o.frequency.exponentialRampToValueAtTime(sl,n+d);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(a.destination);o.start(n);o.stop(n+d+.03)}catch(e){}}
function sJump(){tone(200,.1,'sine',.12,0,600)}
function sCoin(){tone(1200,.06,'sine',.12);tone(1800,.1,'sine',.1,.06)}
function sSlide(){tone(120,.25,'sawtooth',.1,0,40)}
function sHit(){tone(80,.4,'sawtooth',.22)}
function sDie(){[600,400,200,100].forEach((f,i)=>tone(f,.22,'sawtooth',.14,i*.12))}
var state='ready',coins=0,dist=0,speed=9,frame=0,shake=0,overT=0,bestNew=false;
var lane=1, targetLane=1, laneX=0, laneLerp=0, jumpV=0, y=0, grounded=true, sliding=false, slideT=0;
var ents=[],parts=[],pops=[],monsters=[],nextObs=60;

function reset(){
 coins=0; dist=0; speed=9; lane=1; targetLane=1; laneX=0; laneLerp=0; y=0; jumpV=0; grounded=true; sliding=false; slideT=0;
 ents=[]; parts=[]; pops=[]; monsters=[]; nextObs=60;
 cnEl.textContent='0'; dsEl.textContent='0';
 for(var i=0;i<6;i++) monsters.push({off: i*34+Math.random()*20});
}
function burst(px,py,c,n){for(var i=0;i<n;i++)parts.push({x:px,y:py,vx:(Math.random()-.5)*5,vy:-Math.random()*4,life:1,c:c,s:2+Math.random()*2})}
function popup(px,py,txt,c){pops.push({x:px,y:py,t:1,txt:txt,c:c})}

function spawnObs(){
 var typeRand=Math.random();
 var ln=Math.floor(Math.random()*3);
 if(typeRand<0.35) ents.push({t:'coin', lane:ln, z: 900, got:false});
 else if(typeRand<0.55) ents.push({t:'low', lane:ln, z: 900}); // slide
 else if(typeRand<0.75) ents.push({t:'high', lane:ln, z: 900}); // jump - fire
 else if(typeRand<0.88) ents.push({t:'gap', lane:ln, z: 900}); // jump
 else ents.push({t:'coin', lane:1, z: 900, got:false});
}

function update(){
 frame++; if(shake>0) shake*=0.9;
 for(var i=parts.length-1;i>=0;i--){var p=parts[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.18; p.life-=0.04; if(p.life<=0) parts.splice(i,1)}
 for(i=pops.length-1;i>=0;i--) if((pops[i].t-=0.04)<=0) pops.splice(i,1);
 if(state!=='play') return;
 dist+=speed*0.1; if(frame%5===0) dsEl.textContent=Math.floor(dist);
 speed+=0.003;
 if(!grounded){ jumpV+=0.7; y+=jumpV; if(y>=0){ y=0; jumpV=0; grounded=true; sliding=false; } }
 if(sliding){ slideT--; if(slideT<=0) sliding=false; }
 laneLerp+=(targetLane-laneLerp)*0.18; laneX=laneLerp;
 // ents
 nextObs-=speed; if(nextObs<=0){ spawnObs(); nextObs= 50+Math.random()*70; }
 for(var e=ents.length-1;e>=0;e--){
  var en=ents[e]; en.z-=speed;
  if(en.z< -40){ ents.splice(e,1); continue; }
  var near=en.z<60 && en.z> -10;
  if(near && en.lane===Math.round(laneLerp)){
   if(en.t==='coin' && !en.got){ en.got=true; coins++; cnEl.textContent=coins; burst(W/2, H/2, '#ffcc3a', 6); sCoin(); ents.splice(e,1); popup(W/2, 140, '+1','#ffcc3a'); }
   else if(en.t==='low'){ if(!sliding){ state='dead'; overT=performance.now(); shake=14; sHit(); sDie(); if(dist>BEST){BEST=Math.floor(dist); bsEl.textContent=BEST; saveBest(BEST); bestNew=true} } else { popup(W/2, 160, 'SLIDE!','#9a6aff'); ents.splice(e,1);} }
   else if(en.t==='high' || en.t==='gap'){ if(grounded){ state='dead'; overT=performance.now(); shake=14; sHit(); sDie(); if(dist>BEST){BEST=Math.floor(dist); bsEl.textContent=BEST; saveBest(BEST); bestNew=true} } else { ents.splice(e,1); popup(W/2, 160, 'JUMP!','#5ac8ff'); } }
  }
 }
}

function draw3D(z){
 var scale= 200/(200+z);
 var yy= H*0.55 + (H*0.9 - H*0.55)*(1-scale);
 return {s:scale, y:yy};
}

function draw(){
 x.setTransform(DPR,0,0,DPR,0,0);
 if(shake>0) x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 // sky
 var sg=x.createLinearGradient(0,0,0,H*0.6); sg.addColorStop(0,'#5ac8ff'); sg.addColorStop(0.6,'#a0d8ff'); sg.addColorStop(1,'#ffe8a0'); x.fillStyle=sg; x.fillRect(0,0,W,H*0.6);
 // jungle bg
 x.fillStyle='#1a3a0a'; x.beginPath(); x.moveTo(0,H*0.6); for(var i=0;i<=W;i+=16) x.lineTo(i, H*0.6 - Math.sin(i*0.02+frame*0.01)*18 -10); x.lineTo(W,H*0.6); x.fill();
 // ground perspective
 x.fillStyle='#4a2a0a'; x.fillRect(0,H*0.55,W,H*0.45);
 // lanes
 for(var l=0;l<=3;l++){
  var xl= (W/2) + (l-1.5)*W*0.35*0.2;
  var xr= (W/2) + (l-1.5)*W*1.2;
  x.strokeStyle='rgba(255,204,58,.18)'; x.lineWidth=2; x.beginPath(); x.moveTo(W/2 + (l-1.5)*10, H*0.55); x.lineTo(xr, H); x.stroke();
 }
 // lane markers
 x.strokeStyle='rgba(255,255,255,.12)'; x.setLineDash([14,14]); x.lineDashOffset=-frame*0.8*speed;
 for(var ll=1;ll<3;ll++){
  x.beginPath(); x.moveTo(W/2 + (ll-1.5)*W*0.05, H*0.55); x.lineTo(W/2 + (ll-1.5)*W*0.5, H); x.stroke();
 }
 x.setLineDash([]);

 // obstacles
 var sorted=[...ents].sort((a,b)=>b.z-a.z);
 sorted.forEach(function(en){
  if(en.z<0 || en.z>900) return;
  var p=draw3D(en.z);
  var cx= W/2 + (en.lane-1)*W*0.32*p.s + laneX*W*0.02;
  var size= 44*p.s;
  if(en.t==='coin'){
   if(en.got) return;
   var bob=Math.sin(frame*0.12+en.z)*6*p.s;
   x.fillStyle='rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(cx, p.y+size*0.3, size*0.5, size*0.18,0,0,7); x.fill();
   var cg=x.createRadialGradient(cx-4*p.s, p.y-8*p.s+bob, 2, cx, p.y+bob, size*0.5); cg.addColorStop(0,'#fffde0'); cg.addColorStop(0.35,'#ffcc3a'); cg.addColorStop(1,'#b86a00'); x.fillStyle=cg; x.beginPath(); x.arc(cx, p.y+bob, size*0.42,0,7); x.fill();
   x.strokeStyle='#7a4a00'; x.lineWidth=2*p.s; x.stroke();
   x.fillStyle='#fff'; x.font='900 '+(12*p.s)+'px Arial'; x.textAlign='center'; x.fillText('$',cx,p.y+bob+4*p.s); x.textAlign='left';
  } else if(en.t==='low'){
   x.fillStyle='#3a1a00'; x.fillRect(cx-size*0.9, p.y-size*0.2, size*1.8, size*0.45);
   x.fillStyle='#7a4a2a'; x.fillRect(cx-size*0.9, p.y-size*0.35, size*1.8, size*0.22);
   x.fillStyle='#9a6aff'; x.fillRect(cx-size*0.8, p.y-size*0.35, size*1.6, 5*p.s);
  } else if(en.t==='high'){
   x.fillStyle='#ff4a1a'; x.beginPath(); x.moveTo(cx, p.y-size); x.lineTo(cx-size*0.5, p.y); x.lineTo(cx+size*0.5, p.y); x.closePath(); x.fill();
   x.fillStyle='#ffcc3a'; for(var f=0;f<3;f++){ x.fillRect(cx-size*0.4+Math.random()*size*0.6, p.y-size*0.7, 3*p.s, 8*p.s); }
  } else if(en.t==='gap'){
   x.fillStyle='#000'; x.fillRect(cx-size, p.y-4*p.s, size*2, 12*p.s);
   x.strokeStyle='#ff4a2e'; x.lineWidth=2; x.strokeRect(cx-size, p.y-4*p.s, size*2, 12*p.s);
  }
 });

 // runner
 var runX= W/2 + laneX*W*0.32*0.78;
 var runY= H*0.78 + y;
 var sRun= sliding?0.75:1;
 var runBob= grounded && !sliding ? Math.abs(Math.sin(frame*0.28))*4 : 0;
 x.save(); x.translate(runX, runY-runBob);
 x.scale(sRun, sRun);
 // shadow
 x.fillStyle='rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(0, 24, 18,6,0,0,7); x.fill();
 // body
 if(sliding){
  x.fillStyle='#2a6ab8'; x.fillRect(-12, 8, 24, 10);
  x.fillStyle='#ffcc9a'; x.fillRect(-14, 10, 8, 8);
 } else {
  var legSwing=Math.sin(frame*0.32)*10;
  x.fillStyle='#2a4a8a'; x.fillRect(-5+legSwing*0.3, 10, 6, 14); x.fillRect(2-legSwing*0.3, 10, 6, 14);
  x.fillStyle='#ffcc9a'; x.fillRect(-8, -2, 16, 16);
  x.fillStyle='#1a1a1a'; x.fillRect(-9, -12, 18, 10);
  x.fillStyle='#ffcc3a'; x.fillRect(-10, -14, 20, 4);
 }
 x.restore();

 // monster behind
 var mY=H*0.72;
 for(var m=0;m<monsters.length;m++){
  var mo=monsters[m];
  var mx= W*0.15 + (m%3)*W*0.35 + Math.sin(frame*0.05+mo.off)*10 + laneX*5;
  var my= mY + (m*8) + Math.sin(frame*0.08+mo.off)*3;
  x.save(); x.translate(mx, my);
  x.fillStyle='#2a1a0a'; x.beginPath(); x.arc(0,0, 18+ (m%2)*4,0,7); x.fill();
  x.fillStyle='#ff4a2e'; x.beginPath(); x.arc(-4,-4,3,0,7); x.arc(4,-4,3,0,7); x.fill();
  x.restore();
 }
 x.fillStyle='rgba(0,0,0,.45)'; x.fillRect(0, H*0.62, W, 22);
 x.fillStyle='#ff4a2e'; x.font='900 10px Arial'; x.textAlign='center'; x.fillText('🐒 MONSTER BEHIND! RUN! 🐒', W/2, H*0.62+14); x.textAlign='left';

 // particles
 parts.forEach(function(p){ x.globalAlpha=Math.max(p.life,0); x.fillStyle=p.c; x.fillRect(p.x,p.y,p.s,p.s); }); x.globalAlpha=1;
 pops.forEach(function(pp){ x.globalAlpha=Math.max(pp.t,0); x.font='900 13px Arial'; x.textAlign='center'; x.lineWidth=3; x.strokeStyle='rgba(0,0,0,.7)'; x.strokeText(pp.txt,pp.x,pp.y-(1-pp.t)*26); x.fillStyle=pp.c; x.fillText(pp.txt,pp.x,pp.y-(1-pp.t)*26); }); x.globalAlpha=1; x.textAlign='left';

 if(state==='ready'){
  x.fillStyle='rgba(10,5,0,.65)'; x.fillRect(0,0,W,H);
  x.textAlign='center';
  x.font='900 30px Arial Black'; x.lineWidth=6; x.strokeStyle='rgba(20,10,0,.9)'; x.strokeText('TEMPLE RUN',W/2,150);
  var gg=x.createLinearGradient(0,124,0,156); gg.addColorStop(0,'#ffef9a'); gg.addColorStop(1,'#ffcc3a'); x.fillStyle=gg; x.fillText('TEMPLE RUN',W/2,150);
  x.font='700 11px Arial'; x.fillStyle='#c8b080'; x.fillText('🥰 MONA LISA • MONSTER CHASE 👑',W/2,174);
  if(BEST>0){ x.font='bold 12px monospace'; x.fillStyle='#ffcc3a'; x.fillText('BEST DIST: '+BEST+'m',W/2,200); }
  x.font='900 15px Arial'; x.fillStyle='rgba(255,255,255,'+(.55+.45*Math.sin(frame*.09))+')'; x.fillText('TAP TO RUN 🏃‍♂️',W/2,242);
  x.font='700 9px Arial'; x.fillStyle='#a08a60'; x.fillText('Jump fire 🔥 • Slide logs 🪵 • Collect coins 🪙 • Don\'t get caught! 🐒',W/2,266);
  x.textAlign='left';
 }
 if(state==='dead'){
  x.fillStyle='rgba(10,5,0,.65)'; x.fillRect(0,0,W,H);
  x.fillStyle='rgba(30,15,5,.95)'; x.beginPath(); x.roundRect(42,124,320,150,16); x.fill(); x.strokeStyle='rgba(255,204,58,.45)'; x.lineWidth=2; x.stroke();
  x.textAlign='center'; x.font='900 26px Arial Black'; var dg=x.createLinearGradient(0,138,0,166); dg.addColorStop(0,'#ff8a8a'); dg.addColorStop(1,'#ff4a2e'); x.fillStyle=dg; x.fillText('CAUGHT! 🐒',W/2,160);
  x.font='bold 13px monospace'; x.fillStyle='#ffefc8'; x.fillText('DIST '+Math.floor(dist)+'m • COINS '+coins,W/2,186);
  if(bestNew){ x.fillStyle='rgba(255,204,58,'+(.6+.4*Math.sin(frame*.2))+')'; x.font='900 13px Arial'; x.fillText('★ NEW BEST: '+BEST+'m 👑 ★',W/2,212); } else { x.fillStyle='#c8b080'; x.font='bold 12px monospace'; x.fillText('BEST: '+BEST+'m',W/2,212); }
  x.font='700 11px Arial'; x.fillStyle='rgba(255,255,255,'+(.5+.5*Math.sin(frame*.1))+')'; x.fillText('tap to run again 🏃‍♂️',W/2,238);
  x.textAlign='left';
 }
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

function moveLane(dir){
 if(state!=='play') return;
 targetLane=Math.max(0, Math.min(2, targetLane+dir));
 tone(400,.06,'square',.1);
}
function doJump(){ ac(); if(state==='ready'){state='play';reset();return} if(state==='dead'){if(performance.now()-overT>600){state='play';reset()}return} if(grounded){ jumpV=-12; grounded=false; sJump(); } }
function doSlide(){ ac(); if(!grounded) return; if(!sliding){ sliding=true; slideT=32; sSlide(); } }

var sx=0,sy=0;
cv.addEventListener('pointerdown',function(e){
 var r=cv.getBoundingClientRect(); sx=(e.clientX-r.left); sy=(e.clientY-r.top);
});
cv.addEventListener('pointerup',function(e){
 var r=cv.getBoundingClientRect(); var ex=e.clientX-r.left, ey=e.clientY-r.top;
 var dx=ex-sx, dy=ey-sy;
 if(Math.abs(dx)>30 && Math.abs(dx)>Math.abs(dy)){ moveLane(dx>0?1:-1); }
 else if(dy>40){ doSlide(); }
 else if(dy<-30){ doJump(); }
 else { if(ex<r.width/3) moveLane(-1); else if(ex>r.width*2/3) moveLane(1); else doJump(); }
});

document.getElementById('leftB').addEventListener('pointerdown',function(e){e.preventDefault(); ac(); if(state==='ready'){state='play';reset();return} moveLane(-1);});
document.getElementById('rightB').addEventListener('pointerdown',function(e){e.preventDefault(); ac(); if(state==='ready'){state='play';reset();return} moveLane(1);});
document.getElementById('jumpB').addEventListener('pointerdown',function(e){e.preventDefault(); doJump();});
document.getElementById('slideB').addEventListener('pointerdown',function(e){e.preventDefault(); doSlide();});

document.getElementById('muteB').addEventListener('pointerdown',function(e){
 e.preventDefault(); e.stopPropagation(); MUTED=!MUTED; this.textContent=MUTED?'🔇':'🔊'; try{localStorage.setItem('mona_temple_mute',MUTED?'1':'0')}catch(e2){} if(!MUTED) ac();
});
if(MUTED) document.getElementById('muteB').textContent='🔇';
})();
</script>`;

const gameData = {
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
    },
    contextInfo: { isForwarded: true, forwardOrigin: 4 }
   }
  }
 }
};

const { generateWAMessageFromContent } = require('@whiskeysockets/baileys');
const waMsg = await generateWAMessageFromContent(from, gameData, {});
await conn.relayMessage(from, waMsg.message, { messageId: waMsg.key.id });

}catch(e){
 console.error('[Temple] Error:', e.message);
 reply(`❌ Temple Error: ${e.message}`);
}
});
