const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const state=JSON.parse(localStorage.getItem("snakeAppleSave")||'null')||{
 level:1,xp:0,best:0,mode:"classic",map:0,unlocked:1,achievements:{},theme:"light"
};
const maps=[
 {name:"Meadow",icon:"🌿",desc:"A peaceful green beginning.",need:0},
 {name:"Ocean",icon:"🌊",desc:"Blue currents and faster turns.",need:5},
 {name:"Starlight",icon:"✦",desc:"A cosmic maze of glowing paths.",need:12},
 {name:"Sunset",icon:"☀️",desc:"The final horizon.",need:20}
];
const achievements=[
 ["first","🌱","First Bite","Eat your first apple.",s=>s.total>=1],
 ["five","🍎","Apple Collector","Eat 5 apples.",s=>s.total>=5],
 ["ten","⚡","Speed Runner","Reach 10 points in one run.",s=>s.runBest>=10],
 ["map","🗺️","Explorer","Unlock your second map.",s=>s.unlocked>=2],
 ["zen","☼","Find Your Zen","Play a Zen run.",s=>s.zen],
 ["master","🏆","Snake Master","Reach level 4.",s=>s.level>=4]
];
const stats=()=>({total:Number(localStorage.getItem("snakeTotal")||0),runBest:Number(localStorage.getItem("snakeRunBest")||0),zen:!!localStorage.getItem("snakeZen"),...state});
function save(){localStorage.setItem("snakeAppleSave",JSON.stringify(state));}
function nav(id){
  $$(".screen").forEach(x=>x.classList.toggle("active",x.id===id));
  $$(".tab").forEach(x=>x.classList.toggle("active",x.dataset.screen===id));
  if(id==="maps")renderMaps(); if(id==="achievements")renderAchievements();
  updateHome();
}
$$("[data-screen]").forEach(b=>b.onclick=()=>nav(b.dataset.screen));
$("#themeBtn").onclick=()=>{state.theme=state.theme==="light"?"dark":"light";document.body.classList.toggle("dark",state.theme==="dark");$("#themeBtn").textContent=state.theme==="dark"?"☀":"☾";save()};

function updateHome(){
 $("#levelText").textContent=state.level; $("#xpText").textContent=`${state.xp} / ${state.level*5}`;
 $("#xpBar").style.width=Math.min(100,state.xp/(state.level*5)*100)+"%";
 $("#continueTitle").textContent=maps[state.map].name;
 $("#continueSub").textContent=`Level ${state.level} · ${state.mode[0].toUpperCase()+state.mode.slice(1)}`;
}
function renderMaps(){
 $("#mapList").innerHTML=maps.map((m,i)=>{
  const unlocked=i<state.unlocked;
  return `<button class="map-card ${unlocked?"":"locked"}" data-map="${i}">
    <div class="map-icon">${m.icon}</div>${unlocked?"":"<span class=lock>🔒</span>"}
    <h2>${m.name}</h2><p>${m.desc}</p><span class=stars>${unlocked?"✦ ".repeat(Math.min(3,state.level>i?3:1)):"Complete previous map"}</span>
  </button>`}).join("");
 $$(".map-card").forEach(b=>b.onclick=()=>{let i=+b.dataset.map;if(i<state.unlocked){state.map=i;save();startGame()}});
}
function renderAchievements(){
 const s=stats();
 $("#achievementList").innerHTML=achievements.map(a=>{
  const done=state.achievements[a[0]]||a[4](s); if(done)state.achievements[a[0]]=true;
  return `<div class="achievement ${done?"done":""}"><div class=badge>${a[1]}</div><div><b>${a[2]}</b><small>${a[3]}</small></div></div>`
 }).join(""); save();
}
$$("[data-mode]").forEach(b=>b.onclick=()=>{state.mode=b.dataset.mode;save();$$(".mode-card").forEach(x=>x.classList.remove("selected"));if(b.classList.contains("mode-card"))b.classList.add("selected");if(b.classList.contains("big-mode")||b.id==="continueBtn")startGame();updateHome()});
$("#continueBtn").onclick=()=>startGame();

const canvas=$("#canvas"),ctx=canvas.getContext("2d"),N=24,C=25;
let snake,food,dir,next,running=false,paused=false,timer,lastTouch=null,score=0,timeLeft=60;
function startGame(){
 nav("game"); score=0;timeLeft=60;
 $("#gameModeLabel").textContent=state.mode[0].toUpperCase()+state.mode.slice(1);
 $("#gameMapLabel").textContent=maps[state.map].name;$("#score").textContent=0;$("#best").textContent=state.best;$("#gameLevel").textContent=state.level;
 snake=[{x:12,y:12},{x:11,y:12},{x:10,y:12}];dir={x:1,y:0};next={x:1,y:0};placeFood();running=true;paused=false;$("#pauseOverlay").classList.remove("show");
 clearInterval(timer);timer=setInterval(tick,110);draw();
}
function placeFood(){do{food={x:Math.floor(Math.random()*N),y:Math.floor(Math.random()*N)}}while(snake.some(s=>s.x===food.x&&s.y===food.y))}
function tick(){
 if(!running||paused)return;
 if(state.mode==="time"){timeLeft-=.11;if(timeLeft<=0)return endGame();}
 dir=next;let h={x:snake[0].x+dir.x,y:snake[0].y+dir.y};
 const wrap=state.mode==="zen";
 if(wrap){h.x=(h.x+N)%N;h.y=(h.y+N)%N}
 if(!wrap&&(h.x<0||h.x>=N||h.y<0||h.y>=N)||snake.some(s=>s.x===h.x&&s.y===h.y))return endGame();
 if(state.mode==="walls" && obstacle(h.x,h.y))return endGame();
 snake.unshift(h);
 if(h.x===food.x&&h.y===food.y){score++;$("#score").textContent=score;let total=Number(localStorage.getItem("snakeTotal")||0)+1;localStorage.setItem("snakeTotal",total);if(score>state.best){state.best=score;$("#best").textContent=score}
  if(score%5===0){state.xp++;if(state.xp>=state.level*5){state.xp=0;state.level++;if(state.level>state.unlocked&&state.unlocked<maps.length){state.unlocked=state.level;state.map=Math.min(state.unlocked-1,maps.length-1)}}save();updateHome()}
  placeFood();
 }else snake.pop();
 draw();
}
function obstacle(x,y){if(state.map===0)return false; if(state.map===1)return (x===6&&y>3&&y<19)||(x===17&&y>5&&y<21);if(state.map===2)return (x===5&&y>2&&y<10)||(x===18&&y>14)||(y===7&&x>8&&x<17);return (x===4&&y>4&&y<18)||(x===19&&y>5&&y<20)||(y===4&&x>8&&x<16)}
function endGame(){running=false;clearInterval(timer);const rb=Number(localStorage.getItem("snakeRunBest")||0);if(score>rb)localStorage.setItem("snakeRunBest",score);if(state.mode==="zen")localStorage.setItem("snakeZen","1");renderAchievements();alert(score?"Run complete! Score: "+score:"Game over");nav("home")}
function draw(){
 const g=ctx.createLinearGradient(0,0,600,600);g.addColorStop(0,"#07140f");g.addColorStop(1,"#0c2418");ctx.fillStyle=g;ctx.fillRect(0,0,600,600);
 ctx.strokeStyle="rgba(255,255,255,.035)";for(let i=0;i<=N;i++){ctx.beginPath();ctx.moveTo(i*C,0);ctx.lineTo(i*C,600);ctx.stroke();ctx.beginPath();ctx.moveTo(0,i*C);ctx.lineTo(600,i*C);ctx.stroke()}
 if(state.mode==="walls"||state.map>0){ctx.fillStyle="rgba(255,255,255,.13)";for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(obstacle(x,y))ctx.fillRect(x*C+2,y*C+2,C-4,C-4)}
 let fx=food.x*C+12.5,fy=food.y*C+12.5;ctx.shadowColor="#ff453a";ctx.shadowBlur=22;ctx.fillStyle="#ff453a";ctx.beginPath();ctx.arc(fx,fy,7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
 snake.forEach((p,i)=>{ctx.fillStyle=i?"#30d158":"#64e572";ctx.shadowColor=i?"#30d158":"#8aff9a";ctx.shadowBlur=i?6:15;ctx.beginPath();ctx.roundRect(p.x*C+3,p.y*C+3,C-6,C-6,8);ctx.fill();ctx.shadowBlur=0});
}
function change(x,y){if(dir.x+x===0&&dir.y+y===0)return;next={x,y}}
document.addEventListener("keydown",e=>{const k={ArrowUp:[0,-1],w:[0,-1],W:[0,-1],ArrowDown:[0,1],s:[0,1],S:[0,1],ArrowLeft:[-1,0],a:[-1,0],A:[-1,0],ArrowRight:[1,0],d:[1,0],D:[1,0]};if(k[e.key]){e.preventDefault();change(...k[e.key])}if(e.key===" ")togglePause()});
$$(".dpad button").forEach(b=>b.onclick=()=>{const d={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]};change(...d[b.dataset.dir])});
$("#pauseBtn").onclick=togglePause;$("#quitBtn").onclick=()=>{running=false;clearInterval(timer);nav("home")};
function togglePause(){if(!running)return;paused=!paused;$("#pauseOverlay").classList.toggle("show",paused)}
let sx=0,sy=0;canvas.addEventListener("touchstart",e=>{sx=e.touches[0].clientX;sy=e.touches[0].clientY},{passive:true});canvas.addEventListener("touchend",e=>{let dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<25)return;Math.abs(dx)>Math.abs(dy)?change(dx>0?1:-1,0):change(0,dy>0?1:-1)},{passive:true});
document.body.classList.toggle("dark",state.theme==="dark");$("#themeBtn").textContent=state.theme==="dark"?"☀":"☾";updateHome();renderAchievements();
