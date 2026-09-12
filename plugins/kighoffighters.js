const { cmd } = require('../redx');
const crypto = require('crypto');

cmd({
 pattern: "kof",
 alias: ["kingoffighters","fighter","fight"],
 desc: "👑 King Of Fighters 30 - Mona Lisa Edition",
 category: "game",
 react: "👊",
 filename: __filename
}, async (conn, mek, m, { from, reply }) => {
try{

const html = `
<style>
*{box-sizing:border-box;margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;-webkit-tap-highlight-color:transparent;user-select:none}
body{background:linear-gradient(165deg,#1a0a2a,#0a0a14);padding:6px;color:#ffe8ff}
#app{max-width:420px;margin:0 auto}
.hdr{display:flex;justify-content:space-between;align-items:center;padding:4px 2px 6px}
.tt{font:900 16px 'Arial Black';color:#ff4a6a;text-shadow:0 0 12px #ff4a6a66}
.tt small{display:block;font:700 6px Arial;letter-spacing:2px;color:#aa7a8a}
.hrs{display:flex;gap:4px}
.hr{background:rgba(0,0,0,.55);border:1px solid rgba(255,74,106,.35);border-radius:8px;padding:3px 7px;text-align:center;min-width:44px}
.hr b{font:900 11px 'Arial Black';color:#ff4a6a}
.gw{position:relative;border:2px solid rgba(255,74,106,.45);border-radius:14px;overflow:hidden;background:#000;box-shadow:0 0 20px rgba(255,74,106,.25)}
canvas{width:100%;display:block;touch-action:none}
.sel{max-height:400px;overflow-y:auto;padding:6px;background:linear-gradient(#1a0a2a,#0a0a14)}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}
.card{border:2px solid rgba(255,255,255,.12);border-radius:10px;padding:4px 2px;text-align:center;cursor:pointer;background:rgba(255,255,255,.06);transition:.15s}
.card.selc{border-color:#ff4a6a;box-shadow:0 0 10px #ff4a6a88;transform:scale(1.08);background:rgba(255,74,106,.18)}
.card b{display:block;font:900 7px Arial;color:#fff;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.card i{font-style:normal;font-size:16px}
.mode{display:flex;gap:8px;margin:8px 0}
.mbtn{flex:1;height:44px;border:2px solid rgba(255,74,106,.4);border-radius:12px;font:900 11px 'Arial Black';color:#fff;cursor:pointer}
#vsCpu{background:linear-gradient(#5ac8ff,#2a5aaa)}
#vsUser{background:linear-gradient(#ff4a6a,#8a1a3a)}
#startB{width:100%;height:48px;background:linear-gradient(#ffcc3a,#b87a0a);border:none;border-radius:12px;font:900 14px 'Arial Black';color:#000;margin-top:8px}
.pads{display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:6px;margin-top:8px}
.pd{height:50px;border:2px solid rgba(255,255,255,.12);border-radius:12px;font:900 10px 'Arial Black';color:#fff;box-shadow:0 3px 0 rgba(0,0,0,.5)}
.pd:active{transform:translateY(2px);box-shadow:none}
#plP{background:linear-gradient(#5ac8ff,#1a6ab8)} #plK{background:linear-gradient(#ff8a3a,#a83a0a)}
#prP{background:linear-gradient(#5aff9a,#1a8a3a)} #prK{background:linear-gradient(#c87aff,#6a2aaa)}
#spB{grid-column:span 2;background:linear-gradient(#ffcc3a,#b87a0a);color:#000}
#finB{grid-column:span 2;background:linear-gradient(#ff4a6a,#7a0a2a)}
.hint{text-align:center;font:700 8px Arial;color:#aa7a8a;margin-top:6px}
</style>
<div id="app">
<div class="hdr"><div class="tt">👑 KOF 30<small>MONA LISA • FIGHTERS</small></div><div class="hrs"><div class="hr"><b id="modeT">SELECT</b></div><div class="hr"><b id="bestT">30 CHARS</b></div></div></div>
<div class="gw">
<div id="selectScreen" class="sel">
<div class="mode"><button class="mbtn" id="vsCpu">🤖 VS CPU</button><button class="mbtn" id="vsUser">👥 VS USER</button></div>
<div style="font:900 11px Arial;color:#ff4a6a;margin:6px 2px">P1 CHOOSE - <span id="p1Name">None</span></div>
<div class="grid" id="grid1"></div>
<div style="font:900 11px Arial;color:#5ac8ff;margin:8px 2px">P2 / CPU CHOOSE - <span id="p2Name">None</span></div>
<div class="grid" id="grid2"></div>
<button id="startB">🔥 START FIGHT 🔥</button>
</div>
<canvas id="cv" width="420" height="320" style="display:none"></canvas>
</div>
<div class="pads" id="pads" style="display:none">
<button class="pd" id="plL">P1 ◀</button><button class="pd" id="plR">P1 ▶</button><button class="pd" id="prL">P2 ◀</button><button class="pd" id="prR">P2 ▶</button>
<button class="pd" id="plP">P1 PUNCH</button><button class="pd" id="plK">P1 KICK</button><button class="pd" id="prP">P2 PUNCH</button><button class="pd" id="prK">P2 KICK</button>
<button class="pd" id="spB">⚡ SUPER</button><button class="pd" id="finB">💥 FINISHER</button>
</div>
<div class="hint" id="hint">🥰 Choose 30 KOF characters • Each has unique super & finisher • VS CPU or VS FRIEND on same phone 👑</div>
</div>
<script>
(function(){
var cv=document.getElementById('cv'),x=cv.getContext('2d'),W=420,H=320,DPR=2;cv.width=W*DPR;cv.height=H*DPR;
var selectScreen=document.getElementById('selectScreen'), pads=document.getElementById('pads');
var g1=document.getElementById('grid1'),g2=document.getElementById('grid2'),p1N=document.getElementById('p1Name'),p2N=document.getElementById('p2Name'),modeT=document.getElementById('modeT');

var ROSTER=[
{id:0,name:'KYO',emo:'🔥',col:'#ff4a2a',hp:100,pow:8,spd:7,super:'Orochinagi',fin:'Final Flame',style:'Flame Fist'},
{id:1,name:'IORI',emo:'🌙',col:'#8a1a5a',hp:95,pow:9,spd:8,super:'Ya Sakazuki',fin:'Maiden Masher',style:'Riot Claw'},
{id:2,name:'TERRY',emo:'🐺',col:'#ff8a2a',hp:110,pow:8,spd:6,super:'Power Geyser',fin:'Buster Wolf',style:'Street Brawler'},
{id:3,name:'RYO',emo:'🥋',col:'#ffd75e',hp:105,pow:9,spd:5,super:'Ryuuko Ranbu',fin:'Dragon Crush',style:'Kyokugen Karate'},
{id:4,name:'K DASH',emo:'❄️',col:'#5ac8ff',hp:100,pow:8,spd:7,super:'Chain Drive',fin:'Heat Drive',style:'Flame Control'},
{id:5,name:'KULA',emo:'🧊',col:'#8ad8ff',hp:90,pow:7,spd:9,super:'Diamond Edge',fin:'Frost Barrage',style:'Ice Queen'},
{id:6,name:'MAI',emo:'💃',col:'#ff4a6a',hp:90,pow:7,spd:9,super:'Fandango',fin:'Burning Fan',style:'Ninja Dance'},
{id:7,name:'ATHENA',emo:'✨',col:'#c87aff',hp:85,pow:7,spd:8,super:'Shining Crystal',fin:'Psycho Medley',style:'Psycho Power'},
{id:8,name:'LEONA',emo:'💣',col:'#5aff9a',hp:100,pow:8,spd:7,super:'V-Slasher',fin:'Rebel Spark',style:'Military Arts'},
{id:9,name:'RALF',emo:'💪',col:'#8a5a2a',hp:120,pow:10,spd:4,super:'Galactica Phantom',fin:'Bare Knuckle',style:'Tank Buster'},
{id:10,name:'CLARK',emo:'🤼',col:'#5a5a5a',hp:120,pow:9,spd:5,super:'Ultra Argentine',fin:'Running Three',style:'Wrestler'},
{id:11,name:'KIM',emo:'🦵',col:'#ffcc3a',hp:95,pow:8,spd:9,super:'Houou Kyaku',fin:'Houou Tenbu',style:'Tae Kwon Do'},
{id:12,name:'BENIMARU',emo:'⚡',col:'#8affff',hp:95,pow:7,spd:9,super:'Raijin Ken',fin:'Thunder Strike',style:'Electro Shock'},
{id:13,name:'YURI',emo:'👊',col:'#ff9a5a',hp:90,pow:7,spd:8,super:'Mouryou Ranbu',fin:'Burst Smash',style:'Kyokugen Girl'},
{id:14,name:'ANDY',emo:'🥷',col:'#9aff8a',hp:100,pow:8,spd:7,super:'Chou Reppa Dan',fin:'Zaneiken Storm',style:'Shiranui Ninja'},
{id:15,name:'JOE',emo:'🥊',col:'#ffd75e',hp:105,pow:8,spd:6,super:'Screw Upper',fin:'Tornado Finish',style:'Muay Thai'},
{id:16,name:'ROBERT',emo:'🦶',col:'#5a8aff',hp:100,pow:8,spd:7,super:'Ryuuko Ranbu',fin:'Hawk Kick',style:'Kyokugen Kick'},
{id:17,name:'KING',emo:'👑',col:'#8a4a8a',hp:95,pow:7,spd:8,super:'Silent Flash',fin:'Venom Strike',style:'Muay Queen'},
{id:18,name:'VICE',emo:'🖤',col:'#2a0a2a',hp:100,pow:9,spd:6,super:'Negative Gain',fin:'Overkill',style:'Brutal Grapple'},
{id:19,name:'MATURE',emo:'💜',col:'#6a2a8a',hp:100,pow:8,spd:7,super:'Ebony Tears',fin:'Ecstasy Wave',style:'Orochi Slasher'},
{id:20,name:'RUGAL',emo:'🦾',col:'#ff1a1a',hp:130,pow:10,spd:5,super:'Genocide Cutter',fin:'Gigantic Pressure',style:'Boss Evil'},
{id:21,name:'GESE',emo:'👹',col:'#4a0a0a',hp:135,pow:10,spd:4,super:'Deadly Rave',fin:'Raging Storm',style:'Crime Lord'},
{id:22,name:'YASHIRO',emo:'🎸',col:'#5a5a8a',hp:110,pow:9,spd:5,super:'Final Impact',fin:'Million Bash',style:'Rock Crusher'},
{id:23,name:'SHERMIE',emo:'⚡',col:'#ff4ad8',hp:90,pow:7,spd:8,super:'Shermie Flash',fin:'Diamond Dust',style:'Lightning Kiss'},
{id:24,name:'CHRIS',emo:'😈',col:'#8aff6a',hp:85,pow:7,spd:9,super:'Chain Sling',fin:'Twister Drive',style:'Speed Demon'},
{id:25,name:'SHINGO',emo:'🔰',col:'#ffcc8a',hp:95,pow:6,spd:7,super:'Burning Shingo',fin:'Ore Shiki',style:'Kyo Fan'},
{id:26,name:'WHIP',emo:'🔫',col:'#3a4a5a',hp:95,pow:8,spd:7,super:'Sonic Slaughter',fin:'Boomerang Shot',style:'Weapon Master'},
{id:27,name:'VANESSA',emo:'🥊',col:'#ff2a2a',hp:95,pow:8,spd:8,super:'Puncher Vision',fin:'Crazy Boxer',style:'Boxing Queen'},
{id:28,name:'RAMON',emo:'🤸',col:'#ffd75e',hp:110,pow:9,spd:6,super:'El Diablo',fin:'Tiger Spin',style:'Lucha Libre'},
{id:29,name:'ANGEL',emo:'😇',col:'#ffffff',hp:105,pow:9,spd:7,super:'Unchain Circle',fin:'Red Sky',style:'Angel Assault'}
];

var mode='cpu', p1Pick=null, p2Pick=null;
var AC=null,MUTED=false;
function ac(){if(!AC){try{AC=new(window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==='suspended')try{AC.resume()}catch(e){}return AC}
function tone(f,d,t,v){var a=AC;if(!a||MUTED)return;try{var n=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=t;o.frequency.setValueAtTime(f,n);g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.0001,n+d);o.connect(g);g.connect(a.destination);o.start(n);o.stop(n+d+.02)}catch(e){}}

function buildGrid(){
 ROSTER.forEach((ch,i)=>{
  var d1=document.createElement('div'); d1.className='card'; d1.innerHTML='<i>'+ch.emo+'</i><b>'+ch.name+'</b>'; d1.onclick=()=>pick1(i,d1); g1.appendChild(d1);
  var d2=document.createElement('div'); d2.className='card'; d2.innerHTML='<i>'+ch.emo+'</i><b>'+ch.name+'</b>'; d2.onclick=()=>pick2(i,d2); g2.appendChild(d2);
 });
}
buildGrid();
function pick1(i,el){ p1Pick=i; [...g1.children].forEach(c=>c.classList.remove('selc')); el.classList.add('selc'); p1N.textContent=ROSTER[i].name+' - '+ROSTER[i].style; ac(); tone(440,0.1,'square',0.12); }
function pick2(i,el){ p2Pick=i; [...g2.children].forEach(c=>c.classList.remove('selc')); el.classList.add('selc'); p2N.textContent=ROSTER[i].name+' - '+ROSTER[i].super; ac(); tone(660,0.1,'square',0.12); }

document.getElementById('vsCpu').onclick=()=>{mode='cpu'; modeT.textContent='VS CPU'; document.getElementById('vsCpu').style.filter='brightness(1.3)'; document.getElementById('vsUser').style.filter=''; p2Pick=Math.floor(Math.random()*30); p2N.textContent=ROSTER[p2Pick].name+' (CPU)'; [...g2.children].forEach((c,idx)=>{c.classList.toggle('selc',idx===p2Pick)}); tone(880,0.1,'square',0.1);};
document.getElementById('vsUser').onclick=()=>{mode='user'; modeT.textContent='VS USER'; document.getElementById('vsUser').style.filter='brightness(1.3)'; document.getElementById('vsCpu').style.filter=''; tone(880,0.1,'square',0.1);};

var state='select', fighters=[],frame=0,shake=0,overT=0,p1,p2,bestNew=false;

function makeFighter(rosterId, isP2){
 var r=ROSTER[rosterId];
 return {id:rosterId,name:r.name,emo:r.emo,col:r.col,hp:r.hp,maxHp:r.hp,pow:r.pow,spd:r.spd,super:r.super,fin:r.fin,style:r.style,x:isP2?300:100,y:200,vx:0,vy:0,dir:isP2?-1:1,grounded:true,state:'idle',atkT:0,hitT:0,superBar:0,combo:0,keys:{l:false,r:false,p:false,k:false,s:false,f:false}};
}

document.getElementById('startB').onclick=()=>{
 if(p1Pick===null){ alert('P1 pick character! 🥰'); return; }
 if(p2Pick===null){ if(mode==='cpu') p2Pick=Math.floor(Math.random()*30); else { alert('P2 pick character!'); return; } }
 p1=makeFighter(p1Pick,false); p2=makeFighter(p2Pick,true);
 if(mode==='cpu') p2.isCpu=true;
 state='fight'; selectScreen.style.display='none'; cv.style.display='block'; pads.style.display='grid';
 if(mode==='user'){ document.getElementById('prL').style.display='block'; document.getElementById('prR').style.display='block'; document.getElementById('prP').style.display='block'; document.getElementById('prK').style.display='block'; }
 else { document.getElementById('prL').style.display='none'; document.getElementById('prR').style.display='none'; document.getElementById('prP').style.display='none'; document.getElementById('prK').style.display='none'; }
 frame=0;
};

function ai(f, enemy){
 if(Math.random()<0.03) f.keys.p=Math.random()<0.5;
 if(Math.abs(f.x-enemy.x)>60){ f.keys.l= f.x>enemy.x; f.keys.r= f.x<enemy.x; } else { f.keys.l=false; f.keys.r=false; if(Math.random()<0.08) f.keys.k=true; if(f.superBar>=100 && Math.random()<0.1) f.keys.s=true; if(f.superBar>=200) f.keys.f=true; }
}

var parts=[],pops=[];
function burst(px,py,c,n){for(var i=0;i<n;i++)parts.push({x:px,y:py,vx:(Math.random()-.5)*7,vy:-Math.random()*5,life:1,c:c,s:2+Math.random()*3})}
function popup(px,py,txt,c){pops.push({x:px,y:py,t:1,txt:txt,c:c})}

function tryHit(atk, def){
 var dx=Math.abs(atk.x-def.x), dy=Math.abs(atk.y-def.y);
 var range= atk.state==='kick'?56:44;
 if(dx<range && dy<32 && def.hitT<=0){
  var dmg= atk.state==='punch'?6+atk.pow : atk.state==='kick'?9+atk.pow : atk.state==='super'?22+atk.pow*2 : 38+atk.pow*3;
  if(atk.state==='super') atk.superBar-=100;
  if(atk.state==='fin') atk.superBar-=200;
  def.hp-=dmg; def.hitT= atk.state==='fin'?32: atk.state==='super'?22:14;
  def.vx= atk.dir* (atk.state==='fin'?8:4);
  burst(def.x,def.y-18, atk.col, atk.state==='fin'?22:10);
  popup(def.x,def.y-32, atk.state==='fin'?atk.fin+'! -'+dmg: atk.state==='super'?atk.super+'! -'+dmg: '-'+dmg, atk.col);
  shake= atk.state==='fin'?14: atk.state==='super'?8:4;
  ac(); if(atk.state==='fin') [200,150,100,60].forEach((f,i)=>tone(f,0.18,'sawtooth',0.2,i*0.1)); else if(atk.state==='super') tone(880,0.15,'square',0.18); else tone(300,0.08,'square',0.12);
  atk.combo++; atk.superBar=Math.min(300, atk.superBar+ (atk.combo>2?18:10));
  if(def.hp<=0){ state='over'; overT=performance.now(); }
  return true;
 }
 return false;
}

function update(){
 frame++; if(shake>0) shake*=0.9;
 for(var i=parts.length-1;i>=0;i--){var p=parts[i]; p.x+=p.vx; p.y+=p.vy; p.vy+=0.2; p.life-=0.04; if(p.life<=0) parts.splice(i,1)}
 for(i=pops.length-1;i>=0;i--) if((pops[i].t-=0.05)<=0) pops.splice(i,1);
 if(state!=='fight') return;
 if(p2.isCpu) ai(p2,p1);
 [p1,p2].forEach(f=>{
  if(f.hitT>0) f.hitT--;
  if(f.atkT>0) f.atkT--; else if(f.state!=='idle' && f.state!=='walk') f.state='idle';
  var spd= 2.6 + f.spd*0.18;
  if(f.keys.l){ f.x-=spd; f.dir=-1; if(f.grounded) f.state='walk'; }
  if(f.keys.r){ f.x+=spd; f.dir=1; if(f.grounded) f.state='walk'; }
  f.x=Math.max(40,Math.min(W-40,f.x));
  // attacks
  if(f.keys.p && f.atkT<=0){ f.state='punch'; f.atkT=14; f.keys.p=false; }
  if(f.keys.k && f.atkT<=0){ f.state='kick'; f.atkT=18; f.keys.k=false; }
  if(f.keys.s && f.superBar>=100 && f.atkT<=0){ f.state='super'; f.atkT=28; f.keys.s=false; }
  if(f.keys.f && f.superBar>=200 && f.atkT<=0){ f.state='fin'; f.atkT=42; f.keys.f=false; }
  if(f.keys.l||f.keys.r) {} else if(f.state==='walk') f.state='idle';
 });
 // hit
 if(p1.atkT>6) tryHit(p1,p2);
 if(p2.atkT>6) tryHit(p2,p1);
 // reset keys for cpu
 if(p2.isCpu){ p2.keys.p=false; p2.keys.k=false; p2.keys.s=false; p2.keys.f=false; }
}

function drawFighter(f){
 x.save(); x.translate(f.x,f.y);
 if(f.hitT>0 && Math.floor(frame/3)%2===0){ x.globalAlpha=0.4; }
 x.scale(f.dir,1);
 // shadow
 x.fillStyle='rgba(0,0,0,.35)'; x.beginPath(); x.ellipse(0,22,18,6,0,0,7); x.fill();
 // legs
 var legSwing= f.state==='walk'?Math.sin(frame*0.3)*8:0;
 x.fillStyle='#111'; x.fillRect(-6+legSwing,12,5,12); x.fillRect(2-legSwing,12,5,12);
 // body
 x.fillStyle=f.col; x.fillRect(-10,-2,20,16);
 x.fillStyle='#000'; x.fillRect(-10,-2,20,2);
 // arms punch
 if(f.state==='punch' || f.state==='super' || f.state==='fin'){
  var ext= f.state==='fin'?28: f.state==='super'?20:14;
  x.fillStyle='#ffcc9a'; x.fillRect(8,-4,ext,6);
  x.fillStyle=f.col; x.fillRect(8,-6,ext*0.6,4);
 } else {
  x.fillStyle='#ffcc9a'; x.fillRect(-12,0,6,8); x.fillRect(8,0,6,8);
 }
 // head
 x.fillStyle='#ffcc9a'; x.beginPath(); x.arc(0,-12,10,0,7); x.fill();
 x.fillStyle=f.col; x.fillRect(-11,-22,22,6);
 // eyes
 x.fillStyle='#000'; x.beginPath(); x.arc(3,-13,2,0,7); x.arc(-2,-13,2,0,7); x.fill();
 if(f.state==='super' || f.state==='fin'){ x.fillStyle='#fff'; x.beginPath(); x.arc(3,-13,1,0,7); x.fill(); x.shadowColor=f.col; x.shadowBlur=8; x.fillStyle=f.col; x.beginPath(); x.arc(0,-12,10,0,7); x.fill(); x.shadowBlur=0; }
 x.restore();
 // name
 x.fillStyle='rgba(0,0,0,.5)'; x.beginPath(); x.roundRect(f.x-24,f.y-48,48,12,6); x.fill();
 x.fillStyle='#fff'; x.font='700 7px Arial'; x.textAlign='center'; x.fillText(f.name,f.x,f.y-40);
 x.textAlign='left';
}

function draw(){
 x.setTransform(DPR,0,0,DPR,0,0);
 if(shake>0) x.translate((Math.random()-.5)*shake,(Math.random()-.5)*shake);
 var g=x.createLinearGradient(0,0,0,H); g.addColorStop(0,'#1a0a2a'); g.addColorStop(0.5,'#2a1a3a'); g.addColorStop(1,'#0a0a14'); x.fillStyle=g; x.fillRect(0,0,W,H);
 // floor
 x.fillStyle='#1a1a1a'; x.fillRect(0,H*0.75,W,H*0.25);
 x.strokeStyle='rgba(255,255,255,.08)'; x.lineWidth=1; for(var i=0;i<W;i+=28){ x.beginPath(); x.moveTo(i, H*0.75); x.lineTo(i+10, H); x.stroke(); }
 // health bars
 function bar(f, left){
  var bx= left?12: W-112, by=14, w=100, h=14;
  x.fillStyle='rgba(0,0,0,.6)'; x.beginPath(); x.roundRect(bx-2,by-2,w+4,h+4,6); x.fill();
  x.fillStyle='#333'; x.beginPath(); x.roundRect(bx,by,w,h,4); x.fill();
  var hpw= Math.max(0, f.hp/f.maxHp*w);
  var hg=x.createLinearGradient(bx,by,bx,by+h); hg.addColorStop(0,f.col); hg.addColorStop(1,'#000'); x.fillStyle=hg; x.beginPath(); x.roundRect(left?bx:bx+(w-hpw),by,hpw,h,4); x.fill();
  x.fillStyle='#fff'; x.font='900 9px Arial'; x.fillText(f.name+' '+Math.max(0,Math.floor(f.hp)), bx, by-4);
  // super bar
  x.fillStyle='rgba(0,0,0,.5)'; x.fillRect(bx,by+h+4, w,6);
  x.fillStyle=f.superBar>=200?'#ffcc3a':f.superBar>=100?'#5ac8ff':'#555'; x.fillRect(bx,by+h+4, w*(f.superBar/300),6);
 }
 if(state==='fight' || state==='over'){ bar(p1,true); bar(p2,false); }
 if(state==='fight' || state==='over'){
  drawFighter(p1); drawFighter(p2);
  parts.forEach(function(p){ x.globalAlpha=Math.max(p.life,0); x.fillStyle=p.c; x.fillRect(p.x,p.y,p.s,p.s); }); x.globalAlpha=1;
  pops.forEach(function(pp){ x.globalAlpha=Math.max(pp.t,0); x.font='900 12px Arial Black'; x.textAlign='center'; x.lineWidth=3; x.strokeStyle='rgba(0,0,0,.8)'; x.strokeText(pp.txt,pp.x,pp.y-(1-pp.t)*20); x.fillStyle=pp.c; x.fillText(pp.txt,pp.x,pp.y-(1-pp.t)*20); }); x.globalAlpha=1; x.textAlign='left';
  x.fillStyle='#ffcc3a'; x.font='700 8px Arial'; x.textAlign='center';
  if(p1.state==='super') x.fillText(p1.super+' ⚡',p1.x, p1.y-56);
  if(p2.state==='super') x.fillText(p2.super+' ⚡',p2.x, p2.y-56);
  if(p1.state==='fin') x.fillText(p1.fin+' 💥',p1.x, p1.y-56);
  if(p2.state==='fin') x.fillText(p2.fin+' 💥',p2.x, p2.y-56);
  x.textAlign='left';
 }
 if(state==='over'){
  x.fillStyle='rgba(0,0,0,.6)'; x.fillRect(0,0,W,H);
  x.textAlign='center'; var win= p1.hp>0?p1:p2;
  x.font='900 32px Arial Black'; x.lineWidth=6; x.strokeStyle='#000'; x.strokeText('K.O.!',W/2,120); var gg=x.createLinearGradient(0,90,0,122); gg.addColorStop(0,'#ffef9a'); gg.addColorStop(1,win.col); x.fillStyle=gg; x.fillText('K.O.!',W/2,120);
  x.font='900 18px Arial Black'; x.fillStyle='#fff'; x.fillText(win.name+' WINS! 👑',W/2,150);
  x.font='700 10px Arial'; x.fillStyle=win.col; x.fillText(win.fin+' FINISHER!',W/2,168);
  x.font='700 11px Arial'; x.fillStyle='rgba(255,255,255,.8)'; x.fillText('tap to rematch',W/2,196);
  x.textAlign='left';
 }
}

function loop(){ update(); draw(); requestAnimationFrame(loop); }
requestAnimationFrame(loop);

function bindHold(id, keyObj, key){
 var el=document.getElementById(id);
 ['pointerdown','touchstart'].forEach(ev=> el.addEventListener(ev,function(e){e.preventDefault(); if(state==='fight'){ keyObj[key]=true; } }));
 ['pointerup','pointerleave','touchend','touchcancel'].forEach(ev=> el.addEventListener(ev,function(){ keyObj[key]=false; }));
}

cv.addEventListener('pointerdown',function(){
 if(state==='over' && performance.now()-overT>800){ selectScreen.style.display='block'; cv.style.display='none'; pads.style.display='none'; state='select'; }
});

var p1k=null,p2k=null;
function setupBinds(){
 if(!p1||!p2) return;
 p1k=p1.keys; p2k=p2.keys;
 bindHold('plL',p1k,'l'); bindHold('plR',p1k,'r');
 bindHold('plP',p1k,'p'); bindHold('plK',p1k,'k');
 bindHold('prL',p2k,'l'); bindHold('prR',p2k,'r');
 bindHold('prP',p2k,'p'); bindHold('prK',p2k,'k');
 document.getElementById('spB').onclick=()=>{ if(state==='fight'){ if(p1.superBar>=100) p1k.s=true; } };
 document.getElementById('finB').onclick=()=>{ if(state==='fight'){ if(mode==='user' && p2.superBar>=200) p2k.f=true; else if(p1.superBar>=200) p1k.f=true; } };
}
var observer=setInterval(()=>{ if(p1){ setupBinds(); clearInterval(observer); } },300);

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
 console.error('[KOF] Error:', e.message);
 reply(`❌ KOF Error: ${e.message}`);
}
});