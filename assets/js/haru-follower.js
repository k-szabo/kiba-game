/* Movement only: encounter ownership, visibility and persistence belong to the caller. */
'use strict';
const HaruFollower=(()=>{
 const finite=value=>Number.isFinite(value);
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 function create(options={}){
  const config={w:42,h:70,speed:285,gravity:1550,jumpSpeed:590,spacing:78,...options};
  for(const key of ['w','h','speed','gravity','jumpSpeed','spacing'])if(!finite(config[key])||config[key]<=0)throw Error('Invalid follower movement settings');
  let actor=null,airTarget=null,ignored=null,ignoreTime=0;
  const usable=platforms=>(platforms||[]).filter(p=>p&&!p.broken&&finite(p.x)&&finite(p.y)&&finite(p.w)&&p.w>=config.w);
  const center=()=>actor.x+config.w/2;
  const overlaps=(x,p)=>x+config.w>p.x&&x<p.x+p.w;
  function supportAt(body,list){return list.find(p=>Math.abs(body.y+(body.h||config.h)-p.y)<=4&&overlaps(body.x,p))||null;}
  function reset(point,platforms=[]){
   if(!point||!finite(point.x)||!finite(point.y))throw Error('Follower reset needs finite coordinates');
   actor={x:point.x,y:point.y,w:config.w,h:config.h,vx:0,vy:0,face:point.face===-1?-1:1,onGround:false,support:null,animationTime:0};
   const support=supportAt(actor,usable(platforms));
   if(support){actor.y=support.y-config.h;actor.onGround=true;actor.support=support.id??null;}
   airTarget=ignored=null;ignoreTime=0;return snapshot();
  }
  function edge(from,to){
   const rise=from.y-to.y,maxRise=config.jumpSpeed**2/(2*config.gravity)-8;
   if(rise>maxRise||rise< -650)return false;
   const gap=Math.max(0,to.x-(from.x+from.w),from.x-(to.x+to.w));
   // A solid floor cannot be crossed downward to a platform hidden beneath it.
   if(rise< -4&&!from.drop&&to.x>=from.x&&to.x+to.w<=from.x+from.w)return false;
   const flight=(config.jumpSpeed+Math.sqrt(Math.max(0,config.jumpSpeed**2-2*config.gravity*rise)))/config.gravity;
   return gap+config.w/2<config.speed*flight-12;
  }
  function route(start,goal,list){
   if(start===goal)return [];
   const seen=new Set([start]),queue=[[start,[]]];
   while(queue.length){const [current,path]=queue.shift();for(const next of list){if(seen.has(next)||!edge(current,next))continue;const steps=[...path,next];if(next===goal)return steps;seen.add(next);queue.push([next,steps]);}}
   return null;
  }
  function steering(player,list){
   const support=actor.onGround?supportAt(actor,list):null,goal=player.onGround?supportAt(player,list):null;
   if(!support)return airTarget;
   if(!goal)return null;
   const steps=route(support,goal,list);if(steps===null)return null;
   if(!steps.length){
    airTarget=null;
    const desired=clamp(player.x+(player.w||config.w)/2-Math.sign(player.x-actor.x||actor.face)*config.spacing,support.x+config.w/2,support.x+support.w-config.w/2);
    return {x:desired,jump:false};
   }
   const next=steps[0],rise=support.y-next.y;
   let x=clamp(center(),next.x+config.w/2,next.x+next.w-config.w/2),jump=false;
   if(rise< -4){
    const overlap=next.x<support.x+support.w&&next.x+next.w>support.x;
    if(support.drop&&overlap){ignored=support;ignoreTime=.35;actor.onGround=false;actor.y+=5;actor.vy=100;}
    else if(next.x+next.w>support.x+support.w)x=Math.max(x,support.x+support.w+config.w/2+4);
    else x=Math.min(x,support.x-config.w/2-4);
   }else{
    const direction=Math.sign(x-center());
    const edgeDistance=direction>0?support.x+support.w-(actor.x+config.w):actor.x-support.x;
    jump=rise>4?Math.abs(x-center())<config.speed*.58:edgeDistance<22;
   }
   // Retain the destination while airborne, including ordinary walks off ledges.
   const target={x,jump};airTarget={x:clamp(x,next.x+config.w/2,next.x+next.w-config.w/2),jump:false};
   return target;
  }
  function step(dt,player,list){
   ignoreTime=Math.max(0,ignoreTime-dt);if(!ignoreTime)ignored=null;
   const target=steering(player,list),distance=target?target.x-center():0;
   actor.vx=Math.abs(distance)>3?Math.sign(distance)*Math.min(config.speed,Math.abs(distance)/dt):0;
   if(actor.vx)actor.face=Math.sign(actor.vx);
   if(target?.jump&&actor.onGround){actor.vy=-config.jumpSpeed;actor.onGround=false;}
   const bottom=actor.y+config.h;
   actor.x+=actor.vx*dt;actor.vy=Math.min(980,actor.vy+config.gravity*dt);actor.y+=actor.vy*dt;actor.onGround=false;actor.support=null;
   let landing=null;
   for(const p of list)if(p!==ignored&&actor.vy>=0&&overlaps(actor.x,p)&&bottom<=p.y+1&&actor.y+config.h>=p.y&&(!landing||p.y<landing.y))landing=p;
   if(landing){actor.y=landing.y-config.h;actor.vy=0;actor.onGround=true;actor.support=landing.id??null;airTarget=null;}
   actor.animationTime+=dt;
  }
  function update(dt,player,platforms,{active=true}={}){
   if(!actor||!active||!finite(dt)||dt<=0||!player||!finite(player.x)||!finite(player.y))return snapshot();
   const list=usable(platforms);let remaining=Math.min(dt,.1);
   while(remaining>1e-8){const slice=Math.min(remaining,1/120);step(slice,player,list);remaining-=slice;}
   return snapshot();
  }
  function snapshot(){return actor?{...actor}:null;}
  return Object.freeze({reset,update,snapshot});
 }
 return Object.freeze({create});
})();
