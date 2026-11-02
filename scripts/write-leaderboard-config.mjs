// This file contains no key. CI/local environment provides browser configuration.
import fs from 'node:fs';
import path from 'node:path';
const value=process.env.SUPABASE_PUBLISHABLE_KEY||'';
if(value&&!/^sb_publishable_[A-Za-z0-9_-]+$/.test(value))throw Error('Expected a publishable key; secret keys are forbidden.');
const output=process.argv[2]||'assets/config/leaderboard-public.json';
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(value?{publishableKey:value}:{})+'\n');
console.log(value?'Wrote browser configuration (key omitted from output).':'Wrote unconfigured leaderboard settings.');
