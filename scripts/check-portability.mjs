import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));

// Match concrete filesystem locations, not HTTP URLs, relative asset URLs,
// protocol-only documentation or paths derived from the current checkout.
const localPaths = [
  /(?<![\w:/\\])[a-z]:[\\/]+(?![<\s])/ig,
  /\/(?:Users|home)\/(?![<$\s])[^/\s"'`<>]+(?:\/|$)/g,
  /\/(?:mnt\/(?:data|[a-z])|private\/var|var\/folders|workspaces?)\/(?![<$\s])/g,
  /file:\/{2,3}(?![\s"'`<]|$)/ig,
  /\\\\(?![\\\s])[^\\\s"'`<>]+\\[^\\\s"'`<>]+/g,
];

export function findLocalPaths(source) {
  const findings = [];
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const filesystemText = line.replace(/\b(?:https?|data|app|plugin):[^\s<>"'`]+/ig, value => ' '.repeat(value.length));
    for (const pattern of localPaths) {
      pattern.lastIndex = 0;
      for (const match of filesystemText.matchAll(pattern)) findings.push({ line: index + 1, column: match.index + 1 });
    }
  }
  return findings;
}

function portableCandidates(repositoryRoot) {
  if (fs.existsSync(path.join(repositoryRoot, '.git'))) {
    // Include new, non-ignored sources before staging; do not inspect private
    // QA artifacts or historical Git objects as if they were project content.
    return [...new Set(execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
      cwd: repositoryRoot, encoding: 'utf8',
    }).split('\0').filter(Boolean))];
  }
  // A downloaded source archive has no Git metadata. Walk its project files,
  // excluding the same scratch/build/dependency directories as the checkout.
  const ignored = new Set(['.git', 'node_modules', '_site', 'dist', 'test-results', 'playwright-report']);
  const candidates = [];
  function walk(relative = '') {
    for (const entry of fs.readdirSync(path.join(repositoryRoot, relative), { withFileTypes: true })) {
      const name = path.posix.join(relative, entry.name);
      if (entry.isDirectory()) {
        if (!ignored.has(entry.name) && name !== '.codex/work') walk(name);
      } else if (entry.isFile() && (entry.name === '.env.example' || !/^\.env(?:\.|$)/.test(entry.name))) candidates.push(name);
    }
  }
  walk();
  return candidates;
}

export function auditRepository(repositoryRoot = root) {
  const findings = [];
  let checked = 0;
  for (const relative of portableCandidates(repositoryRoot)) {
    const absolute = path.join(repositoryRoot, relative);
    if (!fs.existsSync(absolute) || !fs.lstatSync(absolute).isFile()) continue;
    const bytes = fs.readFileSync(absolute);
    if (bytes.includes(0)) continue; // Raster images and other binary payloads.
    checked++;
    for (const finding of findLocalPaths(bytes.toString('utf8'))) findings.push({ file: relative, ...finding });
  }
  return { checked, findings };
}

function selfTest() {
  const drive = 'C' + ':';
  const unixHome = '/' + 'home';
  const macHome = '/' + 'Users';
  const mount = '/' + 'mnt';
  const concreteFile = 'file:' + '///' + 'project/index.html';
  const share = '\\' + '\\' + 'server' + '\\' + 'share';
  for (const source of [
    `${drive}/project/assets`, `${drive}\\project\\assets`, `${drive}\\\\project\\\\assets`,
    `${unixHome}/tester/project`, `${macHome}/tester/project`, `${mount}/data/project`,
    concreteFile, share,
  ]) assert(findLocalPaths(source).length, 'Concrete machine paths must be rejected');
  for (const source of [
    'https://example.github.io/kiba-game/', 'http://localhost:8000/',
    'https://example.org' + unixHome + '/tester/project',
    'file://', '`file://` is a URL scheme', '/kiba-game/assets/images/momo.png',
    'assets/images/momo.png', '../docs/DEVELOPMENT.md', '~/project', '$HOME/project',
    'Path(__file__).resolve().parents[1]', "new URL('..', import.meta.url)",
    `${drive}/<project>/assets`, `${unixHome}/<user>/project`,
    String.raw`/https?:\/\//`,
  ]) assert.equal(findLocalPaths(source).length, 0, 'Portable references must stay allowed');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  selfTest();
  const result = auditRepository();
  for (const finding of result.findings) console.error(`${finding.file}:${finding.line}:${finding.column}: hardcoded local filesystem path`);
  if (result.findings.length) process.exitCode = 1;
  else console.log(`PASS: ${result.checked} project text files contain no hardcoded local filesystem paths; portability detector self-tests passed.`);
}
