const { cmd } = require('../redx');
const crypto = require('crypto');

cmd({
  pattern: "zuma",
  alias: ["zumadeluxe","zuma2"],
  desc: "🐸 Zuma Deluxe - Mona Lisa Edition",
  category: "game",
  react: "🐸",
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
try{

const html = `
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;-webkit-tap-highlight-color:transparent;user-select:none}
body{background:linear-gradient(165deg,#1a4a2e,#0a1a12 65%,#020a08);padding:8px;color:#eafff0}
#app{max-width:420px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;padding:4px 2px 8px}
.tt{font:900 19px 'Arial Black';color:#5aff9a;text-shadow:0 0 14px #5aff9a66}
.tt small{display:block;font:700 7px Arial;letter-spacing:2px;color:#7ac8a0;margin-top:2px}
.hrs{display:flex;gap:6px;align-items:center}
.hr{background:rgba(0,0,0,.5);border:1px solid rgba(90,255,154,.35);border-radius:10px;padding:4px 10px;text-align:center;min-width:56px}
.hr i{display:block;font:700 7px Arial;color:#7ac8a0}
.hr b{font:900 13px 'Arial Black';color:#5aff9a}
.mbtn{width:34px;height:34px;border:2px solid rgba(90,255,154,.35);border-radius:10px;background:rgba(0,0,0,.5);color:#fff;font-size:15px}
.gw{position:relative;border:2px solid rgba(90,255,154,.4);border-radius:16px;overflow:hidden;background:#000;box-shadow:0 0 22px rgba(90,255,154,.2)}
canvas{width:100%;display:block;touch-action:none}
.hint{text-align:center;font:700 9px Arial;color:#7ac8a0;margin-top:8px}
</style>
<div id="app">
<div class="hdr"><div class="tt">🐸 ZUMA<small>MONA LISA • DELUXE</small></div><div class="hrs"><div class="hr"><i>SCORE</i><b id="sc">0</b></div><div class="hr"><i>LEVEL</i><b id="lv">1</b></div><div class="hr"><i>BEST</i><b id="bs">0</b></div><button class="mbtn" id="muteB">🔊</button></div></div>
<div class="gw"><canvas id="cv" width="404" height="404"></canvas></div>
<div class="hint">🥰 TAP to shoot • Match 3 same colors • Don't let chain reach skull! 💀</div>
</div>
<script>
(function(){
var cv=document.getElementById('cv'),x=cv.getContext('2d'),W=404,H=404;
var DPR=2;cv.width=W*DPR;cv.height=H*DPR;
var scEl=document.getElementById('sc'),lvEl=document.getElementById('lv'),bsEl=document.getElementById('bs');
var BEST=0;try{BEST=parseInt(localStorage.getItem('mona_zuma_best')||'0')}catch(e){} bsEl.textContent=BEST;
function saveBest(v){try{localStorage.setItem('mona_zuma_best',String(v))}catch(e){}}

var AC=null,MUTED=false; try{MUTED=localStorage.getItem('mona_zuma_mute')==='1'}catch(e){}
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==='suspended')try{AC.resume()}catch(e){}return AC}
function tone(f,d,t,v,at,sl){var a=AC;if(!a||MUTED)return;try{var n=a.currentTime+(at||0),o=a.createOscillator(),g=a.createGain();o.type=t;o.frequency.setValueAtTime(f,n);if(sl)o.frequency.exponentialRampToValueAtTime(sl,n+d);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(a.destination);o.start(n);o.stop(n+d+.03)}catch(e){}}
function sShoot(){tone(300,.08,'square',.14,0,900)}
function sPop(){tone(520,.1,'sawtooth',.16,0,100);tone(880,.08,'square',.1,.05)}
function sCombo(n){[659,784,1047,1319].slice(0,n).forEach((f,i)=>tone(f,.12,'square',.12,i*.07))}
function sDie(){[440,330,220,110].forEach((f,i)=>tone(f,.3,'sawtooth',.15,i*.18))}

var COLS=['#ff4a6a','#ffd75e','#5ac8ff','#5aff9a','#c87aff','#ff8a2e'];
function colAt(i){return COLS[i%COLS.length]}

var state='ready',score=0,level=1,frame=0,shake=0,overT=0,bestNew=false;
var chain=[],bullets=[],parts=[],pops=[],nextColor=0,curColor=0,gunAng=0,frog={x:W/2,y:H/2};

var path=[];
(function buildPath(){
 var cx=W/2,cy=H/2;
 for(var a=0;a<620;a++){
  var r=24 + a*0.24;
  var ang=a*0.09;
  var px=cx+Math.cos(ang)*r;
  var py=cy+Math.sin(ang)*r;
  path.push({x:px,y:py});
 }
 path.reverse();
})();

function newBall(c){return {d:0,c:c,sp:0.55+level*0.08}}
function reset(){
 chain=[]; bullets=[]; parts=[]; pops=[]; score=0; level=1; shake=0;
 for(var i=0;i<24;i++){ chain.push(newBall(Math.floor(Math.random()*Math.min(4+level,6)))); chain[i].d=i*22; }
 curColor=Math.floor(Math.random()*Math.min(4+level,6));
 nextColor=Math.floor(Math.random()*Math.min(4+level,6));
 scEl.textContent='0'; lvEl.textContent='1';
}

function burst(px,py,c,n){for(var i=0;i<n;i++)parts.push({x:px,y:py,vx:(Math.random()-.5)*6,vy:(Math.random()-.5)*6,life:1,c:c,s:2+Math.random()*3})}
function popup(px,py,txt,col){pops.push({x:px,y:py,t:1,txt:txt,c:col})}

function checkMatches(){
 var i=0,removed=0;
 while(i<chain.length){
  var j=i;
  while(j<chain.length && chain[j].c===chain[i].c) j++;
  var len=j-i;
  if(len>=3){
   for(var k=i;k<j;k++){ burst(path[Math.floor(chain[k].d)]?.x||W/2, path[Math.floor(chain[k].d)]?.y||H/2, colAt(chain[k].c), 10); }
   chain.splice(i,len);
   removed+=len;
   score+=len*10*(len>3?len:1);
   scEl.textContent=score;
   popup(W/2,H/2-60,'+'+(len*10), COLS[chain[i]?.c||0]);
   if(len>=4) sCombo(len-2);
   else sPop();
   continue;
  }
  i=j;
 }
 if(removed>0){
  if(chain.length===0){
   level++; lvEl.textContent=level;
   for(var n=0;n<18+level*3;n++){ chain.push(newBall(Math.floor(Math.random()*Math.min(4+level,6)))); chain[n].d=n*22; }
   burst(W/2,H/2,'#5aff9a',30);
   popup(W/2,H/2,'LEVEL '+level+' 👑','#5aff9a');
  }
 }
}

function update(){
 frame++;
 if(shake>0) shake*=0.9; if(shake<0.3) shake=0;
 for(var i=parts.length-1;i>=0;i--){var p=parts[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life-=0.04; if(p.life<=0) parts.splice(i,1)}
 for(i=pops.length-1;i>=0;i--){ if((pops[i].t-=0.04)<=0) pops.splice(i,1) }
 if(state!=='play') return;

 // move chain
 for(var c=0;c<chain.length;c++){
  var b=chain[c];
  if(c===0) b.d+=b.sp;
  else{
   var prev=chain[c-1];
   var target=prev.d+20;
   if(b.d<target) b.d+=(target-b.d)*0.14+0.1;
  }
 }
 // collision bullet vs chain
 for(var bi=bullets.length-1;bi>=0;bi--){
  var bl=bullets[bi];
  bl.x+=bl.vx; bl.y+=bl.vy;
  if(bl.x< -20 || bl.x> W+20 || bl.y< -20 || bl.y> H+20){ bullets.splice(bi,1); continue; }
  for(var ci=0;ci<chain.length;ci++){
   var pt=path[Math.floor(chain[ci].d)] || path[path.length-1];
   var dx=bl.x-pt.x, dy=bl.y-pt.y;
   if(dx*dx+dy*dy< 20*20){
    var ins={d:chain[ci].d, c:bl.c, sp:0.55+level*0.08};
    chain.splice(ci,0,ins);
    burst(pt.x,pt.y,colAt(bl.c),8);
    bullets.splice(bi,1);
    sShoot();
    checkMatches();
    break;
   }
  }
 }
 // lose
 if(chain.length && chain[0].d>= path.length-30){
  state='dead'; overT=performance.now(); shake=18; sDie();
  if(score>BEST){BEST=score; bsEl.textContent=BEST; saveBest(BEST); bestNew=true}
 }
}

function draw(){
 x.setTransform(DPR,0,0,DPR,0,0);
 if(shake>0) x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 // bg
 var g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#1a4a2e'); g.addColorStop(1,'#020a08'); x.fillStyle=g; x.fillRect(0,0,W,H);
 // path
 x.strokeStyle='rgba(255,255,255,.06)'; x.lineWidth=22; x.lineCap='round'; x.beginPath();
 for(var i=0;i<path.length;i++){ if(i===0) x.moveTo(path[i].x,path[i].y); else x.lineTo(path[i].x,path[i].y); } x.stroke();
 x.strokeStyle='rgba(90,255,154,.12)'; x.lineWidth=2; x.stroke();

 // skull finish
 var end=path[path.length-1]; x.save(); x.translate(end.x,end.y); x.font='900 26px Arial'; x.textAlign='center'; x.fillText('💀',0,8); x.restore();

 // chain
 for(var ci=0;ci<chain.length;ci++){
  var b=chain[ci]; var pt=path[Math.floor(b.d)]; if(!pt) continue;
  x.fillStyle='rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(pt.x+2,pt.y+3,11,11,0,0,7); x.fill();
  var grad=x.createRadialGradient(pt.x-3,pt.y-4,2,pt.x,pt.y,11);
  grad.addColorStop(0,'#ffffff'); grad.addColorStop(0.3, COLS[b.c]); grad.addColorStop(1,'#00000088');
  x.fillStyle=grad; x.beginPath(); x.arc(pt.x,pt.y,10,0,7); x.fill();
  x.strokeStyle='rgba(0,0,0,.35)'; x.lineWidth=1; x.stroke();
  if(ci===0){ x.fillStyle='#fff'; x.beginPath(); x.arc(pt.x-3,pt.y-3,2.5,0,7); x.fill(); }
 }

 // frog
 var fg=frog;
 x.save(); x.translate(fg.x,fg.y); x.rotate(gunAng);
 x.fillStyle='rgba(0,0,0,.25)'; x.beginPath(); x.ellipse(2,3,22,20,0,0,7); x.fill();
 x.fillStyle='#2a8a4a'; x.beginPath(); x.ellipse(0,0,20,18,0,0,7); x.fill();
 x.fillStyle='#1a5a2e'; x.beginPath(); x.ellipse(0,8,14,10,0,0,7); x.fill();
 // gun
 x.fillStyle='#3a6a3a'; x.fillRect(0,-5,34,10); x.fillStyle='#1a3a1a'; x.fillRect(30,-4,8,8);
 // current ball in gun
 var cg=x.createRadialGradient(8,-1,1,8,0,9); cg.addColorStop(0,'#fff'); cg.addColorStop(0.3,COLS[curColor]); cg.addColorStop(1,'#000'); x.fillStyle=cg; x.beginPath(); x.arc(8,0,8,0,7); x.fill();
 x.restore();
 // frog eyes
 x.fillStyle='#fff'; x.beginPath(); x.arc(fg.x-6,fg.y-12,6,0,7); x.arc(fg.x+6,fg.y-12,6,0,7); x.fill();
 x.fillStyle='#111'; x.beginPath(); x.arc(fg.x-6+Math.cos(gunAng)*2,fg.y-12+Math.sin(gunAng)*2,2.5,0,7); x.arc(fg.x+6+Math.cos(gunAng)*2,fg.y-12+Math.sin(gunAng)*2,2.5,0,7); x.fill();
 // next ball
 x.fillStyle='rgba(0,0,0,.4)'; x.beginPath(); x.arc(W-30, 34, 11,0,7); x.fill();
 var ng=x.createRadialGradient(W-32,32,1,W-30,34,10); ng.addColorStop(0,'#fff'); ng.addColorStop(0.3,COLS[nextColor]); ng.addColorStop(1,'#000'); x.fillStyle=ng; x.beginPath(); x.arc(W-30,34,9,0,7); x.fill();
 x.fillStyle='#7ac8a0'; x.font='700 7px Arial'; x.fillText('NEXT',W-42,14);

 // bullets
 bullets.forEach(function(bl){
  var g2=x.createRadialGradient(bl.x-2,bl.y-2,1,bl.x,bl.y,8); g2.addColorStop(0,'#fff'); g2.addColorStop(0.3,COLS[bl.c]); g2.addColorStop(1,'#000'); x.fillStyle=g2; x.beginPath(); x.arc(bl.x,bl.y,7,0,7); x.fill();
 });

 // particles
 parts.forEach(function(p){ x.globalAlpha=Math.max(p.life,0); x.fillStyle=p.c; x.fillRect(p.x,p.y,p.s,p.s); }); x.globalAlpha=1;
 pops.forEach(function(pp){ x.globalAlpha=Math.max(pp.t,0); x.font='900 14px Arial'; x.textAlign='center'; x.lineWidth=3; x.strokeStyle='rgba(0,0,0,.7)'; x.strokeText(pp.txt,pp.x,pp.y-(1-pp.t)*24); x.fillStyle=pp.c; x.fillText(pp.txt,pp.x,pp.y-(1-pp.t)*24); }); x.globalAlpha=1; x.textAlign='left';

 if(state==='ready'){
  x.fillStyle='rgba(0,10,8,.65)'; x.fillRect(0,0,W,H);
  x.textAlign='center';
  x.font='900 28px Arial Black'; x.lineWidth=6; x.strokeStyle='rgba(0,20,10,.9)'; x.strokeText('ZUMA',W/2,150); var gg=x.createLinearGradient(0,126,0,154); gg.addColorStop(0,'#eafff0'); gg.addColorStop(1,'#5aff9a'); x.fillStyle=gg; x.fillText('ZUMA',W/2,150);
  x.font='700 11px Arial'; x.fillStyle='#9ad8b0'; x.fillText('🥰 MONA LISA DELUXE EDITION 👑',W/2,172);
  if(BEST>0){ x.font='bold 12px monospace'; x.fillStyle='#5aff9a'; x.fillText('BEST: '+BEST,W/2,196); }
  x.font='900 15px Arial'; x.fillStyle='rgba(255,255,255,'+(.55+.45*Math.sin(frame*.09))+')'; x.fillText('TAP TO START 🐸',W/2,240);
  x.font='700 9px Arial'; x.fillStyle='#7ac8a0'; x.fillText('Aim frog • Match 3 colors • Chain to skull = Game Over 💀',W/2,262);
  x.textAlign='left';
 }
 if(state==='dead'){
  x.fillStyle='rgba(0,10,8,.6)'; x.fillRect(0,0,W,H);
  x.fillStyle='rgba(10,30,20,.92)'; x.beginPath(); x.roundRect(52,122,300,140,16); x.fill(); x.strokeStyle='rgba(90,255,154,.4)'; x.lineWidth=2; x.stroke();
  x.textAlign='center'; x.font='900 26px Arial Black'; var dg=x.createLinearGradient(0,138,0,164); dg.addColorStop(0,'#ff8a8a'); dg.addColorStop(1,'#ff4a6a'); x.fillStyle=dg; x.fillText('GAME OVER 💀',W/2,156);
  x.font='bold 13px monospace'; x.fillStyle='#eafff0'; x.fillText('SCORE '+score+' • LEVEL '+level,W/2,182);
  if(bestNew){ x.fillStyle='rgba(90,255,154,'+(.6+.4*Math.sin(frame*.2))+')'; x.font='900 13px Arial'; x.fillText('★ NEW BEST: '+BEST+' 👑 ★',W/2,206); } else { x.fillStyle='#9ad8b0'; x.font='bold 12px monospace'; x.fillText('BEST: '+BEST,W/2,206); }
  x.font='700 11px Arial'; x.fillStyle='rgba(255,255,255,'+(.5+.5*Math.sin(frame*.1))+')'; x.fillText('tap to play again 🐸',W/2,230);
  x.textAlign='left';
 }
}

var last=0;
function loop(t){ update(); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

function aim(e){
 var rect=cv.getBoundingClientRect();
 var cx=(e.touches?e.touches[0].clientX:e.clientX)-rect.left;
 var cy=(e.touches?e.touches[0].clientY:e.clientY)-rect.top;
 cx*=W/rect.width; cy*=H/rect.height;
 gunAng=Math.atan2(cy-frog.y, cx-frog.x);
}

function shoot(e){
 ac();
 if(state==='ready'){ state='play'; reset(); return; }
 if(state==='dead'){ if(performance.now()-overT>600){ state='play'; reset(); } return; }
 if(state!=='play') return;
 aim(e);
 var vx=Math.cos(gunAng)*11, vy=Math.sin(gunAng)*11;
 bullets.push({x:frog.x+Math.cos(gunAng)*28, y:frog.y+Math.sin(gunAng)*28, vx:vx, vy:vy, c:curColor});
 curColor=nextColor; nextColor=Math.floor(Math.random()*Math.min(4+level,6));
}

cv.addEventListener('pointerdown', function(e){ e.preventDefault(); shoot(e); });
cv.addEventListener('pointermove', function(e){ if(state==='play') aim(e); });
document.getElementById('muteB').addEventListener('pointerdown', function(e){
 e.preventDefault(); e.stopPropagation(); MUTED=!MUTED; this.textContent=MUTED?'🔇':'🔊'; try{localStorage.setItem('mona_zuma_mute',MUTED?'1':'0')}catch(e2){}
 if(!MUTED) ac();
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
 console.error('[Zuma] Error:', e.message);
 reply(`❌ Zuma Error: ${e.message}`);
}
});
