/**
 * Base URL of the taxib API.
 *
 * In a production build the browser calls same-origin `/api/**`: the Vercel function
 * `api/[...path].js` adds the API key server-side and forwards the request, so no key ever ships
 * in the bundle. Locally, Vite talks to the backend directly.
 */
export const API_URL =
  import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? '' : 'http://localhost:8080');
