const { cmd } = require('../redx');
const crypto = require('crypto');

cmd({
 pattern: "bikerace",
 alias: ["bike","moto","hillclimb","biker"],
 desc: "🏍️ Bike Race 100 Levels - Mona Lisa",
 category: "game",
 react: "🏍️",
 filename: __filename
}, async (conn, mek, m, { from, reply }) => {
try{

const html = `
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;-webkit-tap-highlight-color:transparent;user-select:none}
body{background:linear-gradient(165deg,#0a1a2a,#050a14);padding:8px;color:#c8e6ff}
#app{max-width:420px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;padding:4px 2px 8px}
.tt{font:900 17px 'Arial Black';color:#5ac8ff;text-shadow:0 0 12px #5ac8ff66}
.tt small{display:block;font:700 7px Arial;letter-spacing:2px;color:#6a8aaa}
.hrs{display:flex;gap:5px;align-items:center}
.hr{background:rgba(0,0,0,.5);border:1px solid rgba(90,200,255,.35);border-radius:9px;padding:3px 8px;text-align:center;min-width:48px}
.hr i{display:block;font:700 6px Arial;color:#6a8aaa}
.hr b{font:900 12px 'Arial Black';color:#5ac8ff}
.bar{height:8px;background:rgba(0,0,0,.5);border-radius:8px;overflow:hidden;border:1px solid rgba(90,200,255,.3);margin:4px 0 6px}
.barin{height:100%;background:linear-gradient(90deg,#5ac8ff,#9a6aff);width:0%;transition:width.2s}
.gw{position:relative;border:2px solid rgba(90,200,255,.4);border-radius:14px;overflow:hidden;background:#000;box-shadow:0 0 18px rgba(90,200,255,.2)}
canvas{width:100%;display:block;touch-action:none}
.pads{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px}
.pd{height:56px;border:2px solid rgba(255,255,255,.12);border-radius:14px;font:900 12px 'Arial Black';color:#fff;box-shadow:0 4px 0 rgba(0,0,0,.5)}
.pd:active{transform:translateY(3px);box-shadow:none;filter:brightness(1.3)}
#brake{background:linear-gradient(#ff6a3a,#a82a0a)}
#gas{background:linear-gradient(#5aff9a,#1a8a4a)}
#tilt{background:linear-gradient(#5ac8ff,#2a5aaa)}
.hint{text-align:center;font:700 8px Arial;color:#6a8aaa;margin-top:6px}
</style>
<div id="app">
<div class="hdr"><div class="tt">🏍️ BIKE RACE<small>MONA LISA • 100 LEVELS</small></div><div class="hrs"><div class="hr"><i>LEVEL</i><b id="lv">1/100</b></div><div class="hr"><i>TIME</i><b id="tm">0.0</b></div><div class="hr"><i>BEST</i><b id="bs">1</b></div><button class="mbtn" id="muteB" style="width:32px;height:32px;border:2px solid rgba(90,200,255,.35);border-radius:8px;background:rgba(0,0,0,.5);color:#fff">🔊</button></div></div>
<div class="bar"><div class="barin" id="barin"></div></div>
<div class="gw"><canvas id="cv" width="420" height="320"></canvas></div>
<div class="pads"><button class="pd" id="brake">◀ BRAKE</button><button class="pd" id="gas">GAS ▶</button><button class="pd" id="tilt">TILT ↻</button></div>
<div class="hint">🥰 Hold GAS to accelerate • BRAKE to balance • TILT to wheelie • Don't flip! 100 levels get harder 💀</div>
</div>
<script>
(function(){
var cv=document.getElementById('cv'),x=cv.getContext('2d'),W=420,H=320;
var DPR=2;cv.width=W*DPR;cv.height=H*DPR;
var lvEl=document.getElementById('lv'),tmEl=document.getElementById('tm'),bsEl=document.getElementById('bs'),bar=document.getElementById('barin');
var BEST=1;try{BEST=parseInt(localStorage.getItem('mona_bike_best')||'1')}catch(e){} bsEl.textContent=BEST;
function saveBest(l){try{localStorage.setItem('mona_bike_best',String(l))}catch(e){}}
var AC=null,MUTED=false;try{MUTED=localStorage.getItem('mona_bike_mute')==='1'}catch(e){}
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==='suspended')try{AC.resume()}catch(e){}return AC}
function tone(f,d,t,v){var a=AC;if(!a||MUTED)return;try{var n=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=t;o.frequency.setValueAtTime(f,n);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(a.destination);o.start(n);o.stop(n+d+.02)}catch(e){}}
function sGas(){if(!AC||MUTED)return;try{tone(80+Math.random()*30,0.08,'sawtooth',0.06)}catch(e){}}

var state='ready',level=1,frame=0,shake=0,time=0,overT=0;
var bike={x:100,y:100,vx:0,vy:0,rot:0,rotV:0,wheelRot:0,onGround:false};
var gas=false,brake=false,tilt=false;
var track=[],trackLen=0;

function genTrack(lv){
 track=[]; var len= 2000 + lv*120; trackLen=len;
 var difficulty= lv/100;
 var amp= 20 + lv*1.8;
 var freq= 0.008 + difficulty*0.006;
 var spikes= Math.floor(lv/8);
 for(var i=0;i<len;i+=8){
  var base= H*0.68;
  var h1= Math.sin(i*freq)*amp;
  var h2= Math.sin(i*freq*2.3+1.2)*amp*0.5;
  var h3= Math.sin(i*freq*0.5)*amp*0.3;
  var y= base + h1 + h2 + h3;
  // harder: add random bumps after level 20
  if(lv>20 && i%120<20) y-= (Math.random()*30)*difficulty;
  // gaps after level 40
  if(lv>40 && Math.random()<0.008*difficulty) { track.push({x:i,y:y,gap:true}); continue; }
  // steep climbs after 60
  if(lv>60) y+= Math.sin(i*0.002)*lv*0.6;
  track.push({x:i,y:y,gap:false});
 }
}

function getGround(xPos){
 if(xPos<0) return track[0]?.y||H*0.7;
 if(xPos>=trackLen) return track[track.length-1]?.y||H*0.7;
 var idx=Math.floor(xPos/8);
 if(idx>=track.length-1) return track[track.length-1].y;
 var a=track[idx], b=track[idx+1];
 if(a.gap || b.gap) return null;
 var t=(xPos - a.x)/8;
 return a.y + (b.y-a.y)*t;
}
function getSlope(xPos){
 var y1=getGround(xPos-6), y2=getGround(xPos+6);
 if(y1===null || y2===null) return 0;
 return Math.atan2(y2-y1, 12);
}

function reset(lv){
 level=lv||level;
 genTrack(level);
 bike={x:80,y:track[0].y-26,vx:0,vy:0,rot:0,rotV:0,wheelRot:0,onGround:true};
 time=0; frame=0;
 lvEl.textContent=level+'/100';
 bar.style.width=((level-1)/99*100)+'%';
}

function update(){
 frame++; time+=1/60; if(state==='play') tmEl.textContent=time.toFixed(1);
 if(shake>0) shake*=0.92;
 if(state!=='play') return;

 var acc=0;
 if(gas) acc+=0.32 + level*0.003;
 if(brake) acc-=0.28;
 bike.vx+=acc;
 bike.vx*=0.992;
 bike.vx=Math.max(-2, Math.min(9+level*0.04, bike.vx));

 var ground=getGround(bike.x+12);
 var slope=getSlope(bike.x+12);

 if(ground!==null){
  var targetY=ground-22;
  var dy=targetY-bike.y;
  if(dy> -10){
   bike.y+=dy*0.28;
   bike.vy=0;
   bike.onGround=true;
   bike.rot+= (slope - bike.rot)*0.14;
   if(tilt) bike.rotV+=0.08;
   if(brake) bike.rotV-=0.06;
  } else {
   bike.onGround=false;
  }
 } else {
  bike.onGround=false;
 }

 if(!bike.onGround){
  bike.vy+=0.48;
  bike.y+=bike.vy;
  bike.rotV+=0.015;
  if(tilt) bike.rotV+=0.06;
  if(bike.y>H+80){ // fall
   state='dead'; overT=performance.now(); shake=12; ac(); tone(100,0.5,'sawtooth',0.2);
  }
 }

 bike.rot+=bike.rotV;
 bike.rotV*=0.94;
 bike.rotV+= (slope - bike.rot)*0.02;

 bike.x+=bike.vx;
 bike.wheelRot+=bike.vx*0.5;

 // flip check
 if(Math.abs(bike.rot)>1.6){
  state='dead'; overT=performance.now(); shake=16; ac(); tone(80,0.6,'sawtooth',0.22);
 }

 // win
 if(bike.x>=trackLen-40){
  if(level>=100){
   state='win'; overT=performance.now();
   if(level>BEST){BEST=level; bsEl.textContent=BEST; saveBest(BEST);}
   bar.style.width='100%';
  } else {
   level++; if(level>BEST){BEST=level; saveBest(BEST); bsEl.textContent=BEST;}
   reset(level);
   // small celebration
   ac(); [523,659,784,1047].forEach((f,i)=>tone(f,0.12,'square',0.12,i*0.08));
  }
 }
}

function draw(){
 x.setTransform(DPR,0,0,DPR,0,0);
 if(shake>0) x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 // sky
 var g=x.createLinearGradient(0,0,0,H*0.7); g.addColorStop(0,'#1a4a8a'); g.addColorStop(1,'#a0d8ff'); x.fillStyle=g; x.fillRect(0,0,W,H);
 // sun
 x.fillStyle='#ffcc3a'; x.beginPath(); x.arc(360,48,22,0,7); x.fill();
 x.strokeStyle='rgba(255,204,58,.2)'; x.lineWidth=3; x.beginPath(); x.arc(360,48,32,0,7); x.stroke();
 // clouds
 x.fillStyle='rgba(255,255,255,.6)'; for(var ci=0;ci<3;ci++){ var cx=(ci*160 - bike.x*0.05)%(W+80); if(cx< -40) cx+=W+80; x.beginPath(); x.ellipse(cx, 38+ci*12, 28,10,0,0,7); x.fill(); }
 // track
 x.save();
 x.translate(-bike.x+100,0);
 x.fillStyle='#3a2a12'; x.beginPath(); x.moveTo(0,H);
 for(var i=0;i<track.length;i++){ if(!track[i].gap) x.lineTo(track[i].x, track[i].y); }
 x.lineTo(trackLen,H); x.lineTo(0,H); x.fill();
 x.strokeStyle='#ffcc3a'; x.lineWidth=3; x.beginPath(); for(var j=0;j<track.length;j++){ if(track[j].gap) continue; if(j===0) x.moveTo(track[j].x,track[j].y); else x.lineTo(track[j].x,track[j].y); } x.stroke();
 // checkpoints
 for(var c=0;c<=100;c+=10){ var cxp=c/100*trackLen; if(cxp>bike.x-120 && cxp<bike.x+W){ x.fillStyle=c<=level?'#5aff9a':'rgba(255,255,255,.2)'; x.fillRect(cxp,0,2,H); x.font='700 8px Arial'; x.fillText(c,cxp+4,12); } }
 // finish
 x.fillStyle='#fff'; x.fillRect(trackLen-20,0,20,H); x.fillStyle='#000'; for(var fy=0;fy<H;fy+=12){ for(var fx=0;fx<20;fx+=10){ if((Math.floor(fy/12)+Math.floor(fx/10))%2===0) x.fillRect(trackLen-20+fx,fy,10,12);} }
 x.restore();

 // bike
 var bx=100, by=bike.y;
 x.save(); x.translate(bx,by); x.rotate(bike.rot);
 // wheels
 x.fillStyle='#111'; x.beginPath(); x.arc(-10,12,11,0,7); x.arc(14,12,11,0,7); x.fill();
 x.strokeStyle='#5ac8ff'; x.lineWidth=2; x.beginPath(); x.arc(-10,12,7,0,7); x.arc(14,12,7,0,7); x.stroke();
 // frame
 x.strokeStyle='#ff4a2a'; x.lineWidth=3; x.beginPath(); x.moveTo(-10,12); x.lineTo(0,-4); x.lineTo(14,12); x.moveTo(0,-4); x.lineTo(-6,-8); x.stroke();
 // rider
 x.fillStyle='#ffcc9a'; x.beginPath(); x.arc(-2,-14,7,0,7); x.fill();
 x.fillStyle='#2a5aaa'; x.fillRect(-8,-6,12);
 x.fillStyle='#ff4a2a'; x.fillRect(-10,-16,14,4);
 if(gas){ x.fillStyle='rgba(255,120,40,.6)'; x.beginPath(); x.arc(-22,14,6+Math.random()*4,0,7); x.fill(); }
 x.restore();

 // HUD speed
 x.fillStyle='rgba(0,0,0,.55)'; x.beginPath(); x.roundRect(8,8,64,18,8); x.fill();
 x.fillStyle='#5ac8ff'; x.font='900 11px Arial'; x.fillText('SPD '+(bike.vx*8).toFixed(0)+' km/h',12,20);

 if(state==='ready'){
  x.fillStyle='rgba(0,10,20,.72)'; x.fillRect(0,0,W,H);
  x.textAlign='center';
  x.font='900 26px Arial Black'; x.lineWidth=5; x.strokeStyle='rgba(0,10,20,.9)'; x.strokeText('BIKE RACE',W/2,110);
  var gg=x.createLinearGradient(0,86,0,112); gg.addColorStop(0,'#a0e8ff'); gg.addColorStop(1,'#5ac8ff'); x.fillStyle=gg; x.fillText('BIKE RACE',W/2,110);
  x.font='700 11px Arial'; x.fillStyle='#8ac8ff'; x.fillText('🥰 MONA LISA • 100 LEVELS 👑',W/2,132);
  x.font='bold 10px Arial'; x.fillStyle='#c8e6ff'; x.fillText('LEVEL '+level+' / 100 — '+(level<20?'Easy':level<50?'Medium':level<80?'Hard':'INSANE 💀'),W/2,152);
  x.font='bold 12px monospace'; x.fillStyle='#5aff9a'; x.fillText('BEST: '+BEST+'/100',W/2,172);
  x.font='900 15px Arial'; x.fillStyle='rgba(255,255,255,'+(.55+.45*Math.sin(frame*.09))+')'; x.fillText('TAP GAS TO START 🏍️',W/2,210);
  x.font='700 9px Arial'; x.fillStyle='#6a8aaa'; x.fillText('Hold GAS, balance with BRAKE & TILT — Don\'t flip!',W/2,232);
  x.textAlign='left';
 }
 if(state==='dead'){
  x.fillStyle='rgba(0,10,20,.7)'; x.fillRect(0,0,W,H);
  x.fillStyle='rgba(10,20,35,.95)'; x.beginPath(); x.roundRect(42,96,336,150,16); x.fill(); x.strokeStyle='rgba(90,200,255,.4)'; x.lineWidth=2; x.stroke();
  x.textAlign='center'; x.font='900 24px Arial Black'; var dg=x.createLinearGradient(0,108,0,134); dg.addColorStop(0,'#ff8a8a'); dg.addColorStop(1,'#ff4a2e'); x.fillStyle=dg; x.fillText('CRASHED! 💥',W/2,132);
  x.font='bold 12px monospace'; x.fillStyle='#c8e6ff'; x.fillText('LEVEL '+level+' FAILED',W/2,158);
  x.font='bold 11px Arial'; x.fillStyle='#8ac8ff'; x.fillText('TIME '+time.toFixed(1)+'s',W/2,178);
  x.font='700 11px Arial'; x.fillStyle='rgba(255,255,255,'+(.5+.5*Math.sin(frame*.1))+')'; x.fillText('tap to retry ↻',W/2,208);
  x.textAlign='left';
 }
 if(state==='win'){
  x.fillStyle='rgba(0,20,40,.75)'; x.fillRect(0,0,W,H);
  x.textAlign='center'; x.font='900 28px Arial Black'; x.fillStyle='#5aff9a'; x.fillText('YOU BEAT 100 LEVELS! 👑',W/2,150);
  x.font='700 13px Arial'; x.fillStyle='#fff'; x.fillText('MONA LISA CHAMPION 🏆',W/2,180);
  x.font='bold 12px Arial'; x.fillStyle='#8ac8ff'; x.fillText('Time: '+time.toFixed(1)+'s',W/2,200);
  x.textAlign='left';
 }
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

reset(BEST);
state='ready';

function setGas(v){ gas=v; if(state==='ready' && v){ state='play'; ac(); } }
function setBrake(v){ brake=v; }
function setTilt(v){ tilt=v; }

var gasB=document.getElementById('gas'), brakeB=document.getElementById('brake'), tiltB=document.getElementById('tilt');
['pointerdown','touchstart'].forEach(ev=>{
 gasB.addEventListener(ev,function(e){e.preventDefault(); setGas(true); sGas();});
 brakeB.addEventListener(ev,function(e){e.preventDefault(); setBrake(true);});
 tiltB.addEventListener(ev,function(e){e.preventDefault(); setTilt(true);});
});
['pointerup','pointerleave','touchend','touchcancel'].forEach(ev=>{
 gasB.addEventListener(ev,function(){ setGas(false); });
 brakeB.addEventListener(ev,function(){ setBrake(false); });
 tiltB.addEventListener(ev,function(){ setTilt(false); });
});

cv.addEventListener('pointerdown',function(e){
 if(state==='dead' && performance.now()-overT>600){ reset(level); state='play'; return; }
 if(state==='win'){ reset(1); state='ready'; return; }
 if(state==='ready'){ state='play'; ac(); }
});

document.getElementById('muteB').addEventListener('pointerdown',function(e){
 e.preventDefault(); e.stopPropagation(); MUTED=!MUTED; this.textContent=MUTED?'🔇':'🔊'; try{localStorage.setItem('mona_bike_mute',MUTED?'1':'0')}catch(e2){} if(!MUTED) ac();
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
 console.error('[BikeRace] Error:', e.message);
 reply(`❌ Bike Error: ${e.message}`);
}
});