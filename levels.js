(() => {
  'use strict';
  const center={x:1536,y:1536};
  const point=(x,y)=>({x:center.x+x,y:center.y+y});
  const gates=[point(0,-600),point(600,0),point(0,600),point(-600,0)];
  const maze=[[-440,-440],[440,-440],[440,440],[-440,440],[-440,-160],[180,-160],[180,180],[0,180],[0,0]].map(([x,y])=>point(x,y));
  function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
  function pathDistance(p,path){return Math.min(...path.slice(1).map((b,i)=>segmentDistance(p,path[i],b)));}
  const slots=[];
  for(let i=1;i<maze.length;i++){
    const a=maze[i-1],b=maze[i],length=Math.hypot(b.x-a.x,b.y-a.y),nx=-(b.y-a.y)/length,ny=(b.x-a.x)/length;
    for(let along=90;along<length-50;along+=160)for(const side of [-1,1]){
      const p={x:a.x+(b.x-a.x)*along/length+nx*88*side,y:a.y+(b.y-a.y)*along/length+ny*88*side};
      if(pathDistance(p,maze)>=70&&Math.hypot(p.x-center.x,p.y-center.y)>100&&slots.every(s=>Math.hypot(s.x-p.x,s.y-p.y)>100))slots.push(p);
    }
  }
  const levels={
    1:{name:'VIER TORE',gates,paths:gates.map(g=>[g,center]),slots:[],firstWave:1},
    2:{name:'DAS LABYRINTH',gates:[maze[0]],paths:[maze],slots,firstWave:6}
  };
  const saveKey='denkmal-level2-unlocked-v1';
  let unlocked=false,storageAvailable=true;
  try{unlocked=localStorage.getItem(saveKey)==='true';}catch{storageAvailable=false;}
  function unlock(){unlocked=true;try{localStorage.setItem(saveKey,'true');storageAvailable=true;}catch{storageAvailable=false;}return storageAvailable;}
  function nearestSlot(p){let best=null,d=Infinity;for(const slot of slots){const next=Math.hypot(p.x-slot.x,p.y-slot.y);if(next<d){best=slot;d=next;}}return d<=85?best:null;}
  function advance(enemy,dt){const path=maze;let budget=enemy.speed*dt;while(enemy.waypoint<path.length&&budget>0){const p=path[enemy.waypoint],dx=p.x-enemy.x,dy=p.y-enemy.y,d=Math.hypot(dx,dy);if(d<=budget){enemy.x=p.x;enemy.y=p.y;budget-=d;enemy.waypoint++;}else{enemy.x+=dx/d*budget;enemy.y+=dy/d*budget;budget=0;}}}
  globalThis.DenkmalLevels={levels,center,unlock,nearestSlot,advance,pathDistance,get unlocked(){return unlocked;},get storageAvailable(){return storageAvailable;}};
})();
