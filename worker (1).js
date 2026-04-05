/**
 * BWT Swimming Management — Cloudflare Worker
 * 
 * Routes:
 *   GET /              → Main admin/home page
 *   GET /swimmer/:id   → Swimmer profile page
 *   GET /api/swimmers  → List all swimmers (JSON)
 *   POST /api/swimmers → Register new swimmer (JSON)
 *   GET /api/swimmers/:id → Get swimmer by ID (JSON)
 *   DELETE /api/swimmers/:id → Delete swimmer
 */

// ─── HTML pages (embedded as strings) ───────────────────────────────────────
// In production, store your HTML in Cloudflare KV or use Cloudflare Pages instead.
// For a pure Worker approach, the HTML is served from the files below.

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // ── API routes ──────────────────────────────────────────────────────────

    // GET /api/swimmers — list all
    if (path === '/api/swimmers' && method === 'GET') {
      const list = await getSwimmers(env);
      return jsonResponse(list);
    }

    // POST /api/swimmers — create swimmer
    if (path === '/api/swimmers' && method === 'POST') {
      const body = await request.json();
      const swimmer = await createSwimmer(env, body);
      return jsonResponse(swimmer, 201);
    }

    // GET /api/swimmers/:id
    if (path.startsWith('/api/swimmers/') && method === 'GET') {
      const id = path.split('/')[3];
      const swimmer = await getSwimmer(env, id);
      if (!swimmer) return jsonResponse({ error: 'Not found' }, 404);
      return jsonResponse(swimmer);
    }

    // DELETE /api/swimmers/:id
    if (path.startsWith('/api/swimmers/') && method === 'DELETE') {
      const id = path.split('/')[3];
      await deleteSwimmer(env, id);
      return jsonResponse({ success: true });
    }

    // ── Page routes ─────────────────────────────────────────────────────────

    // GET /swimmer/:id — profile page
    if (path.startsWith('/swimmer/')) {
      const html = await env.ASSETS.fetch(new Request(new URL('/swimmer-profile.html', request.url)));
      return new Response(html.body, {
        headers: { 'Content-Type': 'text/html;charset=UTF-8' }
      });
    }

    // Serve static assets via Cloudflare Pages / Workers Sites
    return env.ASSETS.fetch(request);
  }
};

// ─── KV helpers ─────────────────────────────────────────────────────────────

async function getSwimmers(env) {
  const keys = await env.SWIMMERS_KV.list({ prefix: 'swimmer:' });
  const swimmers = await Promise.all(
    keys.keys.map(async k => {
      const val = await env.SWIMMERS_KV.get(k.name);
      return val ? JSON.parse(val) : null;
    })
  );
  return swimmers.filter(Boolean).sort((a, b) =>
    new Date(b.registeredAt) - new Date(a.registeredAt)
  );
}

async function getSwimmer(env, id) {
  const val = await env.SWIMMERS_KV.get(`swimmer:${id}`);
  return val ? JSON.parse(val) : null;
}

async function createSwimmer(env, data) {
  const id = 'SW' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substr(2, 4).toUpperCase();
  const swimmer = {
    id,
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    birthDate: data.birthDate || '',
    gender: data.gender || 'male',
    club: data.club || '',
    discipline: data.discipline || 'freestyle',
    rank: data.rank || 'junior',
    coach: data.coach || '',
    email: data.email || '',
    status: 'active',
    registeredAt: new Date().toISOString(),
  };
  await env.SWIMMERS_KV.put(`swimmer:${id}`, JSON.stringify(swimmer));
  return swimmer;
}

async function deleteSwimmer(env, id) {
  await env.SWIMMERS_KV.delete(`swimmer:${id}`);
}

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
