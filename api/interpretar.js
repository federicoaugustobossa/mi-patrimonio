// Interpreta texto libre ("café 3500 mp") con Claude. Es opcional:
// sin ANTHROPIC_API_KEY la app usa su intérprete local.
// Solo responde a usuarios con sesión iniciada en la app.
// La app valida todo lo que vuelve de acá antes de guardar nada.

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(405).json({ error: 'Usar POST' }); return; }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) { res.status(501).json({ error: 'Interpretación con IA no configurada' }); return; }

  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const sUrl = process.env.SUPABASE_URL, anon = process.env.SUPABASE_ANON_KEY;
  if (!token || !sUrl || !anon) { res.status(401).json({ error: 'Sin sesión' }); return; }
  const u = await fetch(`${sUrl}/auth/v1/user`, { headers: { apikey: anon, Authorization: `Bearer ${token}` } });
  if (!u.ok) { res.status(401).json({ error: 'Sesión inválida' }); return; }

  const prompt = String((req.body && req.body.prompt) || '').slice(0, 8000);
  if (!prompt) { res.status(400).json({ error: 'Falta el texto' }); return; }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || 'claude-haiku-5-5',
        max_tokens: 400,
        system: 'Sos un intérprete de movimientos de finanzas personales. Respondés únicamente con un objeto JSON válido, sin texto adicional.',
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    const j = await r.json();
    if (!r.ok) { res.status(502).json({ error: j?.error?.message || 'Error de la IA' }); return; }
    const text = (j.content || []).map((c) => c.text || '').join('');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) { res.status(502).json({ error: 'Respuesta sin JSON' }); return; }
    res.status(200).json(JSON.parse(m[0]));
  } catch (e) {
    res.status(502).json({ error: 'No se pudo interpretar: ' + e.message });
  }
}
