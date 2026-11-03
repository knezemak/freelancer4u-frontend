import { API_BASE_URL } from '$app/env/private';
import { forwardApiRequest } from '#lib/server/api-proxy.js';

/** @param {import('@sveltejs/kit').RequestEvent} event */
async function proxy({ request, params, locals }) {
	try {
		return await forwardApiRequest(
			request,
			params.path ?? '',
			locals.jwt_token ?? '',
			API_BASE_URL
		);
	} catch {
		return new Response('Backend temporarily unavailable', { status: 502 });
	}
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
