const API_URL = import.meta.env.VITE_API_URL
  || '/api';

export async function api(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
      body: options.body && typeof options.body !== 'string' ? JSON.stringify(options.body) : options.body
    });
  } catch (error) {
    if (error instanceof TypeError) {
      const guidance = import.meta.env.DEV
        ? 'Start both servers with "npm run dev" from the project folder.'
        : 'Check that the FoodLoop service is running.';
      throw new Error(
        `FoodLoop can't reach its API at ${API_URL}. ${guidance} For persistent data, configure MONGODB_URI and a unique 32+ character JWT_SECRET in the service environment.`
      );
    }
    throw error;
  }
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || `Request failed (${response.status}).`);
  return payload;
}
