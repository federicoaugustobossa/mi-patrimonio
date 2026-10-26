// Devuelve la configuración pública de Supabase (la clave anon es pública por diseño;
// la seguridad la dan las políticas RLS de la base).
export default function handler(req, res) {
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    res.status(500).json({ error: 'Faltan SUPABASE_URL o SUPABASE_ANON_KEY en las variables de entorno de Vercel.' });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ url, anonKey, interpretar: Boolean(process.env.ANTHROPIC_API_KEY) });
}
