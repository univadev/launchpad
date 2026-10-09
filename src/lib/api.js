// POST to one of our Netlify functions (/api/*) with the Clerk session token,
// which the functions require (see netlify/lib/requireUser.js).
export async function postApi(name, body) {
  let token = null
  try {
    token = (await window.Clerk?.session?.getToken()) ?? null
  } catch {
    token = null
  }
  return fetch(`/api/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  })
}
