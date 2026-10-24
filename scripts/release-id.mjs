import {createHash} from 'node:crypto';

const semver='(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)\\.(?:0|[1-9]\\d*)';
const basePattern=new RegExp(`^${semver}$`);
export const releasePattern=new RegExp(`^(${semver})(?:_([a-z0-9]{8}))?$`);
function object(value,keys,label){
  if(!value||Array.isArray(value)||typeof value!=='object'||Object.keys(value).sort().join('|')!==[...keys].sort().join('|'))throw Error(`Invalid ${label} fields; expected ${keys.join(', ')}.`);
}
function text(value,label){
  if(typeof value!=='string'||!value.trim())throw Error(`Missing ${label}.`);
  return value.normalize('NFC').trim().replace(/\r\n?/g,'\n');
}
function translated(value,label){object(value,['hu','en'],label);return {hu:text(value.hu,`${label}.hu`),en:text(value.en,`${label}.en`)};}
export function canonicalMetadata(value){
  object(value,['baseVersion','slug','summary','fixes'],'bugfix metadata');
  if(!basePattern.test(value.baseVersion))throw Error('baseVersion must be a plain major.minor.patch version.');
  if(typeof value.slug!=='string'||!/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value.slug))throw Error('slug must be a descriptive lowercase kebab-case identifier.');
  if(!Array.isArray(value.fixes)||!value.fixes.length)throw Error('At least one bilingual fix is required.');
  return {baseVersion:value.baseVersion,slug:value.slug,summary:translated(value.summary,'summary'),fixes:value.fixes.map((fix,i)=>translated(fix,`fixes[${i}]`))};
}
function compareBaseVersions(a,b){
  const left=a.split('.').map(Number),right=b.split('.').map(Number);
  for(let i=0;i<3;i++)if(left[i]!==right[i])return left[i]-right[i];
  return 0;
}
export function makeBugfix(value){
  const metadata=canonicalMetadata(value);
  const code=createHash('sha256').update(JSON.stringify(metadata),'utf8').digest('hex').slice(0,8);
  return {version:`${metadata.baseVersion}_${code}`,code,...metadata};
}
export function makeRelease(value){return makeBugfix(value);}
export function validateRegistry(registry){
  object(registry,['schemaVersion','bugfixes','releases'],'release registry');
  if(registry.schemaVersion!==1||!Array.isArray(registry.bugfixes)||!Array.isArray(registry.releases))throw Error('Unsupported release registry.');
  const codes=new Set(),versions=new Set(),slugs=new Set();
  for(const entry of [...registry.releases,...registry.bugfixes]){
    object(entry,['version','code','baseVersion','slug','summary','fixes'],'release entry');
    const expected=makeBugfix({baseVersion:entry.baseVersion,slug:entry.slug,summary:entry.summary,fixes:entry.fixes});
    if(entry.code!==expected.code||entry.version!==expected.version)throw Error(`Release metadata/hash mismatch: ${entry.version}.`);
    if(codes.has(entry.code))throw Error(`Release code collision or duplicate: ${entry.code}.`);
    if(versions.has(entry.version)||slugs.has(`${entry.baseVersion}/${entry.slug}`))throw Error(`Duplicate release version or slug: ${entry.version}.`);
    codes.add(entry.code);versions.add(entry.version);slugs.add(`${entry.baseVersion}/${entry.slug}`);
  }
  return registry;
}
export function validateRelease(release,registry){
  if(!release||typeof release.version!=='string'||!releasePattern.test(release.version)||release.savePolicy!=='reset-on-version-change')throw Error('Invalid release version or save policy.');
  validateRegistry(registry);
  if(release.version.includes('_')&&![...registry.releases,...registry.bugfixes].some(entry=>entry.version===release.version))throw Error(`Unregistered release: ${release.version}. Use scripts/release.mjs.`);
  return release;
}
export function bugfixHistory(registry){
  validateRegistry(registry);
  const history={};
  for(const {baseVersion,code} of [...registry.releases,...registry.bugfixes])(history[baseVersion]??=[]).push(code);
  return history;
}
export function prepareBugfix(metadata,release,registry){
  validateRelease(release,registry);
  const entry=makeBugfix(metadata);
  if(entry.baseVersion!==release.version.split('_')[0])throw Error('Bugfix baseVersion must match the current release base.');
  const collision=[...registry.releases,...registry.bugfixes].find(record=>record.code===entry.code);
  if(collision){
    const known=makeBugfix({baseVersion:collision.baseVersion,slug:collision.slug,summary:collision.summary,fixes:collision.fixes});
    if(JSON.stringify(known)!==JSON.stringify(entry))throw Error(`Release code collision: ${entry.code}. Choose a different descriptive slug.`);
    if(release.version!==entry.version)throw Error(`This release was already published: ${entry.version}. Use a new slug/fix record.`);
    return {entry,release,registry,unchanged:true};
  }
  if(registry.bugfixes.some(record=>record.baseVersion===entry.baseVersion&&record.slug===entry.slug))throw Error('This slug is already registered under this base version; use a new descriptive slug.');
  const nextRegistry={...registry,bugfixes:[...registry.bugfixes,entry]};
  validateRegistry(nextRegistry);
  return {entry,release:{...release,version:entry.version},registry:nextRegistry,unchanged:false};
}
export function prepareRelease(metadata,release,registry){
  validateRelease(release,registry);
  const entry=makeRelease(metadata),currentBase=release.version.split('_')[0];
  const collision=[...registry.releases,...registry.bugfixes].find(record=>record.code===entry.code);
  if(collision){
    const known=makeRelease({baseVersion:collision.baseVersion,slug:collision.slug,summary:collision.summary,fixes:collision.fixes});
    if(JSON.stringify(known)!==JSON.stringify(entry))throw Error(`Release code collision: ${entry.code}. Choose a different descriptive slug.`);
    if(release.version!==entry.version)throw Error(`This release was already recorded: ${entry.version}. Use a new slug/description.`);
    return {entry,release,registry,unchanged:true};
  }
  if(compareBaseVersions(entry.baseVersion,currentBase)<=0)throw Error('A feature release baseVersion must be greater than the current release base.');
  if([...registry.releases,...registry.bugfixes].some(record=>record.baseVersion===entry.baseVersion&&record.slug===entry.slug))throw Error('This slug is already registered under this base version; use a new descriptive slug.');
  const nextRegistry={...registry,releases:[...registry.releases,entry]};
  validateRegistry(nextRegistry);
  return {entry,release:{...release,version:entry.version},registry:nextRegistry,unchanged:false};
}
// The menu's current-release badge is derived from the full registered ID,
// rather than whichever historical section last received a hand-written span.
export function synchronizeReleaseMarker(entry,version,label){
  if(!releasePattern.test(version))throw Error('Invalid entrypoint release version.');
  const markerText=text(label,'current release marker');
  const escapeHTML=value=>value.replace(/[&<>"']/g,character=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const isPanel=attributes=>/(?:^|\s)id\s*=\s*(["'])releaseNotesPanel\1(?:\s|$)/i.test(attributes);
  const articles=[...entry.matchAll(/<article\b([^>]*)>([\s\S]*?)<\/article\s*>/gi)].filter(match=>isPanel(match[1]));
  if(articles.length!==1)throw Error('Expected exactly one releaseNotesPanel for the current release marker.');
  const panel=articles[0],sections=[...panel[2].matchAll(/<section\b[^>]*>[\s\S]*?<\/section\s*>/gi)];
  const headingVersion=section=>{
    const heading=section.match(/<h3\b[^>]*>([\s\S]*?)<\/h3\s*>/i);
    const plain=heading?.[1].replace(/<[^>]*>/g,' ').replace(/&nbsp;|&#160;/gi,' ').trim();
    return plain?.match(/^(\d+\.\d+\.\d+(?:_[a-z0-9]{8})?)(?=$|[\s·–—:])/u)?.[1];
  };
  const matches=sections.filter(match=>headingVersion(match[0])===version);
  if(matches.length!==1)throw Error('Expected exactly one changelog section for current release '+version+'; found '+matches.length+'.');
  const removeMarkers=html=>html.replace(/<span\b([^>]*)>[\s\S]*?<\/span\s*>/gi,(span,attributes)=>{
    const classes=attributes.match(/(?:^|\s)class\s*=\s*(["'])(.*?)\1/i)?.[2].split(/\s+/)||[];
    return classes.includes('release-current')?'':span;
  });
  const clean=removeMarkers(panel[2]);
  const updated=clean.replace(/<section\b[^>]*>[\s\S]*?<\/section\s*>/gi,section=>{
    if(headingVersion(section)!==version)return section;
    return section.replace(/(<h3\b[^>]*>)([\s\S]*?)(<\/h3\s*>)/i,(_,start,heading,end)=>start+heading.trimEnd()+' <span class="release-current">'+escapeHTML(markerText)+'</span>'+end);
  });
  const panelStart=panel.index+panel[0].indexOf('>')+1;
  return entry.slice(0,panelStart)+updated+entry.slice(panelStart+panel[2].length);
}
export function synchronizeEntry(entry,version,versionLabel,currentReleaseLabel){
  if(!releasePattern.test(version))throw Error('Invalid entrypoint release version.');
  const synchronized=entry.replace(/(assets\/(?:js\/runtime\.js|css\/style\.css)\?v=)[0-9A-Za-z._-]+/g,(_,prefix)=>prefix+version)
    .replace(/(<summary class="menu-note"[^>]*>)[^<]*(<\/summary>)/,(_,before,after)=>before+versionLabel.replace('{0}',version)+after);
  // Minimal/static build fixtures may have no changelog. The production menu
  // always has this panel; an absent/ambiguous active section inside it fails.
  return /\bid\s*=\s*(["'])releaseNotesPanel\1/i.test(entry)?synchronizeReleaseMarker(synchronized,version,currentReleaseLabel):synchronized;
}
