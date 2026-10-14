import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';

const require=createRequire(import.meta.url),root=fileURLToPath(new URL('../',import.meta.url));
let babelParse,traverse;
try{babelParse=require('@babel/parser').parse;traverse=require('@babel/traverse').default;}
catch{({babelParse,traverse}=require(process.env.MOMO_BABEL_BUNDLE||'playwright/lib/transform/babelBundle.js'));}
const dictionary=JSON.parse(fs.readFileSync(path.join(root,'assets/i18n/en.json'),'utf8'));
const files=['i18n','levels','art-data','save-vault','graphics','progression','combat','game'];
const digest=createHash('sha256');for(const file of ['assets/i18n/en.json',...files.map(name=>'assets/js/'+name+'.js')]){digest.update(file);digest.update('\0');digest.update(fs.readFileSync(path.join(root,file)));digest.update('\0');}
const sourceHash=digest.digest('hex');
function replace(source,edits){
  edits.sort((a,b)=>b.start-a.start);
  for(const e of edits)source=source.slice(0,e.start)+e.text+source.slice(e.end);
  return source;
}
function translate(source,name){
  const edits=[];
  traverse(babelParse(source,name+'.js'),{
    StringLiteral(p){
      const node=p.node,par=p.parent;
      if(!Object.hasOwn(dictionary,node.value)||p.isDirectiveLiteral?.()||par?.type==='Directive'||par?.type==='ObjectProperty'&&par.key===node&&!par.computed)return;
      edits.push({start:node.start,end:node.end,text:`I18n.t(${source.slice(node.start,node.end)})`});
    },
    TemplateLiteral(p){
      const node=p.node;if(node.expressions.length===0)return;
      const key=node.quasis.map((q,i)=>q.value.cooked+(i<node.expressions.length?`{${i}}`:'' )).join('');
      if(!Object.hasOwn(dictionary,key))return;
      edits.push({start:node.start,end:node.end,text:`I18n.format(${JSON.stringify(key)},[${node.expressions.map(e=>source.slice(e.start,e.end)).join(',')}])`});
    }
  });
  // Nested literals within a translated template are owned by the template replacement.
  const nonoverlap=[];for(const edit of edits.sort((a,b)=>a.start-b.start||b.end-a.end)){if(nonoverlap.some(e=>edit.start>=e.start&&edit.end<=e.end))continue;nonoverlap.push(edit);}
  source=replace(source,nonoverlap);
  const outer=[];
  traverse(babelParse(source,name+'.js'),{
    AssignmentExpression(p){const {left,right}=p.node;if(left.type!=='MemberExpression'||left.computed||!['textContent','innerHTML'].includes(left.property.name))return;if(right.type==='CallExpression'&&right.callee.type==='MemberExpression'&&right.callee.object.name==='I18n')return;outer.push({start:right.start,end:right.end,text:`I18n.t(${source.slice(right.start,right.end)})`});},
    CallExpression(p){const n=p.node;if(n.callee.type==='MemberExpression'&&n.callee.property.name==='fillText'&&n.arguments[0]){const a=n.arguments[0];outer.push({start:a.start,end:a.end,text:`I18n.t(${source.slice(a.start,a.end)})`});}}
  });
  return replace(source,outer);
}
let runtime=`/* Generated from assets/js sources by scripts/build-game.mjs; source-sha256: ${sourceHash} */\n(()=>{'use strict';\nconst ENGLISH=${JSON.stringify(dictionary)};\n`;
for(const name of files){let source=fs.readFileSync(path.join(root,'assets/js',name+'.js'),'utf8');if(!['i18n','save-vault','art-data'].includes(name))source=translate(source,name);runtime+=`\n/* ${name}.js */\n${source}\n`;}
runtime+='})();\n';
const output=path.join(root,'assets/js/runtime.js');
if(process.argv.includes('--check')){if(!fs.existsSync(output)||fs.readFileSync(output,'utf8')!==runtime){console.error('runtime.js is out of date; run node scripts/build-game.mjs');process.exitCode=1;}else console.log('PASS: generated runtime is current.');}
else{fs.writeFileSync(output,runtime);console.log('Built assets/js/runtime.js');}
