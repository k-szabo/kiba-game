// Self-contained Supabase Edge Function. No secret or service-role key is used.
// Scores are client-reported community records, not authoritative replays.
const projectURL = Deno.env.get('SUPABASE_URL') || '';
let publishableKey = Deno.env.get('SUPABASE_ANON_KEY') || '';
try { publishableKey = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}').default || publishableKey; } catch { /* fail closed below if no usable key */ }
const origins = new Set((Deno.env.get('ALLOWED_ORIGINS') || 'https://k-szabo.github.io,http://localhost:8799,http://127.0.0.1:8799').split(',').map(value => value.trim()).filter(Boolean));
const keys = ['name','seed','weapon','cleared','kills','elapsedMs','version'];
const integer = (n: unknown, min: number, max: number): n is number => typeof n === 'number' && Number.isSafeInteger(n) && n >= min && n <= max;

function response(request: Request, status: number, value: unknown, extra: Record<string,string> = {}) {
  const origin = request.headers.get('origin');
  return new Response(status === 204 ? null : JSON.stringify(value), {status, headers: {
    'Content-Type':'application/json; charset=utf-8', 'Cache-Control':'no-store',
    'Vary':'Origin', 'X-Content-Type-Options':'nosniff',
    ...(origin && origins.has(origin) ? {'Access-Control-Allow-Origin':origin} : {}),
    'Access-Control-Allow-Methods':'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info',
    ...extra
  }});
}

async function readBody(request: Request) {
  if (!request.body) throw Error('invalid_score');
  const reader = request.body.getReader(); let bytes = 0; const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const {done, value} = await reader.read(); if (done) break;
      bytes += value.byteLength; if (bytes > 4096) { await reader.cancel(); throw Error('too_large'); }
      chunks.push(value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(bytes); let offset = 0;
  for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder().decode(body));
}

async function api(path: string, token: string | null, body: unknown = undefined) {
  return fetch(projectURL + path, {method: body === undefined ? 'GET' : 'POST',
    headers:{apikey:publishableKey, ...(token ? {Authorization:'Bearer ' + token} : {}), 'Content-Type':'application/json'},
    ...(body === undefined ? {} : {body:JSON.stringify(body)}), signal:AbortSignal.timeout(8000)});
}

export async function handle(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && !origins.has(origin)) return response(request,403,{error:'origin_denied'});
  if (request.method === 'OPTIONS') return response(request,204,null);
  if (!['GET','POST'].includes(request.method)) return response(request,405,{error:'method_not_allowed'},{Allow:'GET, POST, OPTIONS'});
  if (!/^https:\/\/[^/]+$/.test(projectURL) || !publishableKey) return response(request,503,{error:'unavailable'});
  try {
    if (request.method === 'GET') {
      const result = await api('/rest/v1/rpc/list_tower_scores', null, {});
      if (!result.ok) return response(request,503,{error:'unavailable'});
      const scores = await result.json();
      if (!Array.isArray(scores) || scores.length > 50) return response(request,503,{error:'unavailable'});
      return response(request,200,{scores});
    }
    const bearer = /^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/.exec(request.headers.get('authorization') || '');
    if (!bearer) return response(request,401,{error:'unauthorized'});
    if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return response(request,415,{error:'invalid_score'});
    let body;
    try { body = await readBody(request); } catch (error) { return response(request,error instanceof Error && error.message === 'too_large' ? 413 : 400,{error:'invalid_score'}); }
    if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== keys.length || keys.some(key => !Object.hasOwn(body,key))) return response(request,400,{error:'invalid_score'});
    if (typeof body.name !== 'string' || Array.from(body.name).length < 3 || Array.from(body.name).length > 20 || body.name !== body.name.trim() || !/^[\p{L}\p{N} _-]+$/u.test(body.name)) return response(request,400,{error:'invalid_name'});
    if (!integer(body.seed,1,4294967295) || !['katana','naginata','swordShield'].includes(body.weapon)
      || !integer(body.cleared,1,10000) || !integer(body.kills,body.cleared,1000000)
      || !integer(body.elapsedMs,1,31536000000) || typeof body.version !== 'string'
      || !/^\d{1,3}\.\d{1,3}\.\d{1,3}(?:_[a-f0-9]{8})?$/.test(body.version)) return response(request,400,{error:'invalid_score'});
    // getUser validates the signature and user existence through Supabase Auth.
    // We never decode a JWT and trust its unverified sub claim.
    const userResponse = await api('/auth/v1/user',bearer[1]);
    if (!userResponse.ok) return response(request,userResponse.status >= 500 ? 503 : 401,{error:userResponse.status >= 500 ? 'unavailable' : 'unauthorized'});
    const user = await userResponse.json();
    if (typeof user.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(user.id) || user.role !== 'authenticated') return response(request,401,{error:'unauthorized'});
    const result = await api('/rest/v1/rpc/submit_tower_score',bearer[1],{
      p_name:body.name, p_seed:body.seed, p_weapon:body.weapon, p_cleared:body.cleared,
      p_kills:body.kills, p_elapsed_ms:body.elapsedMs, p_version:body.version
    });
    if (!result.ok) return response(request,503,{error:'unavailable'});
    const outcome = await result.json();
    if (outcome?.error === 'rate_limited') return response(request,429,{error:'rate_limited'},{'Retry-After':'60'});
    if (outcome?.error === 'unauthorized') return response(request,401,{error:'unauthorized'});
    if (['invalid_name','invalid_score'].includes(outcome?.error)) return response(request,400,{error:outcome.error});
    if (outcome?.ok !== true || typeof outcome.improved !== 'boolean') return response(request,503,{error:'unavailable'});
    return response(request,200,{ok:true,improved:outcome.improved});
  } catch { return response(request,503,{error:'unavailable'}); }
}

Deno.serve(handle);
