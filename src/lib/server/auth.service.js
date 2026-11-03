import { AUTH0_DOMAIN, AUTH0_CLIENT_ID } from '$app/env/private';

const COOKIE = 'auth0_access_token';

export class AuthError extends Error {
	/** @param {string} message @param {number} [status] */
	constructor(message, status = 400) {
		super(message);
		this.status = status;
	}
}

function configuration() {
	if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !/^[a-z0-9.-]+$/i.test(AUTH0_DOMAIN)) {
		throw new AuthError(
			'Auth0 is not configured. Set AUTH0_DOMAIN and AUTH0_CLIENT_ID in .env.',
			503
		);
	}
	return { base: `https://${AUTH0_DOMAIN}`, clientId: AUTH0_CLIENT_ID };
}

/** @param {string} path @param {RequestInit} options */
async function authRequest(path, options) {
	const { base } = configuration();
	let response;
	try {
		response = await fetch(`${base}${path}`, { ...options, signal: AbortSignal.timeout(10000) });
	} catch {
		throw new AuthError(
			'Authentication service is temporarily unavailable. Please try again.',
			503
		);
	}
	if (!response.ok) {
		// Never expose provider responses, passwords or tokens in logs or form data.
		if (response.status === 429)
			throw new AuthError('Too many attempts. Please try again later.', 429);
		throw new AuthError(
			path === '/dbconnections/signup'
				? 'Registration failed. Check the email and password policy, or try logging in.'
				: 'Login failed. Check your email and password.',
			response.status >= 500 ? 503 : 400
		);
	}
	return response.json();
}

/** @param {string} token */
export async function getUser(token) {
	const user = await authRequest('/userinfo', { headers: { Authorization: `Bearer ${token}` } });
	if (typeof user.sub !== 'string') throw new AuthError('Invalid user profile.');
	return { sub: user.sub, name: user.name || user.nickname || user.email || user.sub };
}

/** @param {string} email @param {string} password @param {import('@sveltejs/kit').Cookies} cookies @param {boolean} secure */
export async function login(email, password, cookies, secure) {
	const { clientId } = configuration();
	const result = await authRequest('/oauth/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			grant_type: 'password',
			client_id: clientId,
			username: email,
			password,
			scope: 'openid profile email'
		})
	});
	if (
		typeof result.access_token !== 'string' ||
		!Number.isFinite(result.expires_in) ||
		result.expires_in <= 0
	) {
		throw new AuthError('Invalid authentication response.', 503);
	}
	await getUser(result.access_token);
	cookies.set(COOKIE, result.access_token, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure,
		maxAge: Math.min(result.expires_in, 86400)
	});
}

/** @param {string} email @param {string} password @param {import('@sveltejs/kit').Cookies} cookies @param {boolean} secure */
export async function signup(email, password, cookies, secure) {
	const { clientId } = configuration();
	await authRequest('/dbconnections/signup', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			client_id: clientId,
			email,
			password,
			connection: 'Username-Password-Authentication'
		})
	});
	try {
		await login(email, password, cookies, secure);
	} catch {
		throw new AuthError(
			'Account created, but automatic login failed. Please log in; do not register again.'
		);
	}
}

/** @param {import('@sveltejs/kit').Cookies} cookies */
export function logout(cookies) {
	cookies.delete(COOKIE, { path: '/' });
}

/** @param {import('@sveltejs/kit').Cookies} cookies */
export async function readSession(cookies) {
	const token = cookies.get(COOKIE);
	if (!token) return { user: null, jwt_token: null };
	try {
		return { user: await getUser(token), jwt_token: token };
	} catch (error) {
		if (error instanceof AuthError && error.status !== 503 && error.status !== 429) logout(cookies);
		return { user: null, jwt_token: null };
	}
}
