// Dólar oficial venta Banco Nación.
// 1) Lee la cotización de billetes en bna.com.ar.
// 2) Si falla, usa DolarAPI (cotización oficial) como respaldo, identificada como tal.
// Guarda el resultado en la tabla cotizaciones_bna. Lo llama la app al abrirse
// y un trabajo programado de Vercel los días hábiles.

const TZ = 'America/Argentina/Cordoba';
const hoyAR = () => new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

function numAR(s) {
  s = String(s).trim();
  if (s.includes(',')) return Number(s.replace(/\./g, '').replace(',', '.'));
  if (/^\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ''));
  return Number(s);
}
const valido = (v) => Number.isFinite(v) && v > 50 && v < 100000;

async function desdeBNA() {
  const r = await fetch('https://www.bna.com.ar/Personas', {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MiPatrimonio/1.0)', 'Accept-Language': 'es-AR' },
    signal: AbortSignal.timeout(8000),
  });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const html = await r.text();
  const i = html.indexOf('id="billetes"');
  const seg = i >= 0 ? html.slice(i, i + 8000) : html;
  const m = seg.match(/Dolar\s+U\.?S\.?A[\s\S]*?<td[^>]*>\s*([\d.,]+)\s*<\/td>\s*<td[^>]*>\s*([\d.,]+)\s*<\/td>/i);
  if (!m) throw new Error('no se encontró la fila del dólar');
  const compra = numAR(m[1]);
  const venta = numAR(m[2]);
  if (!valido(venta)) throw new Error('valor fuera de rango: ' + m[2]);
  const f = seg.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  const fecha = f ? `${f[3]}-${f[2].padStart(2, '0')}-${f[1].padStart(2, '0')}` : hoyAR();
  return { fecha, compra: valido(compra) ? compra : null, venta, fuente: 'Banco Nación · billete venta' };
}

async function desdeDolarAPI() {
  const r = await fetch('https://dolarapi.com/v1/dolares/oficial', { signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  const j = await r.json();
  const venta = Number(j.venta);
  if (!valido(venta)) throw new Error('valor fuera de rango');
  const fecha = j.fechaActualizacion
    ? new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(j.fechaActualizacion))
    : hoyAR();
  return { fecha, compra: valido(Number(j.compra)) ? Number(j.compra) : null, venta, fuente: 'DolarAPI · oficial (respaldo)' };
}

export default async function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    res.status(500).json({ error: 'Faltan SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en Vercel.' });
    return;
  }
  // Claves nuevas (sb_secret_…) van solo en el encabezado apikey; las viejas (JWT) también en Authorization.
  const H = key.startsWith('sb_')
    ? { apikey: key, 'Content-Type': 'application/json' }
    : { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };
  res.setHeader('Cache-Control', 'no-store');

  // Si ya se consultó hace menos de 30 minutos, no vuelve a pedirla.
  try {
    const r = await fetch(`${url}/rest/v1/cotizaciones_bna?select=*&order=obtenida.desc&limit=1`, { headers: H });
    const rows = await r.json();
    const ult = Array.isArray(rows) ? rows[0] : null;
    if (ult && Date.now() - Date.parse(ult.obtenida) < 30 * 60 * 1000 && !('forzar' in (req.query || {}))) {
      res.status(200).json({ ...ult, cache: true });
      return;
    }
  } catch (_) { /* sigue */ }

  const errores = [];
  let cot = null;
  try { cot = await desdeBNA(); } catch (e) { errores.push('BNA: ' + e.message); }
  if (!cot) { try { cot = await desdeDolarAPI(); } catch (e) { errores.push('DolarAPI: ' + e.message); } }
  if (!cot) {
    res.status(502).json({ error: 'No se pudo obtener la cotización. Cargala a mano en Ajustes.', detalle: errores });
    return;
  }

  const body = { ...cot, obtenida: new Date().toISOString() };
  const w = await fetch(`${url}/rest/v1/cotizaciones_bna?on_conflict=fecha`, {
    method: 'POST',
    headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify(body),
  });
  if (!w.ok) {
    res.status(500).json({ error: 'No se pudo guardar la cotización', detalle: await w.text() });
    return;
  }
  res.status(200).json({ ...body, avisos: errores });
}
