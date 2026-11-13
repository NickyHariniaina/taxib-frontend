/**
 * Server-side proxy between the browser and the taxib API.
 *
 * The API key lives in the Vercel environment (`TAXIB_API_URL`, `TAXIB_API_KEY`) and never
 * reaches the bundle: the browser calls same-origin `/api/**`, Vercel routes it to this function,
 * which adds the key and passes the response straight through — cache headers included, so the
 * CDN absorbs the repeats.
 */
const UPSTREAM = (process.env.TAXIB_API_URL ?? '').replace(/\/+$/, '');
const API_KEY = process.env.TAXIB_API_KEY ?? '';

const UPSTREAM_TIMEOUT_MS = 10_000;
const CACHE_SECONDS = 300;

function problem(res, status, title) {
  res.status(status);
  res.setHeader('Content-Type', 'application/problem+json');
  res.setHeader('Cache-Control', 'no-store');
  res.send(JSON.stringify({ type: 'about:blank', title, status }));
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.setHeader('Allow', 'GET, HEAD');
    return problem(res, 405, 'Method Not Allowed');
  }

  if (!UPSTREAM || !API_KEY) {
    console.error('taxib proxy: TAXIB_API_URL or TAXIB_API_KEY is missing');
    return problem(res, 500, 'Proxy is not configured');
  }

  let upstream;
  try {
    upstream = await fetch(`${UPSTREAM}${req.url}`, {
      method: req.method,
      headers: { Accept: 'application/json', 'X-Api-Key': API_KEY },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch (error) {
    console.error('taxib proxy: upstream unreachable', error);
    return problem(res, 502, 'Bad Gateway');
  }

  const body = await upstream.text();
  res.status(upstream.status);
  res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
  res.setHeader(
    'Cache-Control',
    upstream.status === 200
      ? `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS * 2}`
      : 'no-store',
  );

  const retryAfter = upstream.headers.get('retry-after');
  if (retryAfter) {
    res.setHeader('Retry-After', retryAfter);
  }

  res.send(body);
}
