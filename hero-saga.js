/* Kael: character, equipment, dialogue and animation. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const equipment = {
    weapon: [
      {id:'ember', name:'Abendrot', label:'Glutklinge', wave:1, desc:'Schwere Seelenschnitte. +25 % Angriffsschaden.', detail:'Die Klinge wurde aus der Glocke des alten Tores geschmiedet.', color:'#ffb36c'},
      {id:'echo', name:'Nachhall', label:'Echo-Klinge', wave:4, desc:'30 % kürzere Angriffspausen. Zwei zusätzliche Seelenechos beim Ruf.', detail:'Jeder Hieb antwortet einer Stimme, die du zurückgeholt hast.', color:'#9af8ed'}
    ],
    armor: [
      {id:'oath', name:'Der gebrochene Eid', label:'Wächterrüstung', wave:1, desc:'25 % weniger erlittener Schaden.', detail:'Die Delle über dem Herzen stammt aus der Nacht, in der du das Tor geöffnet hast.', color:'#e3c489'},
      {id:'ash', name:'Aschenläufer', label:'Runenmantel', wave:3, desc:'+20 % Lauftempo. Ausweichen lädt 30 % schneller nach.', detail:'Mara nähte die erste Rune in diesen Mantel. Sie weist immer nach Hause.', color:'#d87663'}
    ],
    relic: [
      {id:'lantern', name:'Maras Laterne', label:'Seelenlicht', wave:1, desc:'Der Seelenruf heilt dich um 25 LP.', detail:'Eine Flamme, die selbst unter der Asche noch deinen Namen kennt.', color:'#8cf0dc'},
      {id:'bell', name:'Die letzte Glocke', label:'Namenreliquie', wave:8, desc:'+40 % Seelenruf-Schaden. Jeder besiegte Feind lädt 1 Punkt zusätzlich.', detail:'Sie läutet erst, wenn der letzte vergessene Name gesprochen wurde.', color:'#f4c671'}
    ]
  };
  const lines = {
    intro:'Ich bin Kael. Früher bewachte ich dieses Tor. Dann öffnete ich es. Heute hole ich die Namen zurück, die das Feuer verschlungen hat.',
    chapter2:'Mara? Ich höre dich zwischen den Steinen. Wenn ein Funke von dir geblieben ist, finde ich ihn.',
    chapter3:'Das Denkmal ist kein Grab. Es ist ein Gefängnis. Und ich habe den Schlüssel die ganze Zeit getragen.',
    ultimate:'Kein Name geht verloren!',
    lowhp:'Noch ein Atemzug. Für die, die keinen mehr haben.',
    ending:'Hörst du die Glocken, Mara? Sie läuten nicht für die Toten. Sie läuten für die Heimkehrenden.'
  };
  const story = [
    {wave:1, id:'intro', kicker:'PROLOG · EIN NAME IN DER ASCHE', title:'Das Tor, das du geöffnet hast.', text:'Kael war der Wächter dieses Tores. Als seine Schwester Mara auf der anderen Seite rief, brach er das Siegel. Die Stadt verschwand im Feuer. Nur ihre Laterne brennt noch.', objective:'Beschütze das Denkmal. Sammle Namen im Kampf und entfessle mit F den Seelenruf.', reward:'Ausrüstung und Chronik öffnest du mit H.'},
    {wave:4, id:'chapter2', kicker:'KAPITEL I · DIE STIMME', title:'Sie kennt deinen Namen.', text:'Zwischen den Rissen flüstert Mara. Jeder gerettete Name macht ihre Stimme klarer. Vielleicht ist sie nie gestorben. Vielleicht wartet sie auf dich.', objective:'Halte die Wacht bis zum nächsten Siegel. Die Echo-Klinge ist jetzt verfügbar.', reward:'NEUE AUSRÜSTUNG · NACHHALL'},
    {wave:8, id:'chapter3', kicker:'KAPITEL II · DAS GEFÄNGNIS', title:'Du trägst den Schlüssel.', text:'Unter dem Denkmal sind die Namen der Stadt eingeschlossen. Der Aschenkönig nährt sich von ihrem Vergessen. Maras Laterne ist der Schlüssel, mit dem du sie befreien kannst.', objective:'Überstehe Welle 15 und bezwinge den Aschenkönig. Rüste die letzte Glocke aus oder vertraue weiter auf Maras Licht.', reward:'NEUE AUSRÜSTUNG · DIE LETZTE GLOCKE'},
    {wave:16, id:'ending', kicker:'EPILOG · DIE HEIMKEHR', title:'Und die Glocken antworten.', text:'Der letzte Name löst sich aus dem Stein. Maras Stimme ist nun kein Flüstern mehr. Am anderen Ende der Brücke wartet sie. Du hast das Tor ein zweites Mal geöffnet. Diesmal führt es nach Hause.', objective:'Kaels Geschichte ist abgeschlossen. Du kannst die Wacht als endlose Herausforderung fortsetzen.', reward:'DIE NAMEN SIND FREI'}
  ];
  const art = {};
  for (const [key, file] of Object.entries({idle:'kael-idle-v1.png',stepA:'kael-step-a-v1.png',stepB:'kael-step-b-v1.png'})) {
    const img = new Image();
    img.src = `assets/hero/${file}`;
    art[key] = img;
  }
  let api, currentAudio=null, voiceEnabled=true, captionTimer=0, voiceGeneration=0, currentStory=null, returnState='playing';
  let selectedTab='equipment', lowHpSpoken=false, storySeen=new Set(), animationTime=0;
  let pulse=null, echoes=[], trail=[], attackTime=0, walkTime=0;
  const getHero = () => api.getGame().hero;
  const ready = img => img && img.complete && img.naturalWidth > 0;
  const item = (h, slot) => equipment[slot].find(i=>i.id===h.equipment[slot]);

  function reset(h) {
    stopVoice();
    h.equipment={weapon:'ember',armor:'oath',relic:'lantern'};
    h.soul=100;h.moving=false;h.faceX=1;h.hitFlash=0;
    lowHpSpoken=false;storySeen=new Set();pulse=null;echoes=[];trail=[];attackTime=0;walkTime=0;animationTime=0;
    $('storyScreen').classList.add('hidden');$('characterScreen').classList.add('hidden');
    $('subtitle').classList.add('hidden');$('sagaComplete').classList.add('hidden');
  }
  function stats(h) {
    return {damage:h.damage*(h.equipment.weapon==='ember'?1.25:1), rate:h.fireRate*(h.equipment.weapon==='echo'?.7:1), speed:h.speed*(h.equipment.armor==='ash'?1.2:1), armor:h.equipment.armor==='oath'?.75:1, dodge:h.equipment.armor==='ash'?.7:1};
  }
  function stopVoice() {
    voiceGeneration++;
    if(currentAudio){currentAudio.pause();currentAudio=null;}
    if(globalThis.speechSynthesis)globalThis.speechSynthesis.cancel();
    clearTimeout(captionTimer);
    $('subtitle').classList.add('hidden');
  }
  function voiceLabel() {
    $('voiceBtn').textContent=`STIMME: ${voiceEnabled?'AN':'AUS'}`;
    $('voiceBtn').setAttribute('aria-pressed',String(voiceEnabled));
  }
  function say(id, inStory=false) {
    if(!lines[id])return;
    stopVoice();
    if(!inStory){$('subtitleText').textContent=lines[id];$('subtitle').classList.remove('hidden');captionTimer=setTimeout(()=>$('subtitle').classList.add('hidden'),Math.max(4500,lines[id].length*62));}
    if(!voiceEnabled||!api.soundOn())return;
    const generation=voiceGeneration;
    const audio=$('heroVoice');audio.src=`assets/hero/voice/${id}.mp3`;currentAudio=audio;audio.volume=.82;
    const fallback=()=>{
      if(generation!==voiceGeneration||!voiceEnabled||!api.soundOn()||!globalThis.speechSynthesis||!globalThis.SpeechSynthesisUtterance)return;
      const utterance=new SpeechSynthesisUtterance(lines[id]);utterance.lang='de-DE';utterance.rate=.92;utterance.pitch=.85;
      utterance.voice=speechSynthesis.getVoices().find(v=>v.lang.startsWith('de'))||null;
      speechSynthesis.speak(utterance);
    };
    audio.onerror=fallback;
    const playing=audio.play();if(playing?.catch)playing.catch(()=>{});
  }
  function chapter(wave) {
    const entry=story.find(s=>s.wave===wave);
    if(!entry||storySeen.has(entry.id))return false;
    stopVoice();storySeen.add(entry.id);currentStory=entry;
    api.setState('story');api.clearInput();
    $('storyKicker').textContent=entry.kicker;$('storyTitle').textContent=entry.title;
    $('storyBody').textContent=entry.text;$('storyQuote').textContent=`„${lines[entry.id]}“`;
    $('storyObjective').textContent=entry.objective;$('storyReward').textContent=entry.reward;
    $('storyContinue').textContent=entry.id==='ending'?'ENDLOSE WACHT BEGINNEN':'WEITER ZUR WACHT';
    $('storyScreen').classList.remove('hidden');api.focusModal($('storyScreen'));say(entry.id,true);return true;
  }
  function continueStory() {
    if(api.getState()!=='story')return;
    stopVoice();$('storyScreen').classList.add('hidden');api.setState('playing');api.focusGame();
    if(currentStory?.id==='ending')$('sagaComplete').classList.remove('hidden');
    currentStory=null;api.updateUI();
  }
  function renderCharacter() {
    const h=getHero(), g=api.getGame(), s=stats(h);
    $('characterStats').textContent=`${Math.round(s.damage)} Schaden · ${(1/s.rate).toFixed(1)} Angriffe/s · ${Math.round(s.speed)} Tempo`;
    $('characterLevel').textContent=`WELLE ${g.wave} · ${storySeen.has('ending')?'BEFREIER DER NAMEN':'DER LETZTE NAMENSTRÄGER'}`;
    $('equippedNames').textContent=Object.keys(equipment).map(slot=>item(h,slot).name).join(' · ');
    const display=$('characterPreview');display.dataset.armor=h.equipment.armor;display.dataset.weapon=h.equipment.weapon;
    display.dataset.relic=h.equipment.relic;
    $('equipmentPanel').classList.toggle('hidden',selectedTab!=='equipment');$('journalPanel').classList.toggle('hidden',selectedTab!=='journal');
    $('equipmentTab').setAttribute('aria-selected',String(selectedTab==='equipment'));$('journalTab').setAttribute('aria-selected',String(selectedTab==='journal'));
    const grid=$('gearGrid');grid.innerHTML='';
    for(const [slot, options] of Object.entries(equipment)){
      const section=document.createElement('section');section.className='gear-slot';
      const heading=document.createElement('h3');heading.textContent={weapon:'01 / WAFFE',armor:'02 / RÜSTUNG',relic:'03 / RELIKT'}[slot];section.appendChild(heading);
      for(const option of options){
        const unlocked=g.wave>=option.wave, equipped=h.equipment[slot]===option.id;
        const button=document.createElement('button');button.type='button';button.className=`gear-card${equipped?' equipped':''}`;button.disabled=!unlocked;
        button.setAttribute('aria-pressed',String(equipped));
        button.innerHTML=`<small>${option.label}</small><strong>${option.name}</strong><span>${option.desc}</span><em>${equipped?'ANGELEGT':unlocked?'ANLEGEN':`AB WELLE ${option.wave}`}</em>`;
        button.title=option.detail;
        button.onclick=()=>{equip(slot,option.id);};section.appendChild(button);
      }grid.appendChild(section);
    }
    const journal=$('journalEntries');journal.innerHTML='';
    for(const entry of story){const block=document.createElement('article');const known=storySeen.has(entry.id);block.className='journal-entry';block.innerHTML=`<small>${known?entry.kicker:`ERINNERUNG · AB WELLE ${entry.wave}`}</small><h3>${known?entry.title:'Noch unter Asche verborgen'}</h3><p>${known?entry.text:'Setze Kaels Wacht fort, um diese Erinnerung zu finden.'}</p>`;journal.appendChild(block);}
  }
  function equip(slot,id) {
    if(api.getState()!=='character')return false;
    const option=equipment[slot]?.find(i=>i.id===id);if(!option||api.getGame().wave<option.wave)return false;
    getHero().equipment[slot]=id;renderCharacter();api.tone(420,.06);api.updateUI();return true;
  }
  function openCharacter() {
    if(!['playing','paused'].includes(api.getState()))return;
    returnState=api.getState();api.setState('character');api.clearInput();stopVoice();renderCharacter();
    $('characterScreen').classList.remove('hidden');api.focusModal($('characterScreen'));api.updateUI();
  }
  function closeCharacter() {
    if(api.getState()!=='character')return;
    $('characterScreen').classList.add('hidden');api.setState(returnState);
    if(returnState==='paused')api.focusModal($('pauseScreen'));else api.focusGame();api.updateUI();
  }
  function onKill(enemy) { const h=getHero();h.soul=clamp(h.soul+(enemy.type==='boss'?25:8)+(h.equipment.relic==='bell'?1:0),0,100); }
  function onAttack() { attackTime=.24; }
  function damage(amount) {
    const h=getHero();h.hp-=amount*stats(h).armor;h.hitFlash=.16;
    if(h.hp>0&&h.hp/h.maxHp<.3&&!lowHpSpoken){lowHpSpoken=true;say('lowhp');}
  }
  function unleash() {
    const h=getHero();if(api.getState()!=='playing'||h.soul<100)return false;
    h.soul=0;h.invuln=Math.max(h.invuln,1.1);const power=h.equipment.relic==='bell'?1.4:1;
    if(h.equipment.relic==='lantern')h.hp=Math.min(h.maxHp,h.hp+25);
    pulse={x:h.x,y:h.y,life:.8,max:.8};
    for(const enemy of api.getGame().enemies){if(!enemy.dead&&distance(h,enemy)<270)api.hurtEnemy(enemy,(70+h.damage*2)*power);}
    const count=h.equipment.weapon==='echo'?5:3;
    echoes=Array.from({length:count},(_,i)=>({angle:i*Math.PI*2/count,life:5,fire:.3+i*.14}));
    say('ultimate');api.spark(h.x,h.y,'#96ffdf',32);api.tone(180,.4,.05);api.updateUI();return true;
  }
  function update(dt,moving,face) {
    const h=getHero();animationTime+=dt;h.moving=moving;
    if(Math.abs(face.x)>.12)h.faceX=Math.sign(face.x);
    if(moving)walkTime+=dt;else walkTime=0;
    attackTime=Math.max(0,attackTime-dt);h.hitFlash=Math.max(0,h.hitFlash-dt);
    if(h.hp/h.maxHp>.6)lowHpSpoken=false;
    if(h.dodge>0&&!reduced){trail.push({x:h.x,y:h.y,life:.2,face:h.faceX});if(trail.length>8)trail.shift();}
    for(const t of trail)t.life-=dt;trail=trail.filter(t=>t.life>0);
    if(pulse){pulse.life-=dt;if(pulse.life<=0)pulse=null;}
    for(const echo of echoes){
      echo.life-=dt;if(!reduced)echo.angle+=dt*1.7;echo.fire-=dt;
      const from={x:h.x+Math.cos(echo.angle)*70,y:h.y+Math.sin(echo.angle)*42};
      const enemy=api.nearest(from,300);
      if(enemy&&echo.fire<=0){api.shoot(from,enemy,14,520,'#94ffe1');echo.fire=.65;}
    }echoes=echoes.filter(e=>e.life>0);
  }
  function drawSprite(ctx,img,x,y,face,opacity=1,size=90) {
    if(!ready(img))return false;
    ctx.save();ctx.translate(x,y);ctx.scale(face,1);ctx.globalAlpha=opacity;
    const height=size,width=size*img.naturalWidth/img.naturalHeight;
    ctx.drawImage(img,-width/2,-height*.81,width,height);ctx.restore();return true;
  }
  function draw(ctx,h) {
    const moving=h.moving&&!reduced, phase=Math.floor(walkTime*9)%4;
    const img=moving?([art.stepA,art.idle,art.stepB,art.idle][phase]):art.idle;
    const sprite=ready(img)?img:art.idle;
    for(const t of trail)drawSprite(ctx,sprite,t.x,t.y,t.face,t.life/.2*.28);
    ctx.save();ctx.translate(h.x,h.y);
    ctx.fillStyle='#0009';ctx.beginPath();ctx.ellipse(0,11,20,7,0,0,Math.PI*2);ctx.fill();
    const relicColor=h.equipment.relic==='bell'?'#f5c572':'#8effde';
    ctx.strokeStyle=relicColor;ctx.globalAlpha=.36;ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(0,12,25,10,0,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
    if(h.equipment.armor==='oath'){ctx.strokeStyle='#dfc79155';ctx.beginPath();ctx.arc(0,-20,33,-.8,.8);ctx.stroke();}
    const bob=reduced?0:moving?Math.sin(walkTime*18)*1.8:Math.sin(animationTime*2.4)*.8;
    ctx.translate(0,bob);if(!reduced)ctx.rotate(h.dodge>0?h.faceX*.17:attackTime>0?-h.faceX*Math.sin(attackTime/.24*Math.PI)*.06:0);
    ctx.shadowColor=relicColor;ctx.shadowBlur=h.dodge>0?20:5;
    if(h.hitFlash>0)ctx.filter='brightness(1.8)';
    if(!drawSprite(ctx,sprite,0,0,h.faceX)){ctx.fillStyle='#e9dcc2';ctx.beginPath();ctx.arc(0,-18,12,0,Math.PI*2);ctx.fill();}
    ctx.filter='none';ctx.shadowBlur=0;
    if(attackTime>0){ctx.save();ctx.scale(h.faceX,1);ctx.strokeStyle=item(h,'weapon').color;ctx.lineWidth=3;ctx.globalAlpha=attackTime/.24;ctx.beginPath();ctx.arc(0,-24,40,-1.2,1.1);ctx.stroke();ctx.restore();}
    if(h.equipment.weapon==='echo'){ctx.fillStyle='#a4ffed';ctx.beginPath();ctx.arc(24*h.faceX,-25,3,0,Math.PI*2);ctx.fill();}
    ctx.restore();
    for(const echo of echoes)drawSprite(ctx,art.idle,h.x+Math.cos(echo.angle)*70,h.y+Math.sin(echo.angle)*42,h.faceX,Math.min(.42,echo.life*.42),78);
    if(pulse){ctx.save();ctx.globalAlpha=pulse.life/pulse.max;ctx.strokeStyle='#9affdf';ctx.lineWidth=4;ctx.beginPath();ctx.arc(pulse.x,pulse.y,reduced?270:270*(1-pulse.life/pulse.max),0,Math.PI*2);ctx.stroke();ctx.restore();}
  }
  function updateUI() {
    const h=getHero(),playing=api.getState()==='playing';
    $('soulFill').style.width=`${h.soul}%`;$('soulValue').textContent=`${Math.floor(h.soul)} / 100`;
    $('soulBtn').disabled=!playing||h.soul<100;$('soulBtn').classList.toggle('ready',playing&&h.soul>=100);
    $('soulText').textContent=h.soul>=100?'SEELENRUF':`SEELENRUF · ${Math.floor(h.soul)} %`;
    $('heroBtn').disabled=!['playing','paused','character'].includes(api.getState());
    $('heroGearLabel').textContent=`${item(h,'weapon').name} · ${item(h,'relic').name}`;
  }
  function init(callbacks) {
    api=callbacks;
    try{voiceEnabled=localStorage.getItem('denkmal-voice')!=='off';}catch{}
    voiceLabel();
    $('heroBtn').onclick=()=>api.getState()==='character'?closeCharacter():openCharacter();
    $('characterClose').onclick=closeCharacter;$('storyContinue').onclick=continueStory;
    $('storyReplay').onclick=()=>{if(currentStory)say(currentStory.id,true);};
    $('soulBtn').onclick=()=>{unleash();$('game').focus();};
    $('equipmentTab').onclick=()=>{selectedTab='equipment';renderCharacter();};
    $('journalTab').onclick=()=>{selectedTab='journal';renderCharacter();};
    $('voiceBtn').onclick=()=>{voiceEnabled=!voiceEnabled;stopVoice();voiceLabel();try{localStorage.setItem('denkmal-voice',voiceEnabled?'on':'off');}catch{}if(voiceEnabled&&currentStory)say(currentStory.id,true);};
  }
  globalThis.HeroSaga={init,reset,stats,chapter,continueStory,openCharacter,closeCharacter,equip,update,draw,updateUI,onKill,onAttack,damage,unleash,stopVoice,lines};
})();
