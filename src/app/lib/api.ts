export async function api(path: string, opts: RequestInit = {}) {
  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) } as Record<string,string>;
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`/api${path}`, { ...opts, headers });
  if (!res.ok) throw new Error((await res.json()).message || '请求失败');
  return res.json();
}
