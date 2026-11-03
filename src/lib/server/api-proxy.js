/** Only the existing Java API resources are exposed through this server boundary.
 * @param {string} path @param {string} method
 */
export function allowedApiRequest(path, method) {
	if (/^(company|job)$/.test(path)) return method === 'GET' || method === 'POST';
	if (/^(company|job)\/[a-zA-Z0-9_-]+$/.test(path)) return method === 'GET';
	if (path === 'service/jobdashboard') return method === 'GET';
	if (/^service\/(assignjob|completejob)$/.test(path)) return method === 'PUT';
	return false;
}

/** @param {Request} request @param {string} path @param {string} token @param {string} baseUrl
 * @param {typeof fetch} [send]
 */
export async function forwardApiRequest(request, path, token, baseUrl, send = fetch) {
	if (!token) return new Response('Authentication required', { status: 401 });
	if (!allowedApiRequest(path, request.method)) return new Response('Not found', { status: 404 });
	const source = new URL(request.url);
	if (request.method !== 'GET' && request.headers.get('origin') !== source.origin) {
		return new Response('Invalid request origin', { status: 403 });
	}
	const base = new URL(baseUrl);
	if (!['http:', 'https:'].includes(base.protocol) || base.username || base.password) {
		throw new Error('Invalid API_BASE_URL');
	}
	const target = new URL(`/api/${path}`, base);
	target.search = source.search;
	const headers = new Headers({ Authorization: `Bearer ${token}`, Accept: 'application/json' });
	const contentType = request.headers.get('content-type');
	if (contentType) headers.set('Content-Type', contentType);
	const response = await send(target, {
		method: request.method,
		headers,
		redirect: 'manual',
		body: request.method === 'GET' ? undefined : await request.arrayBuffer(),
		signal: AbortSignal.timeout(15000)
	});
	if (response.status >= 300 && response.status < 400) {
		return new Response('Unexpected API redirect', { status: 502 });
	}
	const outputHeaders = new Headers({ 'Cache-Control': 'private, no-store' });
	const outputType = response.headers.get('content-type');
	if (outputType) outputHeaders.set('Content-Type', outputType);
	// Never forward Java cookies, browser credentials, or token-bearing headers.
	return new Response(response.body, { status: response.status, headers: outputHeaders });
}
