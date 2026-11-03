import { API_BASE_URL } from '$app/env/private';
import { error } from '@sveltejs/kit';

export async function load({ locals, fetch }) {
	// Normal users must never trigger the now admin-only companies endpoint.
	if (!locals.user?.user_roles.includes('admin')) return { companies: [], companiesError: null };
	if (!locals.jwt_token) error(401, 'Authentication required');
	try {
		const response = await fetch(new URL('/api/company', API_BASE_URL), {
			headers: { Authorization: `Bearer ${locals.jwt_token}` },
			redirect: 'manual',
			signal: AbortSignal.timeout(15000)
		});
		if (!response.ok) return { companies: [], companiesError: 'Companies could not be loaded.' };
		const companies = await response.json();
		return { companies: Array.isArray(companies) ? companies : [], companiesError: null };
	} catch {
		return { companies: [], companiesError: 'Backend temporarily unavailable.' };
	}
}
