(() => {
  'use strict';
  const saga = globalThis.HeroSaga;
  const campaign = globalThis.DenkmalLevels;
  const canvas = document.getElementById('game');
  const ctx = canvas ? canvas.getContext('2d') : null;
  const atlas = new Image();
  const hellscape = new Image();
  const art = {};
  const towerArt = { bow:new Image(), cannon:new Image(), ballista:new Image(), mage:new Image(), mortar:new Image(), rift:new Image(), shrine:new Image() };
  const towerLevelArt = { rift:[new Image(),new Image(),new Image()] };
  atlas.src = 'assets/asset-atlas.png';
  hellscape.src = 'assets/hellscape-map-v1.png';
  towerArt.bow.src = 'assets/tower-bow-infernal-v1.png';
  towerArt.cannon.src = 'assets/tower-cannon-ash-v1.png';
  towerArt.ballista.src = 'assets/tower-ballista-rift-v1.png';
  towerArt.mage.src = 'assets/tower-mage-hellfire-v1.png';
  towerArt.mortar.src = 'assets/tower-mortar-volcanic-v1.png';
  towerArt.rift.src = 'assets/tower-rift-lance-v1.png';
  towerLevelArt.rift[0].src = 'assets/tower-rift-lance-l1.png';
  towerLevelArt.rift[1].src = 'assets/tower-rift-lance-l2.png';
  towerLevelArt.rift[2].src = 'assets/tower-rift-lance-l3.png';
  towerArt.shrine.src = 'assets/tower-warden-shrine-v1.png';
  const WORLD_W=3072,WORLD_H=3072;
  atlas.onload = () => {
    const cut = (name,x,y,w,h,threshold=44) => {
      const c=document.createElement('canvas');c.width=w;c.height=h;
      const q=c.getContext('2d',{willReadFrequently:true});q.drawImage(atlas,x,y,w,h,0,0,w,h);
      const im=q.getImageData(0,0,w,h),d=im.data;
      for(let i=0;i<d.length;i+=4){const lum=(d[i]+d[i+1]+d[i+2])/3;if(lum<threshold){d[i+3]=Math.max(0,Math.min(255,(lum-18)/(threshold-18)*255))}}
      q.putImageData(im,0,0);art[name]=c;
    };
    cut('monument',22,76,390,425,44);
    cut('bow',446,35,86,105);cut('cannon',442,158,100,118);cut('ballista',443,286,101,124);cut('mage',442,425,104,102);
    cut('infantry',795,35,66,90);cut('archer',797,121,70,84);cut('brute',918,205,104,95);cut('boss',795,397,130,132);
  };
  const $ = id => document.getElementById(id);
  const ui = { wave:$('wave'), playerHp:$('playerHp'), playerHpText:$('playerHpText'), monumentHp:$('monumentHp'), monumentHpText:$('monumentHpText'), essence:$('essence'), towerCount:$('towerCount'), towerMax:$('towerMax'), objectiveText:$('objectiveText'), enemyCount:$('enemyCount'), storyText:$('storyText'), bossHud:$('bossHud'), bossName:$('bossName'), bossHp:$('bossHp'), perk:$('perkScreen'), toast:$('toast'), start:$('startScreen'), gameover:$('gameover'), ui: null };
  let W=0,H=0,dpr=1,last=0,time=0,state='start',audioOn=true,shake=0,toastTimer=0;
  let keys={}, mouse={x:0,y:0}, touch={x:0,y:0}, facing={x:0,y:-1}, hudClock=0,camera={x:0,y:0};
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
  function ensureGameSurface() {
    if (!canvas || !ctx) {
      console.error('Denkmal 3D: Canvas-Context konnte nicht initialisiert werden.');
      try {
        const toast = $('toast');
        if (toast) {
          toast.textContent = 'SPIELFELD NICHT VERFÜGBAR';
          toast.classList.add('show');
        }
      } catch {}
      return false;
    }
    return true;
  }
  const towerSpecs={
    bow:{name:'BOGENTURM',cost:25,damage:12,rate:.50,range:250,color:'#e7c276'},
    cannon:{name:'KANONENTURM',cost:35,damage:29,rate:1.10,range:225,color:'#f08a48'},
    ballista:{name:'BALLISTATURM',cost:45,damage:45,rate:1.42,range:300,color:'#e8d9ae'},
    mage:{name:'MAGIETURM',cost:50,damage:20,rate:.72,range:270,color:'#69bfff'},
    mortar:{name:'LAVAMÖRSER',cost:62,damage:34,rate:1.55,range:330,color:'#ff7446',splash:74},
    rift:{name:'RIFTLANZE',cost:68,damage:23,rate:.42,range:285,color:'#ee58ff',chain:2},
    shrine:{name:'WÄCHTERSCHREIN',cost:58,damage:13,rate:.62,range:240,color:'#7ee5d7',heal:2.2}
  };
  const chapters=[
    {name:'DAS TOR DER ASCHE',note:'Die Asche trägt noch die Namen der Gefallenen.',until:3},
    {name:'DIE SCHLUCHT DER RISSEN',note:'Unter dem Basalt schlägt ein fremdes Licht.',until:7},
    {name:'DIE VERGLASTE KRONE',note:'Der Aschenkönig hat deine Spur aufgenommen.',until:Infinity}
  ];
  function clearInput(){keys={};touch={x:0,y:0};const joystick=$('joystick');if(joystick&&joystick.firstElementChild)joystick.firstElementChild.style.transform='translate(0,0)';}
  function focusModal(el){clearInput();document.querySelectorAll('#app > :not(.modal)').forEach(n=>n.inert=true);if(el)el.querySelector('button')?.focus();}
  function focusGame(){document.querySelectorAll('#app > :not(.modal)').forEach(n=>n.inert=false);if(canvas)canvas.focus({preventScroll:true});}
  function pauseGame(){if(state!=='playing')return;state='paused';clearInput();saga.stopVoice();const pause=$('pauseScreen');if(pause)pause.classList.remove('hidden');focusModal(pause);updateUI();}
  function resumeGame(){if(state!=='paused')return;state='playing';const pause=$('pauseScreen');if(pause)pause.classList.add('hidden');last=performance.now();focusGame();updateUI();}
  function dodge(){if(state!=='playing'||game.hero.dodgeCd>0)return;const h=game.hero;h.dodge=.18;h.dodgeCd=1.2*saga.stats(h).dodge;h.invuln=.35;h.dodgeX=facing.x;h.dodgeY=facing.y;spark(h.x,h.y,'#9af7ff',10);}
  const rand=(a,b)=>a+Math.random()*(b-a), clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);

  let game;
  function reset(level=1){
    clearInput();time=0;shake=0;facing={x:0,y:-1};
    game={level,wave:level===2?6:1,elapsed:0,essence:level===2?120:35,selectedTower:'bow',kills:0,waveSpawned:0,waveKilled:0,waveTotal:7,spawnTimer:1.2,intermission:0,
      hero:{x:WORLD_W*.5,y:WORLD_H*.5+245,r:13,hp:100,maxHp:100,speed:205,damage:18,fireRate:.47,fireCd:0,range:310,dodgeCd:0,dodge:0,invuln:0},
      monument:{x:WORLD_W*.5,y:WORLD_H*.5,r:48,hp:500,maxHp:500},
      enemies:[],bullets:[],particles:[],loot:[],towers:[],maxTowers:level===2?6:4};
    game.waveTotal=level===2?24:7;
    saga.reset(game.hero);updateCamera();ui.perk.classList.add('hidden');ui.gameover.classList.add('hidden');selectTower('bow');updateUI();
  }
  function updateCamera(){if(!game)return;camera.x=clamp(game.hero.x-W*.5,0,Math.max(0,WORLD_W-W));camera.y=clamp(game.hero.y-H*.5,0,Math.max(0,WORLD_H-H));}
  function resize(){if(!ensureGameSurface())return;dpr=Math.min(2,devicePixelRatio||1);W=innerWidth;H=innerHeight;canvas.width=W*dpr;canvas.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);if(game){updateCamera();if(state==='playing')focusGame();}}

  function chapter(){return chapters.find(c=>game.wave<=c.until)||chapters.at(-1)}
  function menuStatus(){
    const level2=$('level2Btn');if(level2)level2.disabled=!campaign.unlocked;
    const levelProgress=$('levelProgress');if(levelProgress)levelProgress.textContent=campaign.unlocked?(campaign.storageAvailable?'Level 2 freigeschaltet · jederzeit hier starten':'Level 2 freigeschaltet · Speichern blockiert, nur für diese Sitzung'):'Level 2 freigeschaltet nach Welle 5';
  }
  function closeScreens(){saga.stopVoice();for(const id of ['startScreen','pauseScreen','perkScreen','gameover','levelComplete','storyScreen','characterScreen']){const el=$(id);if(el)el.classList.add('hidden');}}
  function mainMenu(){closeScreens();clearInput();state='start';menuStatus();ui.start.classList.remove('hidden');focusModal(ui.start);updateUI();}
  function startGame(level=1){
    if(!ensureGameSurface())return;
    level=level===2?2:1;if(level===2&&!campaign.unlocked)return;
    closeScreens();reset(level);state='playing';focusGame();tone(220,.1);last=performance.now();
    if(level===1)saga.chapter(1);else showToast('LEVEL 2 · WELLE 6');updateUI();
  }
  function completeLevel(){
    campaign.unlock();saga.stopVoice();state='levelcomplete';clearInput();
    game.enemies=[];game.bullets=[];game.loot=[];
    const note=$('levelSaveNote');if(note)note.textContent=campaign.storageAvailable?'Freischaltung gespeichert. Level 2 bleibt im Hauptmenü verfügbar.':'Speichern ist im Browser blockiert. Level 2 bleibt für diese Sitzung verfügbar.';
    const levelComplete=$('levelComplete');if(levelComplete)levelComplete.classList.remove('hidden');focusModal(levelComplete);updateUI();
  }
  function showToast(t){ui.toast.textContent=t;ui.toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>ui.toast.classList.remove('show'),1500)}
  function spawnEnemy(){
    const level=campaign.levels[game.level],gateIndex=game.waveSpawned%level.gates.length;
    const {x,y}=level.gates[gateIndex];
    const boss=game.wave%5===0&&game.waveSpawned===0,brute=!boss&&game.wave>2&&Math.random()<Math.min(.28,game.wave*.035);
    const hp=boss?720*(1+game.wave*.13):(brute?85:38)*(1+game.wave*.16);
    game.enemies.push({x,y,gateIndex,waypoint:1,r:boss?34:brute?18:12,hp,maxHp:hp,speed:(boss?28:(brute?38:56)+game.wave*2)*(game.level===2?1.6:1),damage:boss?46:brute?22:11,attackCd:0,type:boss?'boss':brute?'brute':'infantry'});
    if(boss){showToast(`BOSSWELLE · ${game.wave<6?'DER BELAGERER':game.wave<11?'DIE RISSKÖNIGIN':'DER ASCHENKÖNIG'}`);tone(62,.7,.07);shake=12}
  }
  function shoot(from,target,damage,speed=520,color='#e9c477',effect={}){
    const d=dist(from,target)||1;game.bullets.push({x:from.x,y:from.y,vx:(target.x-from.x)/d*speed,vy:(target.y-from.y)/d*speed,r:effect.splash?7:4,damage,life:1.1,color,...effect});spark(from.x,from.y,color,4);
  }
  function nearest(from,range){let best=null,bd=range;for(const e of game.enemies){if(e.dead)continue;const d=dist(from,e);if(d<bd){bd=d;best=e}}return best}
  function spark(x,y,color,n=7){for(let i=0;i<n;i++)game.particles.push({x,y,vx:rand(-90,90),vy:rand(-90,90),life:rand(.2,.6),max:.6,r:rand(1,3),color})}
  function hurtEnemy(e,dmg){if(e.dead)return;const crit=Math.random()<.09;dmg*=crit?2:1;e.hp-=dmg;e.hit=.1;spark(e.x,e.y,crit?'#fff1a6':'#e6c57b',crit?12:5);if(crit){shake=3}if(e.hp<=0){game.kills++;game.essence+=6;game.waveKilled++;e.dead=true;game.loot.push({x:e.x,y:e.y,r:8,life:8})}}
  function towerPosition(){const h=game.hero,p={x:h.x+facing.x*58,y:h.y+facing.y*58};return game.level===2?(campaign.nearestSlot(p)||p):p;}
  function placementError(p){if(game.level===2&&!campaign.levels[2].slots.some(s=>dist(s,p)<1))return 'NUR AUF MARKIERTEN BAUPLÄTZEN';if(campaign.levels[game.level].gates.some(g=>dist(g,p)<75))return 'ZU NAHE AM GATE';if(Math.hypot(p.x-WORLD_W*.5,p.y-WORLD_H*.5)>1380)return 'AUSSERHALB DER FESTUNG';return null;}
  function buildTower(){
    if(state!=='playing')return;
    const spec=towerSpecs[game.selectedTower];if(game.essence<spec.cost)return showToast('NOCH '+(spec.cost-game.essence)+' ESSENZ NÖTIG');if(game.towers.length>=game.maxTowers)return showToast('TURM-LIMIT ERREICHT');
    const p=towerPosition(),error=placementError(p);if(error)return showToast(error);
    game.essence-=spec.cost;game.towers.push({...p,r:18,damage:spec.damage,fireRate:spec.rate,fireCd:.1,range:spec.range,kind:game.selectedTower,level:1,spent:spec.cost});spark(p.x,p.y,'#d9b66b',12);
  }
  function nearbyTower(){let best=null,bd=92;for(const t of game.towers){const d=dist(game.hero,t);if(d<bd){bd=d;best=t}}return best}
  function upgradeTower(){if(state!=='playing')return;const t=nearbyTower();if(!t)return showToast('GEHE NÄHER AN EINEN TURM');if(t.level>=3)return showToast('MAXIMALE AUSBAUSTUFE');const cost=30+(t.level*15);if(game.essence<cost)return showToast('NOCH '+(cost-game.essence)+' ESSENZ NÖTIG');game.essence-=cost;t.level++;t.damage*=1.18;t.range*=1.08;t.fireRate*=.9;showToast('TURM AUFSTUFE '+t.level);}
  function sellTower(){if(state!=='playing')return;const t=nearbyTower();if(!t)return showToast('GEHE NÄHER AN EINEN TURM');const refund=Math.floor(t.spent*.6);game.essence+=refund;game.towers=game.towers.filter(x=>x!==t);showToast('TURM VERKAUFT · +'+refund+' ESSENZ');}
  function selectTower(kind){if(!towerSpecs[kind])return;game.selectedTower=kind;document.querySelectorAll('.arsenal button').forEach(b=>{b.classList.toggle('selected',b.dataset.tower===kind);b.setAttribute('aria-pressed',String(b.dataset.tower===kind));});}
  function endWave(){if(state!=='playing')return;if(game.level===1&&game.wave===5){completeLevel();return;}saga.stopVoice();state='perk';game.essence+=game.loot.length*4;game.loot=[];game.enemies=[];showToast('WELLE GESCHLOSSEN');const perks=getPerks();
    const grid=$('perkGrid');grid.innerHTML='';perks.forEach((perk,index)=>{const btn=document.createElement('button');btn.type='button';btn.className='perk-card';btn.innerHTML=`<span>${perk.icon}</span><strong>${perk.name}</strong><small>${perk.desc}</small>`;btn.addEventListener('click',()=>selectPerk(perk));grid.appendChild(btn);});
    const perkScreen=$('perkScreen');if(perkScreen)perkScreen.classList.remove('hidden');focusModal(perkScreen);updateUI();
  }
  function getPerks(){const pool=[
    {name:'Eiserner Eid',icon:'✦',desc:'+25 maximale und aktuelle Hüter-LP.',apply:g=>{g.hero.maxHp+=25;g.hero.hp+=25}},
    {name:'Arkebusenmeister',icon:'◆',desc:'+30 % Feuerrate des Hüters.',apply:g=>g.hero.fireRate=Math.max(.09,g.hero.fireRate/1.3)},
    {name:'Vergoldete Klinge',icon:'✧',desc:'+8 Schaden pro Geschoss.',apply:g=>g.hero.damage+=8},
    {name:'Steinmetzsegen',icon:'⬟',desc:'Heilt das Monument um 140 LP.',apply:g=>g.monument.hp=Math.min(g.monument.maxHp,g.monument.hp+140)},
    {name:'Festungsplan',icon:'▲',desc:'+1 maximales Turmlimit und 20 Essenz.',apply:g=>{g.maxTowers++;g.essence+=20}},
    {name:'Marschtritt',icon:'➹',desc:'+15 % Bewegungstempo.',apply:g=>g.hero.speed*=1.15}
  ];for(let i=pool.length-1;i>0;i--){const k=Math.floor(Math.random()*(i+1));[pool[i],pool[k]]=[pool[k],pool[i]]}return pool.slice(0,3)}
  function selectPerk(p){if(state!=='perk')return;p.apply(game);game.wave++;game.waveSpawned=0;game.waveKilled=0;game.waveTotal=6+game.wave*3;game.spawnTimer=1.2;game.hero.hp=Math.min(game.hero.maxHp,game.hero.hp+12);state='playing';const perkScreen=$('perkScreen');if(perkScreen)perkScreen.classList.add('hidden');last=performance.now();focusGame();updateUI();}
  function gameOver(){saga.stopVoice();state='gameover';$('gameoverTitle').textContent=game.monument.hp<=0?'DAS MONUMENT IST GEFALLEN':'DER HÜTER IST GEFALLEN';ui.gameoverStats.textContent=`${game.kills} FEINDE ERLEGT · ${game.wave} WELLE`;ui.gameover.classList.remove('hidden');focusModal(ui.gameover);updateUI();}

  function update(dt){
    if(!game||!ensureGameSurface())return;time+=dt;game.elapsed+=dt;const h=game.hero,m=game.monument,heroStats=saga.stats(h);
    h.fireCd-=dt;h.dodgeCd-=dt;h.invuln-=dt;if(h.dodge>0)h.dodge-=dt;
    let dx=((keys.KeyD||keys.ArrowRight)?1:0)-((keys.KeyA||keys.ArrowLeft)?1:0)+touch.x,dy=((keys.KeyS||keys.ArrowDown)?1:0)-((keys.KeyW||keys.ArrowUp)?1:0)+touch.y;const len=Math.hypot(dx,dy);if(len>0){dx/=len;dy/=len;const speed=h.speed*(h.dodge>0?1.8:1);h.x=clamp(h.x+dx*speed*dt,80,WORLD_W-80);h.y=clamp(h.y+dy*speed*dt,80,WORLD_H-80);if(len>.05){facing={x:dx,y:dy};}}
    if(mouse.x||mouse.y){const mx=mouse.x-camera.x,my=mouse.y-camera.y;const d=Math.hypot(mx-h.x,my-h.y);if(d>10){facing={x:(mx-h.x)/d,y:(my-h.y)/d};}}
    const target=nearest(h,h.range);if(target&&h.fireCd<=0){shoot(h,target,heroStats.damage,560,h.equipment.weapon==='echo'?'#9affdf':'#ffb16a');saga.onAttack();h.fireCd=heroStats.rate;}
    if(game.waveSpawned<game.waveTotal){game.spawnTimer-=dt;if(game.spawnTimer<=0){spawnEnemy();game.waveSpawned++;game.spawnTimer=Math.max(.32,1.15-game.wave*.035)}}
    for(const t of game.towers){t.fireCd-=dt;const e=nearest(t,t.range);const spec=towerSpecs[t.kind];if(t.kind==='shrine')m.hp=Math.min(m.maxHp,m.hp+spec.heal*dt*t.level);if(e&&t.fireCd<=0){shoot(t,e,t.damage,420,spec.color,{splash:spec.splash||0});t.fireCd=1/spec.rate;}}
    for(const b of game.bullets){b.x+=b.vx*dt;b.y+=b.vy*dt;b.life-=dt;for(const e of game.enemies){if(e.dead)continue;const d=Math.hypot(b.x-e.x,b.y-e.y);if(d<e.r+b.r){hurtEnemy(e,b.damage);if(b.splash){for(const hit of game.enemies.filter(x=>!x.dead&&dist(x,e)<b.splash)){hurtEnemy(hit,b.damage*.45)}}b.life=0;break;}}}
    game.bullets=game.bullets.filter(b=>b.life>0);
    for(const e of game.enemies){
      if(e.dead)continue;e.hit-=dt;e.attackCd-=dt;
      const targetObj=dist(e,h)<dist(e,m)?h:m;const d=dist(e,targetObj)||1;if(d>e.r+targetObj.r){const step=Math.min(e.speed*dt,d-e.r-targetObj.r);e.x+=(targetObj.x-e.x)/d*step;e.y+=(targetObj.y-e.y)/d*step;}else if(e.attackCd<=0){if(targetObj===h&&h.invuln<=0)saga.damage(e.damage);else if(targetObj===m)m.hp-=e.damage;e.attackCd=.85;shake=8;spark(targetObj.x,targetObj.y,'#b7533d',8);}
    }
    game.enemies=game.enemies.filter(e=>!e.dead);
    for(const l of game.loot){l.life-=dt;const d=dist(l,h);if(d<120){l.x+=(h.x-l.x)*dt*5;l.y+=(h.y-l.y)*dt*5}if(l.life>0&&d<20){game.essence+=4;l.life=0;}}
    game.loot=game.loot.filter(l=>l.life>0);
    for(const p of game.particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.96;p.vy*=.96;p.life-=dt}game.particles=game.particles.filter(p=>p.life>0);
    if(h.hp<=0||m.hp<=0)gameOver();else if(game.waveSpawned>=game.waveTotal&&game.enemies.length===0)endWave();hudClock+=dt;if(hudClock>=.08||state!=='playing'){updateUI();hudClock=0;}
  }
  function segmentDistance(e,b){const dx=b.x-b.prevX,dy=b.y-b.prevY;const t=clamp(((e.x-b.prevX)*dx+(e.y-b.prevY)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(e.x-(b.prevX+t*dx),e.y-(b.prevY+t*dy));}
  function updateUI(){if(!game)return;saga.updateUI();const h=game.hero,m=game.monument;ui.wave.textContent=game.wave;$('levelLabel').textContent=`LEVEL ${game.level}`;ui.playerHp.style.width=`${(h.hp/h.maxHp)*100}%`;ui.playerHpText.textContent=`${Math.ceil(h.hp)} / ${h.maxHp}`;ui.monumentHp.style.width=`${(m.hp/m.maxHp)*100}%`;ui.monumentHpText.textContent=`${Math.ceil(m.hp)} / ${m.maxHp}`;ui.essence.textContent=String(game.essence);ui.towerCount.textContent=String(game.towers.length);ui.towerMax.textContent=String(game.maxTowers);const objective=$('objectiveText');if(objective)objective.textContent=`WELLE ${game.wave}`;const enemyCount=$('enemyCount');if(enemyCount)enemyCount.textContent=`${Math.max(0,game.waveTotal-game.waveSpawned+game.enemies.length)} FEINDE VERBLEIBEN`;const storyText=$('storyText');if(storyText)storyText.textContent=chapters[Math.min(chapters.length-1,game.wave-1)]?.name||'DAS TOR ZUR ASCHE ÖFFNET SICH';const bossHud=$('bossHud');if(bossHud){const boss=game.enemies.find(e=>e.type==='boss');bossHud.classList.toggle('hidden',!boss);if(boss){$('bossName').textContent='DER BELAGERER';$('bossHp').style.width=`${(boss.hp/boss.maxHp)*100}%`;}}}
  function diamond(x,y,w,h,fill,stroke){ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x+w,y);ctx.lineTo(x,y+h);ctx.lineTo(x-w,y);ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.stroke();}}
  function drawGround(){
    ctx.fillStyle='#120604';ctx.fillRect(0,0,WORLD_W,WORLD_H);
    if(hellscape.complete&&hellscape.naturalWidth)ctx.drawImage(hellscape,0,0,WORLD_W,WORLD_H);else{const g=ctx.createRadialGradient(WORLD_W*.5,WORLD_H*.5,50,WORLD_W*.5,WORLD_H*.5,WORLD_W*.7);g.addColorStop(0,'#3b1a17');g.addColorStop(.7,'#0e0a09');g.addColorStop(1,'#090505');ctx.fillStyle=g;ctx.fillRect(0,0,WORLD_W,WORLD_H);}
    const vignette=ctx.createRadialGradient(WORLD_W*.5,WORLD_H*.5,180,WORLD_W*.5,WORLD_H*.5,WORLD_W*.72);vignette.addColorStop(0,'rgba(0,0,0,0)');vignette.addColorStop(1,'rgba(10,0,0,.38)');ctx.fillStyle=vignette;ctx.fillRect(0,0,WORLD_W,WORLD_H);
    ctx.save();ctx.translate(game.monument.x,game.monument.y);ctx.rotate(time*.015);ctx.strokeStyle='#bca16a28';ctx.lineWidth=2;for(let r of [105,132]){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.stroke();}ctx.restore();
  }
  function drawLevel(){
    const level=campaign.levels[game.level];ctx.save();ctx.lineJoin='round';ctx.lineCap='round';
    for(const path of level.paths){
      ctx.beginPath();path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
      ctx.strokeStyle='#161b1bef';ctx.lineWidth=96;ctx.stroke();
      ctx.strokeStyle='#76694bdd';ctx.lineWidth=72;ctx.stroke();
      ctx.setLineDash([12,22]);ctx.strokeStyle='#d8bb7755';ctx.lineWidth=2;ctx.stroke();ctx.setLineDash([]);
    }
    for(const p of level.slots){if(game.towers.some(t=>dist(t,p)<20))continue;ctx.strokeStyle='#d6c38c';ctx.fillStyle='#14201fdd';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,25,0,Math.PI*2);ctx.fill();ctx.stroke();}
    level.gates.forEach((p,i)=>{ctx.fillStyle='#171719';ctx.strokeStyle='#cf8d52';ctx.lineWidth=5;ctx.fillRect(p.x-38,p.y-38,76,76);ctx.strokeRect(p.x-38,p.y-38,76,76);ctx.fillStyle='#a64b2b';ctx.fillRect(p.x-26,p.y-26,52,52);});
    ctx.restore();
  }
  function shadow(x,y,r){ctx.beginPath();ctx.ellipse(x,y+r*.65,r*1.25,r*.48,0,0,Math.PI*2);ctx.fillStyle='#0008';ctx.fill()}
  function drawMonument(m){shadow(m.x,m.y,70);if(art.monument){ctx.save();ctx.translate(m.x,m.y+10);ctx.shadowBlur=25;ctx.shadowColor='#d0ad5a55';ctx.drawImage(art.monument,-96,-112,192,218);ctx.restore();}}
  function drawHero(h){saga.draw(ctx,h)}
  function drawEnemy(e){shadow(e.x,e.y,e.r);const sprite=art[e.type==='boss'?'boss':e.type==='brute'?'brute':(game.wave%3===0?'archer':'infantry')];if(sprite){const s=e.type==='boss'?104:e.type=='brute'?75:42;ctx.drawImage(sprite,e.x-s/2,e.y-s/2,s,s);}}
  function drawTower(t){shadow(t.x,t.y,24);const kind=t.kind||'bow',levelSprite=towerLevelArt[kind]?.[Math.max(0,Math.min(2,(t.level||1)-1))],sprite=levelSprite?.complete ? levelSprite : towerArt[kind];if(sprite&&sprite.complete){ctx.save();ctx.translate(t.x,t.y);ctx.drawImage(sprite,-26,-26,52,52);ctx.restore();}}
  function draw(){if(!game||!ensureGameSurface())return;ctx.save();if(shake>0&&!reducedMotion){ctx.translate(rand(-shake,shake),rand(-shake,shake));shake*=.82;if(shake<.3)shake=0}ctx.translate(-camera.x,-camera.y);drawGround();drawLevel();for(const t of game.towers)drawTower(t);for(const e of game.enemies)drawEnemy(e);for(const b of game.bullets){ctx.fillStyle=b.color;ctx.beginPath();ctx.arc(b.x,b.y,Math.max(3,b.r),0,Math.PI*2);ctx.fill();}for(const p of game.particles){ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,p.r,p.r);}for(const l of game.loot){ctx.fillStyle='#7ee5d7';ctx.beginPath();ctx.arc(l.x,l.y,7,0,Math.PI*2);ctx.fill();}drawMonument(game.monument);drawHero(game.hero);ctx.restore();
    if(state==='playing'&&game.essence>=towerSpecs[game.selectedTower].cost&&game.towers.length<game.maxTowers){const p=towerPosition();ctx.save();ctx.strokeStyle=placementError(p)?'#ed826f':'#e8c882';ctx.lineWidth=2;ctx.beginPath();ctx.arc(p.x,p.y,26,0,Math.PI*2);ctx.stroke();ctx.restore();}
  }
  function loop(now){if(!ensureGameSurface())return;const dt=Math.min(.034,(now-last)/1000||0);last=now;update(dt);draw();requestAnimationFrame(loop)}
  function tone(freq,dur=.05,vol=.035){if(!audioOn)return;try{const ac=tone.ac||(tone.ac=new (AudioContext||webkitAudioContext)());if(ac.state==='suspended')void ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=freq;g.gain.value=vol;o.connect(g);g.connect(ac.destination);o.start();g.gain.setValueAtTime(vol,ac.currentTime);g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.stop(ac.currentTime+dur);}catch{}}
  addEventListener('resize',resize);
  addEventListener('blur',()=>{clearInput();saga.stopVoice();pauseGame();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();saga.stopVoice();pauseGame();}});
  addEventListener('keydown',e=>{
    const active=document.querySelector('.modal:not(.hidden)');
    if(e.code==='Tab'&&active){const buttons=[...active.querySelectorAll('button')];if(buttons.length){const i=buttons.indexOf(document.activeElement);e.preventDefault();buttons[(i+(e.shiftKey?-1:1)+buttons.length)%buttons.length].focus();}}
    if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&state==='playing')e.preventDefault();
    if(e.code==='KeyH'&&!e.repeat){state==='character'?saga.closeCharacter():saga.openCharacter();return;}
    if(e.code==='Escape'&&state==='character'){saga.closeCharacter();return;}
    if(e.code==='Escape'||e.code==='KeyP'){if(!e.repeat){e.preventDefault();state==='paused'?resumeGame():pauseGame();}return;}
    if(state==='playing')keys[e.code]=true;
    if(e.repeat)return;
    if(e.code==='Space'&&state==='playing')dodge();
    if(e.code==='KeyF'&&state==='playing')saga.unleash();
    if(e.code==='KeyE'&&state==='playing')buildTower();
    if(e.code==='KeyQ'&&state==='playing')upgradeTower();
    if(e.code==='KeyX'&&state==='playing')sellTower();
    if(state==='playing'&&/^Digit[1-7]$/.test(e.code))selectTower(['bow','cannon','ballista','mage','mortar','rift','shrine'][+e.code.slice(-1)-1]);
    if(e.code==='KeyR'&&state==='gameover')startGame(game.level);
    if(state==='perk'&&['Digit1','Digit2','Digit3'].includes(e.code))ui.perk.children[+e.code.slice(-1)-1]?.click();
  });
  addEventListener('keyup',e=>keys[e.code]=false);
  canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='mouse')return;mouse={x:e.clientX+camera.x,y:e.clientY+camera.y};const d=dist(mouse,game.hero);if(d>5)facing={x:(mouse.x-game.hero.x)/d,y:(mouse.y-game.hero.y)/d};});
  const stick=$('joystick');let pointerId=null;
  function moveStick(e){if(e.pointerId!==pointerId)return;const r=stick.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,len=Math.hypot(dx,dy),scale=Math.min(1,Math.max(0,(len-6)/(r.width*.35)));if(len>0){const nx=dx/len,ny=dy/len;touch={x:nx*scale,y:ny*scale};if(stick.firstElementChild)stick.firstElementChild.style.transform=`translate(${nx*scale*(r.width*.32)}px,${ny*scale*(r.height*.32)}px)`;}else{touch={x:0,y:0};if(stick.firstElementChild)stick.firstElementChild.style.transform='translate(0,0)';}}
  stick.addEventListener('pointerdown',e=>{if(state!=='playing'||pointerId!==null)return;pointerId=e.pointerId;stick.setPointerCapture(pointerId);moveStick(e);});
  stick.addEventListener('pointermove',moveStick);
  function releaseStick(e){if(e.pointerId!==pointerId)return;pointerId=null;touch={x:0,y:0};if(stick.firstElementChild)stick.firstElementChild.style.transform='translate(0,0)';}
  for(const event of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(event,releaseStick);
  $('startBtn').onclick=()=>startGame(1);$('level2Btn').onclick=()=>startGame(2);$('nextLevelBtn').onclick=()=>startGame(2);$('completeMenuBtn').onclick=mainMenu;$('pauseMenuBtn').onclick=mainMenu;$('gameoverMenuBtn').onclick=mainMenu;$('restartBtn').onclick=()=>startGame(game.level);$('resumeBtn').onclick=resumeGame;document.querySelectorAll('.arsenal button').forEach(b=>b.onclick=()=>{if(state==='playing'){selectTower(b.dataset.tower);canvas.focus();}});
  $('upgradeBtn').onclick=()=>{upgradeTower();updateUI();canvas.focus();};$('sellBtn').onclick=()=>{sellTower();updateUI();canvas.focus();};
  try{audioOn=localStorage.getItem('denkmal-sound')!=='off';}catch{}
  function soundLabel(){$('soundBtn').textContent=`TON: ${audioOn?'AN':'AUS'}`;$('soundBtn').setAttribute('aria-pressed',String(audioOn));}
  $('soundBtn').onclick=()=>{audioOn=!audioOn;if(!audioOn)saga.stopVoice();soundLabel();try{localStorage.setItem('denkmal-sound',audioOn?'on':'off');}catch{}if(audioOn)tone(440,.1);};soundLabel();
  atlas.onerror=()=>showToast('GRAFIK KONNTE NICHT GELADEN WERDEN');
  saga.init({getGame:()=>game,getState:()=>state,setState:s=>{state=s;last=performance.now();},focusModal,focusGame,clearInput,updateUI,soundOn:()=>audioOn,hurtEnemy,spark,tone,nearest,shoot});
  resize();reset();menuStatus();focusModal(ui.start);requestAnimationFrame(loop);
})();
