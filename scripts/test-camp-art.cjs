const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const h=require('./test-harness.cjs')(),{run}=h;
const catalogue=run('JSON.stringify({npcs:[ART_CAMP.smith,ART_CAMP.herbalist,ART_CAMP.enchanter,ART_CAMP.mayor],master:ART_CAMP_MASTER,items:[ART_INVENTORY.items.forestHerb,ART_INVENTORY.items.healingBrew],manifest:ART_MANIFEST})');
const art=JSON.parse(catalogue),bounds=(rect,key)=>{const png=fs.readFileSync(path.join(__dirname,'..',art.manifest[key]));assert(rect.x>=0&&rect.y>=0&&rect.x+rect.w<=png.readUInt32BE(16)&&rect.y+rect.h<=png.readUInt32BE(20),'Complete source crop: '+key);};
for(const npc of art.npcs){bounds(npc,npc.image);assert(npc.anchorX>npc.x&&npc.anchorX<npc.x+npc.w);assert(npc.bodyHeight>500);}
for(const item of art.items){bounds(item,item.image);assert(item.stack);}
assert.equal(art.master.frames.length,21);for(const f of art.master.frames){bounds(f,f.image||art.master.image);assert.equal(f.edgeVisiblePixels,0);assert(f.bodyHeight>0);}
run("defeated[0]=true;flags[0]=['forestBell','villageBell','campQuestAccepted'];CampQuest.enter('samuraiCamp');var visualMaster=enemies.find(CampMaster.is);");
const before=run('JSON.stringify({player,enemies,flags,platforms,levelTime})');
for(let i=0;i<21;i++)run('visualMaster.poseIndex='+i+';CampArt.actor(visualMaster);');
run('visualMaster.poseIndex=0;');assert.equal(run('JSON.stringify({player,enemies,flags,platforms,levelTime})'),before,'Drawing never advances battle/quest clocks');
run('DevTools.open();DevSession.begin();DevTools.close();');
for(const id of ['samuraiCamp','forgeInterior','herbalHut','mysticTent']){run("CampQuest.enter('"+id+"');CampArt.backdrop();CampArt.scenery();draw();");assert.equal(run('CampQuest.locationId()'),id);}
console.log('PASS: native camp crops, intact twenty-one-pose margins, body registration, inventory catalogue and immutable rendering across all side areas.');
