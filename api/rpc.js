// Vercel serverless proxy for GenLayer Studio RPC calls.
// Browsers calling studio.genlayer.com/api directly get blocked (host not
// in the CORS allowlist for arbitrary origins). Routing through our own
// domain avoids that — Vercel functions aren't subject to browser CORS.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const upstream = await fetch('https://studio.genlayer.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(req.body),
    });
    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', 'application/json');
    res.send(text);
  } catch (err) {
    res.status(502).json({ error: { message: 'Proxy error: ' + err.message } });
  }
}
